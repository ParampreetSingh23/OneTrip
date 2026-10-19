import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchPhoto } from "./download-client.ts";

test("photo downloads preserve every byte and report cumulative progress", async (t) => {
  const signal = new AbortController().signal;
  t.mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    assert.equal(init.signal, signal);
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0, 255, 42]));
        controller.enqueue(new Uint8Array([13, 10]));
        controller.close();
      },
    }));
  });
  const progress: number[] = [];
  const blob = await fetchPhoto("https://storage.example/photo", signal, (bytes) => progress.push(bytes));
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), new Uint8Array([0, 255, 42, 13, 10]));
  assert.deepEqual(progress, [3, 5]);
});

test("failed downloads surface an error without reporting progress", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 403 }));
  await assert.rejects(fetchPhoto("https://storage.example/photo", new AbortController().signal, () => assert.fail()), /Download failed \(403\)/);
});

test("closing the sheet aborts an in-progress original download", async (t) => {
  const abort = new AbortController();
  t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({
    start(controller) {
      abort.signal.addEventListener("abort", () => controller.error(abort.signal.reason), { once: true });
      controller.enqueue(new Uint8Array([1]));
    },
  })));
  await assert.rejects(fetchPhoto("https://storage.example/photo", abort.signal, () => abort.abort()), { name: "AbortError" });
});
