import Link from "next/link";
import Header from "@/components/Header";

export default function AlbumNotFound() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col px-5 py-6 sm:px-8">
      <Header />
      <section className="flex flex-1 items-center justify-center py-16 sm:py-24">
        <div className="w-full max-w-lg space-y-5">
          <span className="grid size-12 place-items-center rounded-lg bg-surface-card text-brand-teal" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="15.5" cy="8.5" r="1.5" />
              <path d="m3 17 6-6 5 5 3-3 4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-medium tracking-[-1px] text-ink sm:text-[40px] sm:tracking-[-1.5px]">This album is no longer available</h1>
            <p className="text-base leading-relaxed text-muted">The link may have expired or may be incorrect. Expired albums are deleted automatically.</p>
          </div>
          <Link href="/" className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-active">
            Back to OneTrip
          </Link>
        </div>
      </section>
    </main>
  );
}
