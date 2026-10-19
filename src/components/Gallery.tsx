"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Avatar from "@/components/Avatar";
import { QrBlock } from "@/components/QrShare";
import UploadTray from "@/components/UploadTray";
import { UploadProgressCard } from "@/components/ui/progress-card";
import { Sheet } from "@/components/ui/sheet";
import { fetchPhoto } from "@/lib/download-client";
import { api, formatBytes, sleep } from "@/lib/upload-client";
import { useUploads } from "@/lib/use-uploads";

export type Person = { id: string; name: string };
export type Photo = { id: string; filename: string; sizeBytes: number; previewUrl: string | null; by: Person };
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
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export default function Gallery({
  token,
  title,
  photos: allPhotos,
  expiresAt,
  ownerAlbumId,
  collaborative = false,
  me,
}: {
  token: string;
  title: string;
  photos: Photo[];
  expiresAt: string;
  /** Set only when the signed-in owner is viewing: enables add/delete/collaborate. */
  ownerAlbumId?: string;
  /** Guests may join with a name and add photos. */
  collaborative?: boolean;
  /** The viewer as an uploader: owner ({ id: "owner" }), a joined guest, or undefined. */
  me?: Person;
}) {
  const router = useRouter();
  const role = ownerAlbumId ? "owner" : me ? "guest" : "viewer";
  const canUpload = role === "owner" || (role === "guest" && collaborative);
  const showJoin = collaborative && role === "viewer";

  // ---- people & filter: everything below works on the filtered view ----
  const [person, setPerson] = useState<string | null>(null);
  const photos = person ? allPhotos.filter((p) => p.by.id === person) : allPhotos;
  const people = [...new Map(allPhotos.map((p) => [p.by.id, p.by])).values()].map((by) => ({
    ...by,
    count: allPhotos.filter((p) => p.by.id === by.id).length,
  }));
  const showBy = collaborative || people.length > 1;
  const nameOf = (p: Person) => (p.id === me?.id ? "You" : p.name);

  const platform = useClient(detectPlatform, "desktop");
  const shareFiles = useClient(canShareFiles, false);
  const link = useClient(() => `${location.origin}/a/${token}`, "");
  const [open, setOpen] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveIds, setSaveIds] = useState<string[] | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [download, setDownload] = useState<{ name: string; size: number } | null>(null);
  const [sheet, setSheet] = useState<"share" | "collab" | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const zipForm = useRef<HTMLFormElement>(null);

  const total = allPhotos.reduce((s, p) => s + p.sizeBytes, 0);
  const mineSelected = [...selected].filter((id) => photos.find((p) => p.id === id)?.by.id === me?.id);
  const targets = selected.size ? photos.filter((p) => selected.has(p.id)) : photos;
  const n = targets.length;
  const downloadUrl = (id: string) => `/api/a/${token}/photos/${id}`;

  // ---- inline uploads (owner or joined guest) ----
  // A batch that finished without failures is published right away; with failures the tray asks.
  const up = useUploads(
    async () => (ownerAlbumId ? `/api/albums/${ownerAlbumId}/uploads` : `/api/a/${token}/uploads`),
    ({ failed }) => {
      if (!failed) void finish();
    },
  );
  const [finishing, setFinishing] = useState(false);
  async function finish() {
    setFinishing(true);
    try {
      const r = await api<{ added: number }>(ownerAlbumId ? `/api/albums/${ownerAlbumId}/commit` : `/api/a/${token}/commit`);
      up.clear();
      setToast(`${plural(r.added, "photo")} added${role === "guest" ? `. Thanks, ${me!.name}!` : ""}`);
      router.refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setFinishing(false);
    }
  }
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** Owner deletes any selected photo; a guest deletes only their own (via `/mine`). */
  async function deleteSelected(ids = [...selected], path = `/api/albums/${ownerAlbumId}/photos`) {
    if (!confirm(`Delete ${plural(ids.length, "photo")}? People with the link won't see ${ids.length === 1 ? "it" : "them"} anymore. This can't be undone.`)) return;
    setDeleting(true);
    try {
      await api(path, { method: "DELETE", body: { ids } });
      setSelected(new Set());
      setSelecting(false);
      setToast(`${plural(ids.length, "photo")} deleted`);
      router.refresh();
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setDeleting(false);
    }
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
  const cover = allPhotos.find((p) => p.previewUrl);
  const uploading = up.items.length > 0 || up.skipped > 0;

  return (
    <section className={`space-y-6 ${allPhotos.length || uploading ? (download ? "pb-72" : "pb-40") : "pb-10"}`}>
      {/* ---------- Cover ---------- */}
      <div className="relative -mx-4 h-64 overflow-hidden bg-brand-teal sm:mx-0 sm:h-80 sm:rounded-xl">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived presigned URL
          <img src={cover.previewUrl!} alt="" className="absolute inset-0 size-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-5 text-white sm:p-7">
          {collaborative && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand-mint" aria-hidden="true" /> Shared album
            </span>
          )}
          <h1 className="text-[34px] leading-[1.05] font-medium tracking-[-1px] break-words sm:text-[48px]">{title}</h1>
          <p className="text-sm text-white/85">
            {plural(allPhotos.length, "photo")}
            {showBy && people.length > 0 && ` · ${plural(people.length, "person").replace("persons", "people")}`} · {formatBytes(total)} ·{" "}
            <span suppressHydrationWarning>deleted in {timeLeft(expiresAt)}</span>
          </p>
        </div>
      </div>

      {/* ---------- Actions (by role) ---------- */}
      {showJoin ? (
        <JoinCard token={token} title={title} />
      ) : role === "owner" ? (
        <div className="grid grid-cols-3 gap-2">
          <PickPhotos onFiles={up.addFiles} className="bg-primary text-white" icon={<IconPlus />} label="Add photos" />
          <ActionButton onClick={() => setSheet("share")} icon={<IconShare />} label="Share" />
          <ActionButton onClick={() => setSheet("collab")} icon={<IconPeople />} label="Collaborate" dot={collaborative} />
        </div>
      ) : canUpload ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <PickPhotos onFiles={up.addFiles} className="bg-primary text-white" icon={<IconPlus />} label="Add your photos" wide />
          <ActionButton onClick={() => setSheet("share")} icon={<IconShare />} label="Invite" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {role === "guest" ? (
            <p className="text-sm text-muted">The owner has paused new photos. You can still view, download, and delete your own.</p>
          ) : (
            <p className="text-sm text-muted">Tap a photo to view it full screen. Download originals below.</p>
          )}
          <ActionButton onClick={() => setSheet("share")} icon={<IconShare />} label="Share" inline />
        </div>
      )}
      {role === "guest" && canUpload && (
        <p className="-mt-3 inline-flex items-center gap-2 text-sm text-muted">
          <Avatar person={me!} size={22} /> Adding as <span className="font-semibold text-ink">{me!.name}</span>
        </p>
      )}

      {/* ---------- Photos ---------- */}
      {allPhotos.length === 0 ? (
        <div className="space-y-3 rounded-xl bg-surface-card p-6 text-center">
          <p className="text-lg font-semibold text-ink">{canUpload ? "Be the first to add photos" : "No photos yet"}</p>
          <p className="text-sm text-muted">
            {role === "owner"
              ? collaborative
                ? "Add yours, or share the link so friends can add theirs."
                : "Add your photos, or turn on Collaborate so friends can add theirs."
              : canUpload
                ? "Pick photos from your phone. They upload in original quality."
                : "Check back soon."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">{selecting ? `${selected.size} selected` : "Photos"}</h2>
            <div className="flex items-center gap-1">
              {selecting && (
                <button
                  onClick={() => setSelected(selected.size === photos.length ? new Set() : new Set(photos.map((p) => p.id)))}
                  className="h-10 rounded-md px-3 text-sm font-semibold text-muted"
                >
                  {selected.size === photos.length ? "Clear" : "Select all"}
                </button>
              )}
              <button
                onClick={() => {
                  setSelecting(!selecting);
                  setSelected(new Set());
                }}
                className={`h-10 rounded-md px-4 text-sm font-semibold ${selecting ? "bg-ink text-white" : "border border-hairline text-ink"}`}
              >
                {selecting ? "Done" : "Select"}
              </button>
            </div>
          </div>

          {showBy && people.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by person">
              <Chip on={!person} onClick={() => { setPerson(null); setSelected(new Set()); }}>
                Everyone · {allPhotos.length}
              </Chip>
              {people.map((pp) => (
                <Chip key={pp.id} on={person === pp.id} onClick={() => { setPerson(pp.id); setSelected(new Set()); }} avatar={pp}>
                  {nameOf(pp)} · {pp.count}
                </Chip>
              ))}
            </div>
          )}

          {selecting && (role === "owner" ? selected.size > 0 : mineSelected.length > 0) && (
            <button
              onClick={() => (role === "owner" ? deleteSelected() : deleteSelected(mineSelected, `/api/a/${token}/mine`))}
              disabled={deleting}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-error/10 px-4 text-sm font-semibold text-error disabled:opacity-60"
            >
              <IconTrash />
              {deleting ? "Deleting…" : role === "owner" ? `Delete ${selected.size}` : `Delete ${mineSelected.length} of mine`}
            </button>
          )}

          <ul className="-mx-4 grid grid-cols-3 gap-0.5 sm:mx-0 sm:grid-cols-4 sm:gap-1.5 lg:grid-cols-5">
            {photos.map((p, i) => {
              const on = selected.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => (selecting ? toggle(p.id) : setOpen(i))}
                    aria-pressed={selecting ? on : undefined}
                    aria-label={`${selecting ? "Select" : "Open"} ${p.filename}${showBy ? `, by ${nameOf(p.by)}` : ""}`}
                    className="group relative block aspect-square w-full overflow-hidden bg-surface-strong sm:rounded-sm"
                  >
                    {p.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- short-lived presigned URL
                      <img
                        src={p.previewUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`size-full object-cover motion-safe:transition-transform motion-safe:duration-200 ${on ? "scale-[0.86] rounded-sm" : "sm:group-hover:scale-[1.03]"}`}
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center p-2 text-[11px] break-all text-muted">{p.filename}</span>
                    )}
                    {showBy && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full ring-2 ring-white/90">
                        <Avatar person={p.by} size={22} />
                      </span>
                    )}
                    {selecting && (
                      <span
                        className={`absolute top-1.5 right-1.5 grid size-6 place-items-center rounded-full border-2 border-white text-xs text-white shadow-sm ${on ? "bg-brand-teal" : "bg-black/25"}`}
                        aria-hidden="true"
                      >
                        {on ? "✓" : ""}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ---------- Sticky bottom: uploads + downloads ---------- */}
      {(allPhotos.length > 0 || uploading) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto max-w-5xl space-y-2">
            <UploadTray up={up} onFinish={finish} finishing={finishing} />
            {download && (
              <UploadProgressCard
                fileName={download.name}
                fileSize={download.size}
                status="started"
                detail={progress ?? "Track progress in your browser’s downloads. Allow multiple downloads if your browser asks."}
                onCancel={progress ? undefined : () => setDownload(null)}
              />
            )}
            {photos.length > 0 && (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      <form ref={zipForm} method="post" action={`/api/a/${token}/zip`} className="hidden">
        {(selected.size > 0 || person) && targets.map((p) => <input key={p.id} type="hidden" name="id" value={p.id} />)}
      </form>

      {toast && (
        <div role="status" className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
          <p className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg motion-safe:animate-[toast-in_200ms_ease-out]">{toast}</p>
        </div>
      )}

      {current && (
        <Lightbox
          photo={current}
          index={open!}
          count={photos.length}
          byline={showBy ? nameOf(current.by) : null}
          onClose={() => setOpen(null)}
          onMove={(d) => setOpen((i) => Math.min(photos.length - 1, Math.max(0, i! + d)))}
          action={
            platform === "ios" && shareFiles ? (
              <button onClick={() => setSaveIds([current.id])} className="h-12 w-full rounded-md bg-canvas text-[15px] font-semibold text-ink">
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
            )
          }
        />
      )}

      {sheet === "share" && (
        <Sheet title={role === "guest" ? "Invite friends" : "Share"} onClose={() => setSheet(null)}>
          <p className="text-sm text-muted">
            {collaborative
              ? "Anyone with this link can view, download, and add their own photos."
              : "Anyone with this link can view and download these photos."}
          </p>
          <LinkBox link={link} />
          <QrBlock link={link} title={title} />
        </Sheet>
      )}

      {sheet === "collab" && ownerAlbumId && (
        <CollaborateSheet albumId={ownerAlbumId} on={collaborative} link={link} title={title} people={people} onClose={() => setSheet(null)} />
      )}

      {saveIds && <SaveToPhotos token={token} ids={saveIds} photos={photos} onClose={() => setSaveIds(null)} />}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function JoinCard({ token, title }: { token: string; title: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api(`/api/a/${token}/join`, { body: { name } });
      router.refresh(); // server re-renders with the guest cookie → "Add your photos"
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-brand-lavender/35 p-5">
      <div className="space-y-1">
        <p className="text-lg font-semibold text-ink">Were you on this trip?</p>
        <p className="text-sm text-body">Add your photos to “{title}”. Just your name, no account.</p>
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          autoComplete="given-name"
          enterKeyHint="go"
          placeholder="Your name"
          aria-label="Your name"
          className="h-12 min-w-0 flex-1 rounded-md border border-hairline bg-canvas px-4 text-ink outline-none focus:border-ink"
        />
        <button disabled={pending || !name.trim()} className="h-12 shrink-0 rounded-md bg-primary px-5 text-[15px] font-semibold text-white disabled:opacity-50">
          {pending ? "Joining…" : "Join trip"}
        </button>
      </div>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      <p className="text-xs text-muted">Just looking? Scroll down to view and download.</p>
    </form>
  );
}

function CollaborateSheet({
  albumId,
  on,
  link,
  title,
  people,
  onClose,
}: {
  albumId: string;
  on: boolean;
  link: string;
  title: string;
  people: (Person & { count: number })[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await api(`/api/albums/${albumId}`, { method: "PATCH", body: { collaborative: !on } });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet title="Collaborate" onClose={onClose}>
      <button
        role="switch"
        aria-checked={on}
        onClick={toggle}
        disabled={busy}
        className="flex w-full items-center justify-between gap-4 rounded-lg border border-hairline p-4 text-left disabled:opacity-60"
      >
        <span className="space-y-0.5">
          <span className="block font-semibold text-ink">Let friends add photos</span>
          <span className="block text-sm text-muted">
            {on ? "On: anyone with the link joins with their name and uploads." : "Off: the link is view and download only."}
          </span>
        </span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-brand-teal" : "bg-surface-strong"}`} aria-hidden="true">
          <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-[left] ${on ? "left-6" : "left-1"}`} />
        </span>
      </button>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}

      {on && (
        <>
          <p className="text-sm text-muted">Send the same link or QR. Turning this off pauses new uploads; photos already added stay.</p>
          <LinkBox link={link} />
          <QrBlock link={link} title={title} />
        </>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Contributors</h3>
        {people.length ? (
          <ul className="divide-y divide-hairline rounded-lg border border-hairline">
            {people.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar person={p} size={32} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{p.id === "owner" ? `${p.name} (you)` : p.name}</span>
                <span className="text-sm text-muted">{plural(p.count, "photo")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No one has added photos yet.</p>
        )}
      </div>
    </Sheet>
  );
}

function LinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  return (
    <div className="space-y-2">
      <p className="truncate rounded-md bg-surface-card px-4 py-3 font-mono text-sm text-ink select-all">{link}</p>
      <div className={`grid gap-2 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="h-11 rounded-md bg-primary text-sm font-semibold text-white"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        {canShare && (
          <button onClick={() => navigator.share({ url: link }).catch(() => {})} className="h-11 rounded-md border border-hairline text-sm font-semibold text-ink">
            Share via…
          </button>
        )}
      </div>
    </div>
  );
}

/** Full-screen viewer: tap sides or swipe to move, Esc / ✕ to close. */
function Lightbox({
  photo,
  index,
  count,
  byline,
  onClose,
  onMove,
  action,
}: {
  photo: Photo;
  index: number;
  count: number;
  byline: string | null;
  onClose: () => void;
  onMove: (delta: number) => void;
  action: ReactNode;
}) {
  const startX = useRef<number | null>(null);
  return (
    <div role="dialog" aria-modal="true" aria-label={photo.filename} className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {byline && <Avatar person={photo.by} size={28} />}
          <span className="min-w-0 truncate">
            {byline && <span className="font-semibold">{byline} · </span>}
            <span className="text-white/70">
              {index + 1} of {count}
            </span>
          </span>
        </div>
        <button onClick={onClose} className="grid size-11 place-items-center rounded-full bg-white/10" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
            <path d="m6 6 12 12M6 18 18 6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center"
        onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX.current === null) return;
          const dx = e.changedTouches[0].clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 50) onMove(dx < 0 ? 1 : -1);
        }}
      >
        {photo.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- short-lived presigned URL
          <img key={photo.id} src={photo.previewUrl} alt={photo.filename} className="max-h-full max-w-full object-contain motion-safe:animate-[toast-in_150ms_ease-out]" />
        ) : (
          <p className="px-6 text-center text-sm text-white/70">No preview for {photo.filename}. The original downloads fine.</p>
        )}
        {index > 0 && <button onClick={() => onMove(-1)} className="absolute left-0 h-full w-1/4" aria-label="Previous photo" />}
        {index < count - 1 && <button onClick={() => onMove(1)} className="absolute right-0 h-full w-1/4" aria-label="Next photo" />}
      </div>
      <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{action}</div>
    </div>
  );
}

function PickPhotos({ onFiles, className, icon, label, wide }: { onFiles: (f: FileList) => void; className: string; icon: ReactNode; label: string; wide?: boolean }) {
  return (
    <label
      className={`flex cursor-pointer items-center justify-center rounded-lg font-semibold motion-safe:transition-transform active:scale-[0.98] ${wide ? "h-14 gap-2 text-[15px]" : "h-16 flex-col gap-1 text-sm"} ${className}`}
    >
      {icon}
      {label}
      <input
        type="file"
        multiple
        accept="image/*,.heic,.heif" // explicit HEIC so iOS can hand over originals
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function ActionButton({ onClick, icon, label, dot, inline }: { onClick: () => void; icon: ReactNode; label: string; dot?: boolean; inline?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center rounded-lg border border-hairline font-semibold text-ink motion-safe:transition-transform active:scale-[0.98] ${inline ? "h-11 gap-2 px-4 text-sm" : "h-16 flex-col gap-1 px-4 text-sm"}`}
    >
      {icon}
      {label}
      {dot && <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-brand-teal" aria-label="on" />}
    </button>
  );
}

function Chip({ on, onClick, avatar, children }: { on: boolean; onClick: () => void; avatar?: Person; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full text-sm font-semibold ${avatar ? "pr-4 pl-1.5" : "px-4"} ${on ? "bg-ink text-white" : "border border-hairline text-ink"}`}
    >
      {avatar && <Avatar person={avatar} size={28} />}
      {children}
    </button>
  );
}

const icon = "size-5";
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={icon} aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
);
const IconShare = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={icon} aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const IconPeople = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={icon} aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.8-3.5 3.2-5.5 6-5.5s5.2 2 6 5.5" strokeLinecap="round" /><path d="M16 4.6a3 3 0 0 1 0 6.3M18 14.8c1.6.8 2.6 2.6 3 5.2" strokeLinecap="round" /></svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

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
