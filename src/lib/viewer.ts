import "server-only";
import type { Album } from "@/generated/prisma/client";
import { db } from "./db";
import { env } from "./env";
import { safeEqual, sha256, unlockProof } from "./crypto";
import { presignGet, thumbKey } from "./r2";

const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

/** The published, unexpired album for a share token, or null. Single gate for every viewer request. */
export async function findActiveAlbum(token: string) {
  if (!TOKEN_RE.test(token)) return null;
  const album = await db.album.findUnique({ where: { tokenHash: sha256(token) } });
  if (!album || album.status !== "ACTIVE" || album.expiresAt <= new Date()) return null;
  return album;
}

export const unlockCookieName = (albumId: string) => `ot_${albumId}`;

export function isUnlocked(album: Album, cookieValue: string | undefined) {
  if (!album.passwordHash) return true;
  return !!cookieValue && safeEqual(cookieValue, unlockProof(env.APP_SECRET, album.id));
}

/** Album the caller may read (token valid, unexpired, password satisfied), or null. */
export async function viewerAlbum(token: string, cookieOf: (name: string) => string | undefined) {
  const album = await findActiveAlbum(token);
  if (!album || !isUnlocked(album, cookieOf(unlockCookieName(album.id)))) return null;
  return album;
}

/** Uploaded photos with preview URLs that stay loadable while the page is open, never past expiry. */
export async function listPhotos(album: Album) {
  const ttl = Math.max(60, Math.min(3 * 3600, Math.floor((album.expiresAt.getTime() - Date.now()) / 1000)));
  const assets = await db.asset.findMany({
    where: { albumId: album.id, uploaded: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, filename: true, sizeBytes: true, hasThumb: true },
  });
  return Promise.all(
    assets.map(async (a) => ({
      id: a.id,
      filename: a.filename,
      sizeBytes: a.sizeBytes,
      previewUrl: a.hasThumb ? await presignGet(thumbKey(album.id, a.id), { expiresIn: ttl }) : null,
    })),
  );
}
