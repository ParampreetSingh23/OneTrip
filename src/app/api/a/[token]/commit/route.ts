import type { NextRequest } from "next/server";
import { commitAdded } from "@/lib/album";
import { requireGuest } from "@/lib/collab";
import { route } from "@/lib/http";

/** Guest finished uploading: their verified photos become visible to everyone. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/commit">) => {
  const { album, me } = await requireGuest((await ctx.params).token, req);
  return Response.json(await commitAdded(album.id, me.id));
});
