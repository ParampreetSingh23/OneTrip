import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile();
} catch {} // no .env file: rely on real env vars (CI, Vercel)

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Plain read (not env()) so `prisma generate` works without a DB URL.
  // CLI uses the direct (non-pooler) URL: migrations need session-level locks.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
});
