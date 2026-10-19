import "server-only";
import type { NextRequest } from "next/server";
import type { Album } from "@/generated/prisma/client";
import { newToken, sha256 } from "./crypto";
import { db } from "./db";
import { HttpError } from "./http";
import { viewerAlbum } from "./viewer";

/** httpOnly cookie holding a guest's random key for one album. Key hash in DB = their identity. */
export const contributorCookieName = (albumId: string) => `oc_${albumId}`;

export async function currentContributor(albumId: string, cookieValue: string | undefined) {
  if (!cookieValue) return null;
  const c = await db.contributor.findUnique({ where: { keyHash: sha256(cookieValue) } });
  return c?.albumId === albumId ? c : null;
}

export function cookieOptions(album: Album) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: album.expiresAt,
  };
}

export async function join(album: Album, name: string) {
  const key = newToken();
  const contributor = await db.contributor.create({ data: { albumId: album.id, name, keyHash: sha256(key) } });
  return { key, contributor };
}

/** Readable (token + password ok) and collaboration on. Throws 404 / 403. */
export async function collabAlbum(token: string, req: NextRequest) {
  const album = await viewerAlbum(token, req);
  if (!album) throw new HttpError(404, "Not found");
  if (!album.collaborative) throw new HttpError(403, "The owner has turned off adding photos");
  return album;
}

/** Collaborative album + the guest calling (must have joined). */
export async function requireGuest(token: string, req: NextRequest) {
  const album = await collabAlbum(token, req);
  const me = await currentContributor(album.id, req.cookies.get(contributorCookieName(album.id))?.value);
  if (!me) throw new HttpError(401, "Add your name first");
  return { album, me };
}
