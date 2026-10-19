"use server";

import { cookies } from "next/headers";
import { unlockProof, verifyPassword } from "@/lib/crypto";
import { env } from "@/lib/env";
import { findActiveAlbum, unlockCookieName } from "@/lib/viewer";

export async function unlock(token: string, _prev: { error: string | null }, form: FormData) {
  const album = await findActiveAlbum(token);
  if (!album?.passwordHash) return { error: "This album is no longer available." };

  // ponytail: no attempt limit yet; scrypt makes guessing slow. Rate limit in Phase 6.
  const password = String(form.get("password") ?? "").slice(0, 128);
  if (!(await verifyPassword(password, album.passwordHash))) return { error: "Wrong password." };

  (await cookies()).set(unlockCookieName(album.id), unlockProof(env.APP_SECRET, album.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: album.expiresAt,
  });
  return { error: null };
}
