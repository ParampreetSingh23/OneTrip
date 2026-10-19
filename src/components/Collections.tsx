"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { timeLeft } from "@/components/Gallery";
import QrShare from "@/components/QrShare";
import { api } from "@/lib/upload-client";

type Album = {
  id: string;
  title: string;
  status: "DRAFT" | "ACTIVE";
  expiresAt: string;
  hasPassword: boolean;
  collaborative: boolean;
  contributorCount: number;
  photoCount: number;
  totalBytes: number;
  url: string | null;
  coverUrl: string | null;
};

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function Collections({ albums }: { albums: Album[] }) {
  if (!albums.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-card px-6 py-14 text-center">
        <span className="grid size-14 place-items-center rounded-lg bg-brand-mint text-brand-teal" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="15.5" cy="8.5" r="1.5" /><path d="m3 17 6-6 5 5 3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div className="space-y-1">
          <p className="text-xl font-semibold text-ink">Your trips live here</p>
          <p className="max-w-sm text-sm text-muted">Create a collection, share one link, and everyone gets the originals. It deletes itself when it expires.</p>
        </div>
        <Link href="/new" className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-[15px] font-semibold text-white">
          Create your first collection
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

  const people = a.contributorCount + 1; // guests + owner
  const meta =
    a.status === "ACTIVE"
      ? [plural(a.photoCount, "photo"), a.collaborative || a.contributorCount ? `${people} people` : null, `deleted in ${timeLeft(a.expiresAt)}`]
          .filter(Boolean)
          .join(" · ")
      : "Upload not finished · removed automatically";
  const iconBtn = "grid size-11 place-items-center rounded-md text-muted hover:bg-surface-card hover:text-ink";

  const cover = (
    <div className="relative aspect-[4/3] overflow-hidden bg-brand-teal">
      {a.coverUrl && failedCover !== a.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived private preview URL
        <img src={a.coverUrl} alt="" loading="lazy" decoding="async" onError={() => setFailedCover(a.coverUrl)} className="absolute inset-0 size-full object-cover motion-safe:transition-transform motion-safe:duration-300 group-hover:scale-[1.03]" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-white/60" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="size-12">
            <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="15.5" cy="8.5" r="1.5" /><path d="m3 17 6-6 5 5 3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        {a.collaborative && <Badge>Shared album</Badge>}
        {a.hasPassword && <Badge>Password</Badge>}
        {a.status === "DRAFT" && <Badge>Unfinished</Badge>}
      </div>
    </div>
  );

  return (
    <li className={`group overflow-hidden rounded-xl border border-hairline bg-canvas ${deleting ? "opacity-50" : ""}`}>
      {a.url ? (
        <a href={a.url} aria-label={`Open ${a.title}`} className="block">
          {cover}
        </a>
      ) : (
        cover
      )}
      <div className="flex items-start gap-2 p-4 pr-2">
        <div className="min-w-0 flex-1 space-y-0.5">
          <h2 className="truncate text-lg font-semibold text-ink">{a.title}</h2>
          <p className="text-sm text-muted" suppressHydrationWarning>{meta}</p>
        </div>
        <div className="flex shrink-0 items-center">
          {a.url && (
            <>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(a.url!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={iconBtn}
                aria-label={copied ? "Link copied" : "Copy link"}
                title={copied ? "Copied" : "Copy link"}
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5 text-brand-teal" aria-hidden="true"><path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" strokeLinecap="round" /></svg>
                )}
              </button>
              <QrShare
                url={a.url}
                title={a.title}
                className={iconBtn}
                label={
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" strokeLinecap="round" /></svg>
                }
                ariaLabel="Show QR code"
              />
            </>
          )}
          <button onClick={remove} disabled={deleting} className={`${iconBtn} hover:text-error`} aria-label={`Delete ${a.title}`} title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    </li>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-canvas/90 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur">{children}</span>;
}
