import "server-only";
import { z } from "zod";
import { db } from "./db";
import { env } from "./env";
import { decrypt, encrypt, hashPassword, newToken, sha256 } from "./crypto";
import { HttpError } from "./http";
import { EXPIRY_HOURS, type Expiry, photoMime, safeFilename } from "./photos";
import { albumPrefix, deleteKeys, deletePrefix, listObjects, originalKey, presignGet, presignPut, thumbKey } from "./r2";

const HOUR = 3600_000;
const MB = 1024 * 1024;

export async function createDraft(userId: string) {
  const shareToken = newToken();
  const album = await db.album.create({
    data: {
      userId,
      title: "Untitled collection",
      tokenHash: sha256(shareToken),
      shareTokenEnc: encrypt(env.APP_SECRET, shareToken),
      expiresAt: new Date(Date.now() + 24 * HOUR), // abandoned drafts expire like albums
    },
  });
  return { albumId: album.id };
}

/** Caller's own unexpired album (draft or published), or 404 (never reveal whether it exists). */
export async function requireOwnedAlbum(albumId: string, userId: string) {
  const album = await db.album.findUnique({ where: { id: albumId } });
  if (!album || album.userId !== userId || album.expiresAt <= new Date()) {
    throw new HttpError(404, "Collection not found or expired");
  }
  return album;
}

export async function requireOwnedDraft(albumId: string, userId: string) {
  const album = await requireOwnedAlbum(albumId, userId);
  if (album.status !== "DRAFT") throw new HttpError(409, "This collection is already published");
  return album;
}

export const shareUrl = (baseUrl: string, sealedToken: string) => `${baseUrl}/a/${decrypt(env.APP_SECRET, sealedToken)}`;

/** Owner's unexpired collections, newest first. */
export async function listAlbums(userId: string) {
  const albums = await db.album.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: {
      assets: {
        where: { uploaded: true },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true, sizeBytes: true, hasThumb: true },
      },
      _count: { select: { contributors: true } },
    },
  });
  return Promise.all(
    albums.map(async (a) => {
      const cover = a.assets.find((asset) => asset.hasThumb);
      return {
        id: a.id,
        title: a.title,
        status: a.status,
        expiresAt: a.expiresAt.toISOString(),
        hasPassword: !!a.passwordHash,
        collaborative: a.collaborative,
        contributorCount: a._count.contributors, // guests who joined (owner not included)
        photoCount: a.assets.length,
        totalBytes: a.assets.reduce((s, x) => s + x.sizeBytes, 0),
        url: a.status === "ACTIVE" ? shareUrl(env.BETTER_AUTH_URL, a.shareTokenEnc) : null,
        coverUrl: cover ? await presignGet(thumbKey(a.id, cover.id), {
          expiresIn: Math.max(1, Math.min(300, Math.floor((a.expiresAt.getTime() - Date.now()) / 1000))),
        }) : null,
      };
    }),
  );
}

/** Files first, then the row: a failed R2 delete leaves the row for cleanup to retry. */
export async function destroyAlbum(albumId: string) {
  await deletePrefix(albumPrefix(albumId));
  await db.album.deleteMany({ where: { id: albumId } });
}

export async function deleteOwnedAlbum(albumId: string, userId: string) {
  const album = await db.album.findUnique({ where: { id: albumId }, select: { userId: true } });
  if (!album || album.userId !== userId) throw new HttpError(404, "Not found");
  await destroyAlbum(albumId);
}

/** Request body for any upload-grant route (owner or guest). */
export const uploadBody = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(500),
        type: z.string().max(100),
        size: z.number().int().positive(),
        thumbSize: z.number().int().positive().max(2_000_000).optional(),
      }),
    )
    .min(1)
    .max(50),
});
export type UploadRequest = z.infer<typeof uploadBody>["files"][number];

