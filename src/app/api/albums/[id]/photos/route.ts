import { z } from "zod";
import { deletePhotos, requireOwnedAlbum } from "@/lib/album";
import { body, route } from "@/lib/http";
import { apiUser } from "@/lib/session";

const schema = z.object({ ids: z.array(z.string().max(40)).min(1).max(1000) });

/** Owner deletes selected photos from a collection. */
export const DELETE = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]/photos">) => {
  const { id } = await ctx.params;
  await requireOwnedAlbum(id, (await apiUser(req)).id);
  return Response.json(await deletePhotos(id, (await body(req, schema)).ids));
});
