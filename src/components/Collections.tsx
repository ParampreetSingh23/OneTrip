"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { timeLeft } from "@/components/Gallery";
import { api, formatBytes } from "@/lib/upload-client";

type Album = {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE";
  expiresAt: string;
  hasPassword: boolean;
  photoCount: number;
  totalBytes: number;
  url: string | null;
  coverUrl: string | null;
};

export default function Collections({ albums }: { albums: Album[] }) {
  if (!albums.length) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl bg-surface-card p-6">
        <p className="text-lg font-semibold text-ink">No collections yet</p>
        <p className="text-sm text-muted">Upload photos once, share one link, and they delete themselves when it expires.</p>
        <Link href="/new" className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white">
          Create your first collection
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {albums.map((a) => (
        <Card key={a.id} album={a} />
      ))}
    </ul>
  );
}

function Card({ album: a }: { album: Album }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [failedCover, setFailedCover] = useState<string | null>(null);

  async function remove() {
    if (!confirm(`Delete "${a.title}" now? The link stops working and the photos are deleted. This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api(`/api/albums/${a.id}`, { method: "DELETE" });
      router.refresh();
    } catch (e) {
      alert((e as Error).message);
      setDeleting(false);
    }
  }

  const btn = "h-10 rounded-md px-4 text-sm font-semibold";
  return (
    <li className={`flex flex-col overflow-hidden rounded-lg border border-hairline bg-canvas sm:flex-row ${deleting ? "opacity-50" : ""}`}>
      <div className="relative grid aspect-[16/9] w-full shrink-0 place-items-center bg-surface-card text-brand-teal sm:aspect-auto sm:w-44">
        {a.coverUrl && failedCover !== a.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- already-compressed preview, short-lived private URL
          <img src={a.coverUrl} alt="" loading="lazy" decoding="async" onError={() => setFailedCover(a.coverUrl)} className="absolute inset-0 size-full object-cover" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="size-10" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="15.5" cy="8.5" r="1.5" /><path d="m3 17 6-6 5 5 3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-4 p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-ink">{a.title}</h2>
            {a.hasPassword && <span className="rounded-full bg-surface-card px-2 py-0.5 text-xs font-medium text-ink">Password</span>}
            {a.status === "DRAFT" && <span className="rounded-full bg-brand-ochre/30 px-2 py-0.5 text-xs font-medium text-ink">Unfinished</span>}
          </div>
          <p className="text-sm text-muted" suppressHydrationWarning>
            {a.status === "ACTIVE"
              ? `${a.photoCount} photos · ${formatBytes(a.totalBytes)} · deleted in ${timeLeft(a.expiresAt)}`
              : "Upload was not finished. It is removed automatically."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.url && (
            <>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(a.url!);
                  setCopied(true);
                }}
                className={`${btn} bg-primary text-white`}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <a href={a.url} target="_blank" rel="noreferrer" className={`${btn} inline-flex items-center border border-hairline text-ink`}>
                Open
              </a>
            </>
          )}
          <button onClick={remove} disabled={deleting} className={`${btn} text-error`}>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
