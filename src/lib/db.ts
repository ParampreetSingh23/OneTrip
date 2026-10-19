import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "./env";

// Reuse one client across hot reloads in dev.
const g = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  g.prisma ??
  new PrismaClient({ adapter: new PrismaNeon({ connectionString: env.DATABASE_URL }) });

if (process.env.NODE_ENV !== "production") g.prisma = db;
