import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";
import { env } from "./env";

export const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: env.APP_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  // Stay signed in 7 days; each day of use pushes expiry forward again (sliding session).
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  socialProviders: googleEnabled
    ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! } }
    : {},
  plugins: [nextCookies()], // must stay last
});
