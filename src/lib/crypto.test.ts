import { test } from "node:test";
import assert from "node:assert/strict";
import { decrypt, encrypt, hashPassword, newToken, safeEqual, sha256, unlockProof, verifyPassword } from "./crypto.ts";

test("tokens are unique, url-safe, 256-bit", () => {
  const a = newToken();
  assert.match(a, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(a, newToken());
  assert.equal(sha256(a), sha256(a));
});

test("password hash verifies only the right password", async () => {
  const h = await hashPassword("hunter2");
  assert.ok(await verifyPassword("hunter2", h));
  assert.ok(!(await verifyPassword("hunter3", h)));
  assert.ok(!(await verifyPassword("hunter2", "garbage")));
});

test("unlock proof is album-specific", () => {
  const s = "x".repeat(32);
  assert.ok(safeEqual(unlockProof(s, "a1"), unlockProof(s, "a1")));
  assert.ok(!safeEqual(unlockProof(s, "a1"), unlockProof(s, "a2")));
});

test("encrypt round-trips and rejects tampering or wrong key", () => {
  const s = "k".repeat(32);
  const tok = newToken();
  const sealed = encrypt(s, tok);
  assert.notEqual(sealed, encrypt(s, tok)); // random IV
  assert.equal(decrypt(s, sealed), tok);
  assert.throws(() => decrypt("z".repeat(32), sealed));
  const [iv, tag, data] = sealed.split(".");
  const flipped = Buffer.from(data, "base64url");
  flipped[0] ^= 1; // flip a real bit (editing base64 text can hit ignored padding bits)
  assert.throws(() => decrypt(s, [iv, tag, flipped.toString("base64url")].join(".")));
});
