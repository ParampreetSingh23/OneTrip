import type { NextRequest } from "next/server";
import { addUploads, uploadBody } from "@/lib/album";
import { requireGuest } from "@/lib/collab";
import { body, route } from "@/lib/http";

/** Guest upload grants (collaboration on, joined). Same limits as owner plus a per-person cap. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/uploads">) => {
  const { album, me } = await requireGuest((await ctx.params).token, req);
  const { files } = await body(req, uploadBody);
  return Response.json({ uploads: await addUploads(album.id, files, me.id) });
});
