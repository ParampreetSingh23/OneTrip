import { commitAdded, requireOwnedAlbum } from "@/lib/album";
import { HttpError, route } from "@/lib/http";
import { apiUser } from "@/lib/session";

/** Finish "add photos" on a published collection: verified uploads become visible to viewers. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]/commit">) => {
  const { id } = await ctx.params;
  const album = await requireOwnedAlbum(id, (await apiUser(req)).id);
  if (album.status !== "ACTIVE") throw new HttpError(409, "Publish this collection first");
  return Response.json(await commitAdded(id));
});
