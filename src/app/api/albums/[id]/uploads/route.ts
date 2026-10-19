import { z } from "zod";
import { addUploads, requireOwnedDraft } from "@/lib/album";
import { body, route } from "@/lib/http";
import { apiUser } from "@/lib/session";

const schema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(500),
        type: z.string().max(100),
        size: z.number().int().positive(),
        thumbSize: z.number().int().positive().max(2_000_000).optional(),
      }),
    )
    .min(1)
    .max(50),
});

export const POST = route(async (req: Request, ctx: RouteContext<"/api/albums/[id]/uploads">) => {
  const { id } = await ctx.params;
  await requireOwnedDraft(id, (await apiUser(req)).id);
  const { files } = await body(req, schema);
  return Response.json({ uploads: await addUploads(id, files) });
});
