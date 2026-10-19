import { z } from "zod";
import { publish, requireOwnedDraft } from "@/lib/album";
import { body, route } from "@/lib/http";
import { apiUser } from "@/lib/session";

const schema = z.object({
  title: z.string().trim().min(1).max(80),
  expiry: z.enum(["24h", "3d", "7d"]),
  password: z.string().min(4).max(128).optional(),
});

export const POST = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]/publish">) => {
  const { id } = await ctx.params;
  await requireOwnedDraft(id, (await apiUser(req)).id);
  return Response.json(await publish(id, await body(req, schema)));
});
