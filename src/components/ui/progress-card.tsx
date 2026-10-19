"use client";

import type { ReactNode } from "react";
import { formatBytes } from "../../lib/upload-client";

type Status = "queued" | "uploading" | "downloading" | "complete" | "error" | "started" | "ready";
const labels: Record<Status, string> = {
  queued: "Queued", uploading: "Uploading", downloading: "Downloading",
  complete: "Complete", error: "Failed", started: "Download started", ready: "Ready to share",
};

export function UploadProgressCard({
  fileName, fileSize, progress, status, icon, detail, onCancel, onRetry,
}: {
  fileName: string;
  fileSize: number;
  progress?: number;
  status: Status;
  icon?: ReactNode;
  detail?: string;
  onCancel?: () => void;
  onRetry?: () => void;
}) {
  const complete = status === "complete" || status === "ready";
  const percent = complete ? 100 : progress === undefined ? undefined : Math.max(0, Math.min(100, Math.round(progress)));
  const active = status === "uploading" || status === "downloading" || status === "queued";

  return (
    <div className={`flex w-full items-center gap-3 rounded-lg border bg-canvas p-4 text-ink ${status === "error" ? "border-error/50" : complete ? "border-brand-teal/30" : "border-hairline"}`}>
      <div className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-sm ${complete ? "bg-brand-mint/40 text-brand-teal" : status === "error" ? "bg-error/10 text-error" : "bg-surface-card text-muted"}`} aria-hidden="true">
        {complete ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-6"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : status === "error" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-6"><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 3h.01" strokeLinecap="round" /></svg>
        ) : icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-6"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6" strokeLinejoin="round" /></svg>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="truncate text-sm font-medium" title={fileName}>{fileName}</p>
        {status !== "started" && (
          <div role="progressbar" aria-label={`${fileName}: ${labels[status]}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="h-1.5 overflow-hidden rounded-full bg-surface-strong">
            <div className={`h-full rounded-full motion-safe:transition-[width] ${status === "error" ? "bg-error" : "bg-brand-teal"} ${active && percent === undefined ? "w-1/3 motion-safe:animate-pulse" : ""}`} style={percent === undefined ? undefined : { width: `${percent}%` }} />
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-muted">
          <span>{active && percent !== undefined ? `${percent === 0 ? "0 KB" : formatBytes(fileSize * percent / 100)} of ` : ""}{formatBytes(fileSize)}</span>
          <span className={status === "error" ? "text-error" : complete ? "text-brand-teal" : ""}>
            {labels[status]}{active && percent !== undefined ? ` · ${percent}%` : ""}
          </span>
        </div>
        {detail && <p className={`text-xs break-words ${status === "error" ? "text-error" : "text-muted"}`}>{detail}</p>}
      </div>
      {status === "error" && onRetry && <button type="button" onClick={onRetry} className="min-h-11 shrink-0 rounded-sm px-2 text-xs font-semibold text-ink" aria-label={`Retry ${fileName}`}>Retry</button>}
      {onCancel && <button type="button" onClick={onCancel} className="grid size-11 shrink-0 place-items-center rounded-sm text-muted hover:bg-surface-card" aria-label={status === "started" ? "Dismiss download status" : `Cancel ${fileName}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" /></svg>
      </button>}
    </div>
  );
}
