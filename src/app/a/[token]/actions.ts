"use server";

import { cookies } from "next/headers";
import { unlockProof, verifyPassword } from "@/lib/crypto";
import { env } from "@/lib/env";
import { isLimited, recordFailure } from "@/lib/rate-limit";
import { findActiveAlbum, unlockCookieName } from "@/lib/viewer";

const UNLOCK_MAX_FAILS = 10;
const UNLOCK_WINDOW_MS = 15 * 60_000;

export async function unlock(token: string, _prev: { error: string | null }, form: FormData) {
  const album = await findActiveAlbum(token);
  if (!album?.passwordHash) return { error: "This album is no longer available." };

  // Per-album guess limit so short passwords can't be brute-forced (shared across serverless instances).
  // Trade-off: a guesser can briefly lock out real viewers of that one album.
  const key = `unlock:${album.id}`;
  if (await isLimited(key, UNLOCK_MAX_FAILS, UNLOCK_WINDOW_MS)) {
    return { error: "Too many wrong tries. Please wait 15 minutes and try again." };
  }
  const password = String(form.get("password") ?? "").slice(0, 128);
  if (!(await verifyPassword(password, album.passwordHash))) {
    await recordFailure(key, UNLOCK_WINDOW_MS);
    return { error: "Wrong password." };
  }

  (await cookies()).set(unlockCookieName(album.id), unlockProof(env.APP_SECRET, album.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: album.expiresAt,
  });
  return { error: null };
}
