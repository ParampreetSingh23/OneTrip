"use client";

import { UploadProgressCard } from "@/components/ui/progress-card";
import { formatBytes } from "@/lib/upload-client";
import type { useUploads } from "@/lib/use-uploads";

/** Compact inline upload status: one overall bar; failed files listed with Retry. */
export default function UploadTray({ up, onFinish, finishing }: { up: ReturnType<typeof useUploads>; onFinish: () => void; finishing: boolean }) {
  const { items, done, failed, busy, totalBytes, sentBytes, skipped, retryFailed } = up;
  if (!items.length && !skipped) return null;
  const pct = totalBytes ? Math.round((sentBytes / totalBytes) * 100) : 0;

  return (
    <div role="status" className="space-y-3 rounded-lg border border-hairline bg-canvas p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-ink">
          {busy ? `Adding ${items.length} photo${items.length === 1 ? "" : "s"}…` : finishing ? "Saving…" : failed.length ? `${done} added, ${failed.length} failed` : "Done"}
        </p>
        <span className="text-xs text-muted">
          {formatBytes(sentBytes)} / {formatBytes(totalBytes)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-strong" role="progressbar" aria-label="Upload progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-teal motion-safe:transition-[width]" style={{ width: `${pct}%` }} />
      </div>
      {busy && <p className="text-xs text-muted">Keep this page open. Originals upload in full quality.</p>}
      {skipped > 0 && <p className="text-xs text-muted">{skipped} file{skipped === 1 ? " wasn't a photo" : "s weren't photos"} and {skipped === 1 ? "was" : "were"} skipped.</p>}
      {failed.length > 0 && (
        <>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {failed.map((i) => (
              <li key={i.id}>
                <UploadProgressCard fileName={i.name} fileSize={i.size} status="error" detail={i.error} onRetry={() => retryFailed(i.id)} />
              </li>
            ))}
          </ul>
          {!busy && (
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => retryFailed()} className="h-11 rounded-md border border-hairline text-sm font-semibold text-ink">
                Retry all
              </button>
              <button onClick={onFinish} disabled={!done || finishing} className="h-11 rounded-md bg-primary text-sm font-semibold text-white disabled:opacity-50">
                Finish with {done}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
