"use client";

import { useEffect, useRef, useState } from "react";
import { photoMime } from "./photos";
import { ApiError, api, makeThumb, putFile, sleep } from "./upload-client";

const CONCURRENCY = 4;
const AUTO_RETRIES = 3;

export type UploadStatus = "queued" | "uploading" | "done" | "failed";
export type UploadItem = { id: number; name: string; size: number; status: UploadStatus; progress: number; preview?: string; error?: string };
type Grant = { assetId: string; url: string; contentType: string; thumbUrl: string | null };
type Entry = { file: File; thumb?: Blob | null; grant?: Grant; status?: UploadStatus };

/**
 * Bulk photo upload engine: bounded concurrency, per-file progress, auto + manual retry,
 * browser-made previews, wake lock + leave warning while busy.
 * `grantsPath` resolves the upload-grant endpoint (async so a new collection can be created lazily).
 * `onSettled` fires whenever the queue drains (incl. after retries), with this batch's tally.
 */
export function useUploads(grantsPath: () => Promise<string>, onSettled?: (r: { done: number; failed: number }) => void) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [skipped, setSkipped] = useState(0);
  // Upload machinery lives in refs; only display state goes through React.
  const entries = useRef(new Map<number, Entry>());
  const queue = useRef<number[]>([]);
  const active = useRef(0);
  const nextId = useRef(0);

  const patch = (id: number, p: Partial<UploadItem>) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...p } : i)));

  async function uploadOne(id: number) {
    const entry = entries.current.get(id)!;
    patch(id, { status: "uploading", progress: 0, error: undefined });
    if (entry.thumb === undefined) {
      entry.thumb = await makeThumb(entry.file);
      if (entry.thumb) patch(id, { preview: URL.createObjectURL(entry.thumb) });
    }
    for (let attempt = 1; ; attempt++) {
      try {
        if (!entry.grant) {
          const { uploads } = await api<{ uploads: Grant[] }>(await grantsPath(), {
            body: { files: [{ name: entry.file.name, type: entry.file.type, size: entry.file.size, thumbSize: entry.thumb?.size }] },
          });
          entry.grant = uploads[0];
        }
        const g = entry.grant;
        if (g.thumbUrl && entry.thumb) await putFile(g.thumbUrl, entry.thumb, "image/jpeg");
        await putFile(g.url, entry.file, g.contentType, (p) => patch(id, { progress: p }));
        entry.status = "done";
        patch(id, { status: "done", progress: 1 });
        return;
      } catch (e) {
        const permanent = e instanceof ApiError && e.status < 500; // limits, bad type, paused, expired
        if (permanent || attempt >= AUTO_RETRIES) {
          entry.status = "failed";
          patch(id, { status: "failed", error: (e as Error).message });
          return;
        }
        await sleep(1000 * 2 ** (attempt - 1));
      }
    }
  }

  function pump() {
    while (active.current < CONCURRENCY && queue.current.length) {
      const id = queue.current.shift()!;
      active.current++;
      uploadOne(id).finally(() => {
        active.current--;
        pump();
        if (active.current === 0 && !queue.current.length && entries.current.size) {
          const all = [...entries.current.values()];
          onSettled?.({ done: all.filter((e) => e.status === "done").length, failed: all.filter((e) => e.status === "failed").length });
        }
      });
    }
  }

  function addFiles(list: FileList | File[]) {
    const added: UploadItem[] = [];
    let rejected = 0;
    for (const file of Array.from(list)) {
      if (!file.size || !photoMime(file.name, file.type)) {
        rejected++;
        continue;
      }
      const id = nextId.current++;
      entries.current.set(id, { file });
      queue.current.push(id);
      added.push({ id, name: file.name, size: file.size, status: "queued", progress: 0 });
    }
    setSkipped((n) => n + rejected);
    setItems((l) => [...l, ...added]);
    pump();
  }

  function retryFailed(id?: number) {
    for (const i of items) {
      if (i.status !== "failed" || (id !== undefined && i.id !== id)) continue;
      entries.current.get(i.id)!.grant = undefined; // fresh URL in case the old one expired
      queue.current.push(i.id);
      patch(i.id, { status: "queued", progress: 0, error: undefined });
    }
    pump();
  }

  /** Forget finished batch (after it was committed). */
  function clear() {
    entries.current.clear();
    setItems([]);
    setSkipped(0);
  }

  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed");
  const busy = items.some((i) => i.status === "queued" || i.status === "uploading");
  const totalBytes = items.reduce((s, i) => s + i.size, 0);
  const sentBytes = items.reduce((s, i) => s + i.size * i.progress, 0);

  // Keep the screen awake and warn before leaving while uploads run (phones kill uploads on lock).
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    let lock: WakeLockSentinel | undefined;
    let cancelled = false;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => {
        if (cancelled) l.release();
        else lock = l;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      removeEventListener("beforeunload", warn);
      lock?.release();
    };
  }, [busy]);

  return { items, skipped, addFiles, retryFailed, clear, done, failed, busy, totalBytes, sentBytes };
}
