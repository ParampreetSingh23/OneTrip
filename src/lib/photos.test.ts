import { test } from "node:test";
import assert from "node:assert/strict";
import { photoMime, safeFilename, uniqueNames, zipPaths } from "./photos.ts";

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

test("zipPaths: flat for one uploader, per-person folders otherwise", () => {
  const owner = { id: "owner", name: "Param" };
  assert.deepEqual(zipPaths([{ filename: "a.jpg", by: owner }, { filename: "a.jpg", by: owner }]), ["a.jpg", "a (2).jpg"]);
  const riya1 = { id: "c1", name: "Riya" }, riya2 = { id: "c2", name: "Riya" }, evil = { id: "c3", name: "../etc/x" };
  assert.deepEqual(
    zipPaths([
      { filename: "IMG_1.jpg", by: owner },
      { filename: "IMG_1.jpg", by: riya1 },
      { filename: "IMG_1.jpg", by: riya1 },
      { filename: "IMG_1.jpg", by: riya2 },
      { filename: "x.jpg", by: evil },
    ]),
    ["Param/IMG_1.jpg", "Riya/IMG_1.jpg", "Riya/IMG_1 (2).jpg", "Riya (2)/IMG_1.jpg", "-etc-x/x.jpg"],
  );
});
