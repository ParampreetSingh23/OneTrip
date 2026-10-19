import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { HttpError, route } from "@/lib/http";
import { originalKey, presignGet } from "@/lib/r2";
import { viewerAlbum } from "@/lib/viewer";

/** Original file, byte-identical, as a short-lived attachment download. */
export const GET = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/photos/[assetId]">) => {
  const { token, assetId } = await ctx.params;
  const album = await viewerAlbum(token, (n) => req.cookies.get(n)?.value);
  const asset = album && (await db.asset.findFirst({ where: { id: assetId, albumId: album.id, uploaded: true } }));
  if (!album || !asset) throw new HttpError(404, "Not found");

  const url = await presignGet(originalKey(album.id, asset.id), { filename: asset.filename });
  return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store" } });
});
