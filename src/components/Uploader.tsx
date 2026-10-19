"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Expiry } from "@/lib/photos";
import { api, formatBytes } from "@/lib/upload-client";
import { useUploads } from "@/lib/use-uploads";
import { UploadProgressCard } from "@/components/ui/progress-card";
import QrShare from "@/components/QrShare";

const EXPIRY_LABEL: Record<Expiry, string> = { "24h": "24 hours", "3d": "3 days", "7d": "7 days" };


/** New collection: pick photos, name it, choose expiry/password, get the link. */
export default function Uploader() {
  const [title, setTitle] = useState("");
  const [expiry, setExpiry] = useState<Expiry>("3d");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; photoCount: number; expiry: Expiry; title: string } | null>(null);

  // Draft collection is created on the first upload, then reused.
  const session = useRef<Promise<{ albumId: string }> | null>(null);
  const getSession = () =>
    (session.current ??= api<{ albumId: string }>("/api/albums").catch((e) => {
      session.current = null;
      throw e;
    }));
  const { items, skipped, addFiles, retryFailed, done, failed, busy, totalBytes, sentBytes } = useUploads(
    async () => `/api/albums/${(await getSession()).albumId}/uploads`,
  );

  async function createLink() {
    setPublishing(true);
    setError(null);
    try {
      const s = await getSession();
      const r = await api<{ photoCount: number; url: string }>(`/api/albums/${s.albumId}/publish`, {
        body: { title: title.trim() || "Untitled collection", expiry, password: usePassword && password ? password : undefined },
      });
      setResult({ url: r.url, photoCount: r.photoCount, expiry, title: title.trim() || "Untitled collection" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPublishing(false);
    }
  }

  const passwordOk = !usePassword || password.length >= 4;

  if (result) return <ShareCard {...result} />;

  if (!items.length) {
    return (
      <section className="flex flex-1 flex-col justify-center gap-8">
        <div className="space-y-2">
          <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-1.5px] break-words text-ink">
            New collection
          </h1>
          <p className="text-muted">
            Pick your photos. Originals are uploaded untouched.
          </p>
        </div>
        <DropZone onFiles={addFiles} big />
        {skipped > 0 && <p className="text-sm text-error">{skipped} file(s) skipped: only JPEG, PNG, HEIC and WebP photos.</p>}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 pb-32">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {items.length} photo{items.length === 1 ? "" : "s"}
          </h1>
          <span className="text-sm text-muted">
            {formatBytes(sentBytes)} / {formatBytes(totalBytes)}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-strong" role="progressbar" aria-label="Overall upload progress" aria-valuenow={Math.round((sentBytes / totalBytes) * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full bg-ink transition-[width]" style={{ width: `${(sentBytes / totalBytes) * 100}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted">{done} uploaded</span>
          {failed.length > 0 && (
            <button onClick={() => retryFailed()} className="min-h-11 rounded-md bg-error/10 px-3 font-semibold text-error">
              {failed.length} failed · Retry
            </button>
          )}
          {skipped > 0 && <span className="text-muted">{skipped} skipped (not a photo)</span>}
          <DropZone onFiles={addFiles} />
        </div>
        {failed[0]?.error && <p className="text-sm text-error">{failed[0].error}</p>}
      </div>

      <ul className="grid max-h-[28rem] gap-2 overflow-y-auto rounded-lg p-1" aria-label="Photo uploads" tabIndex={0}>
        {items.map((i) => (
          <li key={i.id}>
            <UploadProgressCard
              fileName={i.name}
              fileSize={i.size}
              progress={i.progress * 100}
              status={i.status === "done" ? "complete" : i.status === "failed" ? "error" : i.status}
              detail={i.error}
              onRetry={() => retryFailed(i.id)}
              icon={i.preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={i.preview} alt="" className="size-full object-cover" />
              ) : undefined}
            />
          </li>
        ))}
      </ul>

      <div className="space-y-5 rounded-xl bg-surface-card p-5">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Collection name</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="e.g. Goa trip, Riya's birthday"
            className="h-11 w-full rounded-md border border-hairline bg-canvas px-4 text-ink outline-none focus:border-ink"
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-ink">Delete automatically after</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(EXPIRY_LABEL) as Expiry[]).map((e) => (
              <label
                key={e}
                className={`cursor-pointer rounded-md border py-3 text-center text-sm font-semibold ${expiry === e ? "border-ink bg-ink text-white" : "border-hairline bg-canvas text-ink"}`}
              >
                <input type="radio" name="expiry" value={e} checked={expiry === e} onChange={() => setExpiry(e)} className="sr-only" />
                {EXPIRY_LABEL[e]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={usePassword} onChange={(e) => setUsePassword(e.target.checked)} className="size-4 accent-ink" />
            Protect with a password
          </label>
          {usePassword && (
            <input
              type="password"
              autoComplete="new-password"
              placeholder="At least 4 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-md border border-hairline bg-canvas px-4 text-ink outline-none focus:border-ink"
            />
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-canvas/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-2xl space-y-2">
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            onClick={createLink}
            disabled={busy || publishing || done === 0 || !passwordOk}
            className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-white disabled:bg-surface-strong disabled:text-muted"
          >
            {busy
              ? `Uploading ${done} of ${items.length}… keep this page open`
              : publishing
                ? "Creating link…"
                : failed.length
                  ? `Create link with ${done} photos`
                  : "Create link"}
          </button>
        </div>
      </div>
    </section>
  );
}

function DropZone({ onFiles, big }: { onFiles: (f: FileList) => void; big?: boolean }) {
  const input = (
    <input
      type="file"
      multiple
      // Explicit HEIC/HEIF so iOS can hand over originals instead of converting.
      accept="image/*,.heic,.heif"
      className="sr-only"
      onChange={(e) => {
        if (e.target.files?.length) onFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );
  if (!big) {
    return (
      <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-hairline px-3 font-semibold text-ink transition-colors hover:bg-surface-card">
        + Add more
        {input}
      </label>
    );
  }
  return (
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className="flex cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed border-surface-strong bg-surface-soft px-6 py-10 text-center transition-colors hover:border-brand-teal sm:py-14"
    >
      <span className="mb-1 grid size-14 place-items-center rounded-lg bg-brand-mint text-brand-teal" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-7">
          <path d="M12 16V3m-5 5 5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="text-xl font-medium tracking-tight text-ink">Your photos go here</span>
      <span className="text-sm text-muted">Drop a batch here, or choose from your library.</span>
      <span className="my-1 inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white">Choose photos</span>
      <span className="text-xs text-muted">JPEG, PNG, HEIC & WebP · 100+ photos at once</span>
      {input}
    </label>
  );
}

function ShareCard({ url, photoCount, expiry, title }: { url: string; photoCount: number; expiry: Expiry; title: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <section className="flex flex-1 flex-col justify-center gap-6">
      <div className="space-y-2">
        <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-1.5px] text-ink">Your link is ready</h1>
        <p className="text-muted">
          {title} · {photoCount} photos · deleted in {EXPIRY_LABEL[expiry]}
        </p>
      </div>
      <div className="space-y-3 rounded-xl bg-brand-teal p-5 text-white">
        <p className="rounded-md bg-white/10 px-4 py-3 font-mono text-sm break-all select-all">{url}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
            }}
            className="h-11 rounded-md bg-canvas text-sm font-semibold text-ink"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
          {canShare && (
            <button onClick={() => navigator.share({ url }).catch(() => {})} className="h-11 rounded-md border border-white/40 text-sm font-semibold">
              Share…
            </button>
          )}
          <QrShare url={url} title={title} label="Show QR code" className="col-span-2 h-11 rounded-md border border-white/40 text-sm font-semibold" />
        </div>
      </div>
      <ul className="space-y-2 text-sm text-muted">
        <li>Anyone with this link can view and download these photos until they expire.</li>
        <li>Originals are shared exactly as taken, including any location data stored in them.</li>
      </ul>
      <div className="flex flex-wrap gap-2">
        <a href={url} className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white">
          Open collection
        </a>
        <Link href="/dashboard" className="inline-flex h-11 items-center rounded-md border border-hairline px-5 text-sm font-semibold text-ink">
          My collections
        </Link>
      </div>
      <p className="text-sm text-muted">Want friends to add their photos too? Open the collection and tap Collaborate.</p>
    </section>
  );
}
