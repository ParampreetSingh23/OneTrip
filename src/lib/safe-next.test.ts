import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext } from "./safe-next.ts";

const O = "https://onetrip.example";

test("safeNext keeps same-origin paths", () => {
  assert.equal(safeNext("/dashboard", O), "/dashboard");
  assert.equal(safeNext("/a/abc?x=1#y", O), "/a/abc?x=1#y");
});

test("safeNext blocks every way of leaving the site", () => {
  for (const evil of ["//evil.example", "/\\evil.example", "/\t/evil.example", "https://evil.example", "javascript:alert(1)", "evil", "", null]) {
    assert.equal(safeNext(evil, O), "/dashboard", String(evil));
  }
});
