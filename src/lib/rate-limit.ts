import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";

/**
 * Fixed-window failure counter in the shared "rateLimit" table (DB-backed so it holds on serverless).
 * ponytail: check-then-verify, so N parallel guesses can overshoot `max` by ~N; fine for a 10-try limit.
 */
export async function isLimited(key: string, max: number, windowMs: number) {
  const row = await db.rateLimit.findUnique({ where: { key } });
  return !!row && row.count >= max && Date.now() - Number(row.lastRequest) < windowMs;
}

/** Count one failure atomically; starts a new window when the old one has passed. */
export async function recordFailure(key: string, windowMs: number) {
  const now = BigInt(Date.now());
  const windowStart = now - BigInt(windowMs);
  await db.$executeRaw`
    INSERT INTO "rateLimit" (id, key, count, "lastRequest") VALUES (${randomUUID()}, ${key}, 1, ${now})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "rateLimit"."lastRequest" < ${windowStart} THEN 1 ELSE "rateLimit".count + 1 END,
      "lastRequest" = CASE WHEN "rateLimit"."lastRequest" < ${windowStart} THEN ${now} ELSE "rateLimit"."lastRequest" END`;
}
