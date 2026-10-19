import { test } from "node:test";
import assert from "node:assert/strict";
import { photoMime, safeFilename, uniqueNames } from "./photos.ts";

test("photoMime trusts allowed types, falls back to extension, rejects others", () => {
  assert.equal(photoMime("a.jpg", "image/jpeg"), "image/jpeg");
  assert.equal(photoMime("IMG_1.HEIC", ""), "image/heic");
  assert.equal(photoMime("IMG_1.heic", "application/octet-stream"), "image/heic");
  assert.equal(photoMime("x.svg", "image/svg+xml"), null);
  assert.equal(photoMime("x.html", "text/html"), null);
});

test("safeFilename strips paths and control chars", () => {
  assert.equal(safeFilename("../../etc/IMG_1.jpg"), "IMG_1.jpg");
  assert.equal(safeFilename("C:\\x\\a\nb.jpg"), "ab.jpg");
  assert.equal(safeFilename("   "), "photo");
});

test("uniqueNames de-duplicates for ZIPs without touching unique names", () => {
  assert.deepEqual(uniqueNames(["a.jpg", "b.jpg", "A.JPG", "a.jpg", "a (2).jpg", "noext", "noext"]), [
    "a.jpg",
    "b.jpg",
    "A (2).JPG",
    "a (3).jpg",
    "a (2) (2).jpg",
    "noext",
    "noext (2)",
  ]);
});
