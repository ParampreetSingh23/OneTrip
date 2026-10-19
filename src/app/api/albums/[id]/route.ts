import { deleteOwnedAlbum } from "@/lib/album";
import { route } from "@/lib/http";
import { apiUser } from "@/lib/session";

/** Owner deletes a collection early: files and link gone now, not at expiry. */
export const DELETE = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]">) => {
  const user = await apiUser(req);
  await deleteOwnedAlbum((await ctx.params).id, user.id);
  return new Response(null, { status: 204 });
});
