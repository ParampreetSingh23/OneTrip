import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { body, HttpError, route } from "@/lib/http";
import { originalKey, presignGet } from "@/lib/r2";
import { viewerAlbum } from "@/lib/viewer";

const schema = z.object({ ids: z.array(z.string().max(40)).min(1).max(50) });

/** Short-lived direct URLs for a batch of originals (browser fetches them for "Save to Photos"). */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/urls">) => {
  const { token } = await ctx.params;
  const album = await viewerAlbum(token, (n) => req.cookies.get(n)?.value);
  if (!album) throw new HttpError(404, "Not found");
  const { ids } = await body(req, schema);
  const assets = await db.asset.findMany({
    where: { albumId: album.id, uploaded: true, id: { in: ids } },
    select: { id: true, filename: true, mimeType: true },
  });
  const urls = await Promise.all(
    assets.map(async (a) => ({ ...a, url: await presignGet(originalKey(album.id, a.id)) })),
  );
  return Response.json({ urls });
});
