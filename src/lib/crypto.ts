// Pure node:crypto helpers. No app imports so `node --test` can run them directly.
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** 256-bit url-safe random token. */
export const newToken = () => randomBytes(32).toString("base64url");

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(pw, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = await scryptAsync(pw, Buffer.from(salt, "base64url"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Cookie value proving the password for this album was entered. */
export const unlockProof = (secret: string, albumId: string) =>
  createHmac("sha256", secret).update(`unlock:${albumId}`).digest("base64url");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** AES-256-GCM so the owner can see a share link again without storing it in plain text. */
export function encrypt(secret: string, plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(secret: string, sealed: string) {
  const [iv, tag, data] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
