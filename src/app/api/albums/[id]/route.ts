import { z } from "zod";
import { deleteOwnedAlbum, requireOwnedAlbum, setCollaborative } from "@/lib/album";
import { body, HttpError, route } from "@/lib/http";
import { apiUser } from "@/lib/session";

/** Owner deletes a collection early: files and link gone now, not at expiry. */
export const DELETE = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]">) => {
  const user = await apiUser(req);
  await deleteOwnedAlbum((await ctx.params).id, user.id);
  return new Response(null, { status: 204 });
});

const patch = z.object({ collaborative: z.boolean() });

/** Owner turns collaboration on/off. Off freezes new guest uploads; existing photos stay. */
export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]">) => {
  const album = await requireOwnedAlbum((await ctx.params).id, (await apiUser(req)).id);
  if (album.status !== "ACTIVE") throw new HttpError(409, "Publish this collection first");
  const { collaborative } = await body(req, patch);
  await setCollaborative(album.id, collaborative);
  return Response.json({ collaborative });
});
