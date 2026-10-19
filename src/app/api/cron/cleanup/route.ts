import { destroyAlbum } from "@/lib/album";
import { safeEqual } from "@/lib/crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { HttpError, route } from "@/lib/http";

export const maxDuration = 300;

/**
 * Deletes expired albums (published past expiry, or drafts abandoned 24h) — files first, then rows.
 * Idempotent: a failed album keeps its row and is retried next run. Vercel Cron sends `Bearer CRON_SECRET`.
 */
export const GET = route(async (req: Request) => {
  if (!safeEqual(req.headers.get("authorization") ?? "", `Bearer ${env.CRON_SECRET}`)) throw new HttpError(401, "Unauthorized");

  const expired = await db.album.findMany({
    where: { expiresAt: { lte: new Date() } },
    orderBy: { expiresAt: "asc" },
    select: { id: true },
    take: 200, // ponytail: bounded per run; backlog drains over runs (lifecycle rule is the backstop)
  });

  const failed: string[] = [];
  for (const { id } of expired) {
    try {
      await destroyAlbum(id);
    } catch (e) {
      console.error("cleanup failed", id, e);
      failed.push(id);
    }
  }
  return Response.json({ deleted: expired.length - failed.length, failed });
});
