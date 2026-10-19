import { downloadZip } from "client-zip";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { HttpError, route } from "@/lib/http";
import { zipPaths } from "@/lib/photos";
import { getObjectStream, originalKey } from "@/lib/r2";
import { viewerAlbum } from "@/lib/viewer";

// ponytail: originals stream through the server (Vercel bandwidth + 300s cap ≈ a few GB). Move to a Worker if albums get bigger.
export const maxDuration = 300;

/** Streamed, uncompressed (store) ZIP of originals: selected ids from the form, or the whole album. Per-person folders when several people uploaded. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/zip">) => {
  const { token } = await ctx.params;
  const album = await viewerAlbum(token, req);
  if (!album) throw new HttpError(404, "Not found");

  const ids = (await req.formData()).getAll("id").map(String).slice(0, 1000);
  const assets = await db.asset.findMany({
    where: { albumId: album.id, uploaded: true, ...(ids.length && { id: { in: ids } }) },
    orderBy: { createdAt: "asc" },
    include: { contributor: { select: { id: true, name: true } } },
  });
  if (!assets.length) throw new HttpError(404, "No photos");

  // Several uploaders (collaboration) → one folder per person.
  const owner = { id: "owner", name: (await db.user.findUnique({ where: { id: album.userId }, select: { name: true } }))?.name ?? "Owner" };
  const names = zipPaths(assets.map((a) => ({ filename: a.filename, by: a.contributor ?? owner })));
  const meta = assets.map((a, i) => ({ name: names[i], size: a.sizeBytes, lastModified: a.createdAt }));
  async function* files() {
    for (const [i, a] of assets.entries()) {
      yield { ...meta[i], input: await getObjectStream(originalKey(album!.id, a.id)) }; // one R2 read at a time
    }
  }

  const zipName = `${album.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "photos"}.zip`;
  const res = downloadZip(files(), { metadata: meta }); // metadata → exact Content-Length → real progress bar
  return new Response(res.body, {
    headers: {
      "content-type": "application/zip",
      "content-length": res.headers.get("content-length")!,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`,
      "cache-control": "no-store",
    },
  });
});
