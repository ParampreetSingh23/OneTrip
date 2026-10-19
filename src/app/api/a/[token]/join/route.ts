import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { collabAlbum, contributorCookieName, cookieOptions, currentContributor, join } from "@/lib/collab";
import { body, route } from "@/lib/http";

const schema = z.object({ name: z.string().trim().min(1).max(40) });

/** Guest joins a collaboration with just a name. Re-joining from the same browser keeps the same identity. */
export const POST = route(async (req: NextRequest, ctx: RouteContext<"/api/a/[token]/join">) => {
  const { token } = await ctx.params;
  const album = await collabAlbum(token, req);
  const { name } = await body(req, schema);
  const existing = await currentContributor(album.id, req.cookies.get(contributorCookieName(album.id))?.value);
  if (existing) return Response.json({ id: existing.id, name: existing.name });

  const { key, contributor } = await join(album, name);
  (await cookies()).set(contributorCookieName(album.id), key, cookieOptions(album));
  return Response.json({ id: contributor.id, name: contributor.name }, { status: 201 });
});
