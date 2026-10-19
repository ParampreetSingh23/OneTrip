import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.url(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  APP_SECRET: z.string().min(32), // auth sessions, unlock cookies, share-link encryption
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  CRON_SECRET: z.string().min(16),
  MAX_FILES: z.coerce.number().int().positive().default(500),
  MAX_FILES_PER_GUEST: z.coerce.number().int().positive().default(200), // per contributor in collaborations
  MAX_FILE_MB: z.coerce.number().positive().default(50),
  MAX_ALBUM_MB: z.coerce.number().positive().default(5000),
});

export const env = schema.parse(process.env);
