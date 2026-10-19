"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { api, formatBytes, sleep } from "@/lib/upload-client";
import { fetchPhoto } from "@/lib/download-client";
import { UploadProgressCard } from "@/components/ui/progress-card";

export type Photo = { id: string; filename: string; sizeBytes: number; previewUrl: string | null };
type Platform = "ios" | "android" | "desktop";

const SHARE_BATCH = 10; // iOS share sheet stays reliable around this size

export function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const h = Math.floor(ms / 3600_000);
  if (h >= 48) return `${Math.floor(h / 24)} days`;
  if (h >= 1) return `${h} hour${h === 1 ? "" : "s"}`;
  return `${Math.max(1, Math.floor(ms / 60_000))} min`;
}

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function canShareFiles() {
  try {
    return !!navigator.canShare?.({ files: [new File([""], "x.jpg", { type: "image/jpeg" })] });
  } catch {
    return false;
  }
}

const noop = () => () => {};
const useClient = <T,>(get: () => T, server: T) => useSyncExternalStore(noop, get, () => server);

export default function Gallery({
  token,
  title,
  photos,
  expiresAt,
}: {
  token: string;
  title: string;
  photos: Photo[];
  expiresAt: string;
}) {
  const platform = useClient(detectPlatform, "desktop");
  const shareFiles = useClient(canShareFiles, false);
  const [open, setOpen] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveIds, setSaveIds] = useState<string[] | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [download, setDownload] = useState<{ name: string; size: number } | null>(null);
  const zipForm = useRef<HTMLFormElement>(null);

  const total = photos.reduce((s, p) => s + p.sizeBytes, 0);
  const targets = selected.size ? photos.filter((p) => selected.has(p.id)) : photos;
  const n = targets.length;
  const downloadUrl = (id: string) => `/api/a/${token}/photos/${id}`;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function downloadZip() {
    setDownload({ name: `${title || "photos"}.zip`, size: targets.reduce((s, p) => s + p.sizeBytes, 0) });
    zipForm.current!.requestSubmit();
  }

  // Android/desktop: one file per download lands in Downloads, which Gallery/Photos apps pick up.
  async function downloadEach(ids: string[]) {
    const files = photos.filter((p) => ids.includes(p.id));
    setDownload({ name: files.length === 1 ? files[0].filename : `${files.length} original photos`, size: files.reduce((s, p) => s + p.sizeBytes, 0) });
    for (const [i, id] of ids.entries()) {
      setProgress(`Downloading ${i + 1} of ${ids.length}…`);
      const a = document.createElement("a");
      a.href = downloadUrl(id);
      a.click();
      await sleep(800); // browsers drop rapid-fire downloads
    }
    setProgress(null);
  }

  function primary() {
    const ids = targets.map((p) => p.id);
    if (platform === "ios" && shareFiles) return setSaveIds(ids);
    if (ids.length === 1) return downloadEach(ids);
    if (platform === "android") return downloadEach(ids);
    downloadZip();
  }

  const primaryLabel =
    platform === "ios" && shareFiles
      ? `Save ${n} to Photos`
      : n === 1
        ? "Download original"
        : platform === "android"
          ? `Download ${n} photos`
          : `Download ${n} as ZIP`;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => Math.min(photos.length - 1, (i ?? 0) + 1));
      if (e.key === "ArrowLeft") setOpen((i) => Math.max(0, (i ?? 0) - 1));
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  const current = open === null ? null : photos[open];

  return (
    <section className={`space-y-5 ${download ? "pb-72" : "pb-36"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-1px] break-words text-ink">{title}</h1>
          <p className="text-sm text-muted">
            {photos.length} photo{photos.length === 1 ? "" : "s"} · original quality · {formatBytes(total)} ·{" "}
            <span suppressHydrationWarning>deleted in {timeLeft(expiresAt)}</span>
          </p>
        </div>
        <button
          onClick={() => {
            setSelecting(!selecting);
            setSelected(new Set());
          }}
          className="h-10 shrink-0 rounded-md border border-hairline px-4 text-sm font-semibold text-ink"
        >
          {selecting ? "Cancel" : "Select"}
        </button>
      </div>

      {selecting && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold text-ink">{selected.size} selected</span>
          <button onClick={() => setSelected(new Set(photos.map((p) => p.id)))} className="text-muted underline">
            Select all
          </button>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} className="text-muted underline">
              Clear
            </button>
          )}
        </div>
      )}

      <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {photos.map((p, i) => {
          const on = selected.has(p.id);
          return (
            <li key={p.id}>
              <button
                onClick={() => (selecting ? toggle(p.id) : setOpen(i))}
                aria-pressed={selecting ? on : undefined}
                aria-label={selecting ? `Select ${p.filename}` : `Open ${p.filename}`}
                className={`relative block aspect-square w-full overflow-hidden rounded-sm bg-surface-strong ${on ? "ring-4 ring-ink ring-inset" : ""}`}
              >
                {p.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- short-lived presigned URL
                  <img
                    src={p.previewUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`size-full object-cover transition-transform ${on ? "scale-90 rounded-sm" : ""}`}
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center p-2 text-[11px] break-all text-muted">{p.filename}</span>
                )}
                {selecting && (
                  <span
                    className={`absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full border-2 border-white text-xs text-white ${on ? "bg-ink" : "bg-black/20"}`}
                  >
                    {on ? "✓" : ""}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-5xl space-y-2">
          {download && (
            <div role="status">
              <UploadProgressCard
                fileName={download.name}
                fileSize={download.size}
                status="started"
                detail={progress ?? "Track progress in your browser’s downloads. Allow multiple downloads if your browser asks."}
                onCancel={progress ? undefined : () => setDownload(null)}
              />
            </div>
          )}
          <button
            onClick={primary}
            disabled={!!progress}
            className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {progress ?? (selected.size || n === 1 ? primaryLabel : primaryLabel.replace(String(n), `all ${n}`))}
          </button>
          {platform !== "desktop" && n > 1 && (
            <button onClick={downloadZip} className="h-9 w-full text-sm font-semibold text-muted">
              Download {selected.size ? n : "all"} as one ZIP file
            </button>
          )}
        </div>
      </div>

      <form ref={zipForm} method="post" action={`/api/a/${token}/zip`} className="hidden">
        {selected.size > 0 && targets.map((p) => <input key={p.id} type="hidden" name="id" value={p.id} />)}
      </form>

      {current && (
        <div role="dialog" aria-modal="true" aria-label={current.filename} className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="truncate text-sm">
              {open! + 1} / {photos.length} · {current.filename}
            </span>
            <button onClick={() => setOpen(null)} className="h-11 rounded-md px-3 text-sm font-semibold" aria-label="Close">
              ✕
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            {current.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived presigned URL
              <img src={current.previewUrl} alt={current.filename} className="max-h-full max-w-full object-contain" />
            ) : (
              <p className="text-sm text-white/70">No preview for this file. The original downloads fine.</p>
            )}
            {open! > 0 && <button onClick={() => setOpen(open! - 1)} className="absolute left-0 h-full w-1/4" aria-label="Previous photo" />}
            {open! < photos.length - 1 && (
              <button onClick={() => setOpen(open! + 1)} className="absolute right-0 h-full w-1/4" aria-label="Next photo" />
            )}
          </div>
          <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {platform === "ios" && shareFiles ? (
              <button
                onClick={() => setSaveIds([current.id])}
                className="h-12 w-full rounded-md bg-canvas text-[15px] font-semibold text-ink"
              >
                Save to Photos · {formatBytes(current.sizeBytes)}
              </button>
            ) : (
              <a
                href={downloadUrl(current.id)}
                onClick={() => {
                  setDownload({ name: current.filename, size: current.sizeBytes });
                  setOpen(null);
                }}
                className="flex h-12 items-center justify-center rounded-md bg-canvas text-[15px] font-semibold text-ink"
              >
                Download original · {formatBytes(current.sizeBytes)}
              </a>
            )}
          </div>
        </div>
      )}

      {saveIds && <SaveToPhotos token={token} ids={saveIds} photos={photos} onClose={() => setSaveIds(null)} />}
    </section>
  );
}

/**
 * iOS "Save to Photos": fetch a batch of originals, then the user taps to open the share sheet
 * ("Save N Images"). Sharing needs a fresh tap, so fetching happens between taps.
 */
function SaveToPhotos({ token, ids, photos, onClose }: { token: string; ids: string[]; photos: Photo[]; onClose: () => void }) {
  const batches = Math.ceil(ids.length / SHARE_BATCH);
  const [batch, setBatch] = useState(0);
  const [files, setFiles] = useState<File[] | null>(null);
  const [status, setStatus] = useState("Preparing…");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [transfer, setTransfer] = useState<{ name: string; size: number; progress: number; ready: boolean } | null>(null);

  useEffect(() => {
    if (batch >= batches) return;
    let cancelled = false;
    const controller = new AbortController();
    (async () => {
      try {
        const slice = ids.slice(batch * SHARE_BATCH, (batch + 1) * SHARE_BATCH);
        const { urls } = await api<{ urls: { id: string; filename: string; mimeType: string; url: string }[] }>(
          `/api/a/${token}/urls`,
          { body: { ids: slice } },
        );
        const out: File[] = [];
        if (urls.length !== slice.length) throw new Error("Some photos are unavailable. Close this sheet and refresh the album.");
        for (const u of urls) {
          if (cancelled) return;
          setStatus(`Preparing ${out.length + 1} of ${urls.length}…`);
          const size = photos.find((p) => p.id === u.id)!.sizeBytes;
          setTransfer({ name: u.filename, size, progress: 0, ready: false });
          const blob = await fetchPhoto(u.url, controller.signal, (loaded) => {
            if (!cancelled) setTransfer({ name: u.filename, size, progress: loaded / size * 100, ready: false });
          });
          if (blob.size !== size) throw new Error(`Incomplete download for ${u.filename}. Please retry.`);
          out.push(new File([blob], u.filename, { type: u.mimeType }));
        }
        if (!cancelled) {
          setFiles(out);
          setTransfer({ name: `${out.length} photo${out.length === 1 ? "" : "s"} ready`, size: out.reduce((s, f) => s + f.size, 0), progress: 100, ready: true });
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attempt, batch, batches, ids, photos, token]);

  async function share() {
    try {
      await navigator.share({ files: files! });
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // user closed the sheet; keep batch ready
      setError((e as Error).message);
      return;
    }
    setFiles(null);
    setTransfer(null);
    setError(null);
    setStatus("Preparing…");
    setBatch((b) => b + 1);
  }

  const done = batch >= batches;
  return (
    <div role="dialog" aria-modal="true" aria-label="Save photos" className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-t-xl bg-canvas px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ink">{done ? "Share complete" : "Save to Photos"}</h2>
          <p className="text-sm text-muted">
            {done
              ? `${ids.length} photo${ids.length === 1 ? "" : "s"} sent to the share sheet.`
              : batches > 1
                ? `Batch ${batch + 1} of ${batches}. In the share sheet, tap "Save ${Math.min(SHARE_BATCH, ids.length - batch * SHARE_BATCH)} Images".`
                : `In the share sheet, tap "Save Image".`}
          </p>
        </div>
        {transfer && !done && (
          <UploadProgressCard
            fileName={transfer.name}
            fileSize={transfer.size}
            progress={transfer.progress}
            status={error ? "error" : transfer.ready ? "ready" : "downloading"}
            detail={error ? undefined : status}
            onCancel={onClose}
            onRetry={files ? undefined : () => {
              setError(null);
              setTransfer(null);
              setAttempt((n) => n + 1);
            }}
          />
        )}
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        {done ? (
          <button onClick={onClose} className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-white">
            Done
          </button>
        ) : (
          <button
            onClick={share}
            disabled={!files}
            className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {files ? `Save ${files.length} photo${files.length === 1 ? "" : "s"}` : status}
          </button>
        )}
        {!done && (
          <button onClick={onClose} className="h-9 w-full text-sm font-semibold text-muted">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
