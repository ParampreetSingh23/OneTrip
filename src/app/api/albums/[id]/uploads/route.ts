import { addUploads, requireOwnedAlbum, uploadBody } from "@/lib/album";
import { body, route } from "@/lib/http";
import { apiUser } from "@/lib/session";

export const POST = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]/uploads">) => {
  const { id } = await ctx.params;
  await requireOwnedAlbum(id, (await apiUser(req)).id); // drafts and published collections (add more)
  const { files } = await body(req, uploadBody);
  return Response.json({ uploads: await addUploads(id, files) });
});
