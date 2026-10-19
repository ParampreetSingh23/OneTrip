import { createDraft } from "@/lib/album";
import { route } from "@/lib/http";
import { apiUser } from "@/lib/session";

export const POST = route(async (req: Request) => {
  const user = await apiUser(req);
  return Response.json(await createDraft(user.id), { status: 201 });
});
