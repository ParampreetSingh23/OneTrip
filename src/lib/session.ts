import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { HttpError } from "./http";

/** Signed-in user for pages; redirects to /login otherwise. */
export async function pageUser(next: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session.user;
}

/** Signed-in user for API routes; 401 otherwise. */
export async function apiUser(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) throw new HttpError(401, "Please sign in");
  return session.user;
}
