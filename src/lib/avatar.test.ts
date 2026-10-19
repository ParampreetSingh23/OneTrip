import { test } from "node:test";
import assert from "node:assert/strict";
import { avatarLook } from "./avatar.ts";

test("avatar is stable per seed and differs between people with the same name", () => {
  assert.deepEqual(avatarLook("c1", "Riya"), avatarLook("c1", "Riya"));
  const looks = new Set(["a", "b", "c", "d", "e", "f"].map((s) => JSON.stringify(avatarLook(s, "Riya"))));
  assert.equal(looks.size, 6);
});

test("initials", () => {
  assert.equal(avatarLook("x", "riya sharma").initials, "RS");
  assert.equal(avatarLook("x", "Param").initials, "PA");
  assert.equal(avatarLook("x", "  ").initials, "?");
  assert.equal(avatarLook("x", "😀 fun").initials, "😀F");
});