/** `by` = contributor id for guests, null for the owner. Guests also get a per-person cap. */
export async function addUploads(albumId: string, files: UploadRequest[], by: string | null = null) {
  const prepared = files.map((f) => {
    const mimeType = photoMime(f.name, f.type);
    if (!mimeType) throw new HttpError(415, `${f.name}: only JPEG, PNG, HEIC, WebP photos are supported`);
    if (f.size > env.MAX_FILE_MB * MB) throw new HttpError(413, `${f.name} is larger than ${env.MAX_FILE_MB} MB`);
    return { ...f, mimeType, filename: safeFilename(f.name) };
  });

  // ponytail: check-then-insert, so concurrent requests can overshoot limits by one batch; fine at 4-way concurrency.
  const totals = await db.asset.aggregate({ where: { albumId }, _count: true, _sum: { sizeBytes: true } });
  if (totals._count + files.length > env.MAX_FILES) throw new HttpError(413, `Max ${env.MAX_FILES} photos per album`);
  const newBytes = files.reduce((s, f) => s + f.size, 0);
  if ((totals._sum.sizeBytes ?? 0) + newBytes > env.MAX_ALBUM_MB * MB) {
    throw new HttpError(413, `Album is limited to ${Math.round(env.MAX_ALBUM_MB / 1024)} GB`);
  }
  if (by) {
    const mine = await db.asset.count({ where: { albumId, contributorId: by } });
    if (mine + files.length > env.MAX_FILES_PER_GUEST) {
      throw new HttpError(413, `Each person can add up to ${env.MAX_FILES_PER_GUEST} photos`);
    }
  }

  const assets = await db.asset.createManyAndReturn({
    data: prepared.map((f) => ({ albumId, contributorId: by, filename: f.filename, mimeType: f.mimeType, sizeBytes: f.size })),
    select: { id: true },
  });

  return Promise.all(
    assets.map(async ({ id }, i) => {
      const f = prepared[i];
      return {
        assetId: id,
        url: await presignPut(originalKey(albumId, id), f.mimeType, f.size),
        contentType: f.mimeType,
        thumbUrl: f.thumbSize ? await presignPut(thumbKey(albumId, id), "image/jpeg", f.thumbSize) : null,
      };
    }),
  );
}

/**
 * Mark pending assets whose original really landed in R2 (size must match) as uploaded; drop the rest.
 * Viewers only ever see uploaded assets, so pending ones stay invisible until this runs.
 */
async function verifyUploads(albumId: string, by: string | null = null) {
  // Only this uploader's pending rows: others may still be mid-upload in a collaborative album.
  const mine = { albumId, uploaded: false, contributorId: by };
  const [objects, pending] = await Promise.all([
    listObjects(albumPrefix(albumId)),
    db.asset.findMany({ where: mine, select: { id: true, sizeBytes: true } }),
  ]);
  const ok = pending.filter((a) => objects.get(originalKey(albumId, a.id)) === a.sizeBytes);
  const okIds = ok.map((a) => a.id);
  const withThumb = ok.filter((a) => objects.has(thumbKey(albumId, a.id))).map((a) => a.id);
  await db.$transaction([
    // ponytail: objects of dropped assets stay in R2 until album cleanup deletes the whole prefix.
    db.asset.deleteMany({ where: { ...mine, id: { notIn: okIds } } }),
    db.asset.updateMany({ where: { id: { in: okIds } }, data: { uploaded: true } }),
    db.asset.updateMany({ where: { id: { in: withThumb } }, data: { hasThumb: true } }),
  ]);
  return { added: ok.length, dropped: pending.length - ok.length };
}

/** First publish of a draft: verify uploads, then activate with title/expiry/password. */
export async function publish(albumId: string, opts: { title: string; expiry: Expiry; password?: string }) {
  const { added, dropped } = await verifyUploads(albumId);
  if (added === 0) throw new HttpError(400, "No photos finished uploading");
  const album = await db.album.update({
    where: { id: albumId },
    data: {
      status: "ACTIVE",
      title: opts.title,
      expiresAt: new Date(Date.now() + EXPIRY_HOURS[opts.expiry] * HOUR),
      passwordHash: opts.password ? await hashPassword(opts.password) : null,
    },
  });
  return { photoCount: added, dropped, url: shareUrl(env.BETTER_AUTH_URL, album.shareTokenEnc) };
}

/** Photos added to an already-published collection become visible here. Expiry is unchanged. */
export async function commitAdded(albumId: string, by: string | null = null) {
  return verifyUploads(albumId, by);
}

/** Owner removes photos: originals + previews from R2, then rows. */
/** Owner: any photo (`onlyBy` undefined). Guest: only their own (`onlyBy` = their contributor id). */
export async function deletePhotos(albumId: string, ids: string[], onlyBy?: string) {
  const assets = await db.asset.findMany({
    where: { albumId, id: { in: ids }, ...(onlyBy && { contributorId: onlyBy }) },
    select: { id: true },
  });
  await deleteKeys(assets.flatMap((a) => [originalKey(albumId, a.id), thumbKey(albumId, a.id)]));
  await db.asset.deleteMany({ where: { albumId, id: { in: assets.map((a) => a.id) } } });
  return { deleted: assets.length };
}

export async function setCollaborative(albumId: string, on: boolean) {
  await db.album.update({ where: { id: albumId }, data: { collaborative: on } });
}
