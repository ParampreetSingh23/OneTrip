import type { NextRequest } from "next/server";
import { z } from "zod";
import { deletePhotos } from "@/lib/album";
import { contributorCookieName, currentContributor } from "@/lib/collab";
import { body, HttpError, route } from "@/lib/http";
import { viewerAlbum } from "@/lib/viewer";

const schema = z.object({ ids: z.array(z.string().max(40)).min(1).max(1000) });

/** Guest deletes their own photos (works even after the owner turns collaboration off). */
export const DELETE = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/mine">) => {
  const album = await viewerAlbum((await ctx.params).token, req);
  const me = album && (await currentContributor(album.id, req.cookies.get(contributorCookieName(album.id))?.value));
  if (!album || !me) throw new HttpError(404, "Not found");
  return Response.json(await deletePhotos(album.id, (await body(req, schema)).ids, me.id));
});
