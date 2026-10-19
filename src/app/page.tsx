import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-6 sm:px-8">
      <Header />
      <section className="flex flex-1 flex-col justify-center gap-8 py-12 sm:gap-10 sm:py-20">
        <div className="space-y-5">
          <h1 className="text-[44px] leading-[1.05] font-medium tracking-[-1.8px] text-ink sm:text-[64px] sm:tracking-[-2.5px]">
            Share photos.
            <br />
            Original quality.
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">All your photos, one link. Full quality, ready for everyone.</p>
        </div>
        <Link href="/new" className="inline-flex h-12 w-fit items-center gap-5 rounded-md bg-primary px-6 text-[15px] font-semibold text-white transition-colors hover:bg-primary-active">
          Share photos
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-4" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <ul className="grid gap-3 text-sm text-ink sm:grid-cols-3">
          <li className="flex items-center gap-4 rounded-lg bg-brand-lavender px-5 py-5 sm:flex-col sm:items-start sm:gap-5 sm:p-6">
            <span className="flex h-7 w-16 shrink-0 items-center gap-3" aria-hidden="true">
              <Image src="/logos/apple.svg" width={23} height={23} alt="" />
              <Image src="/logos/android.svg" width={28} height={28} alt="" />
            </span>
            <span><span className="block font-semibold">iPhone & Android</span><span className="mt-1 block text-ink/70">And your computer, too.</span></span>
          </li>
          <li className="flex items-center gap-4 rounded-lg bg-brand-peach px-5 py-5 sm:flex-col sm:items-start sm:gap-5 sm:p-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-16 shrink-0 sm:w-7" aria-hidden="true">
              <path d="m10 13 4-4m-6 6-1 1a4.24 4.24 0 0 1-6-6l4-4a4.24 4.24 0 0 1 6 0m2 2 1-1a4.24 4.24 0 0 1 6 6l-4 4a4.24 4.24 0 0 1-6 0" transform="translate(1 1)" strokeLinecap="round" />
            </svg>
            <span><span className="block font-semibold">Just open the link</span><span className="mt-1 block text-ink/70">No app or account for friends.</span></span>
          </li>
          <li className="flex items-center gap-4 rounded-lg bg-brand-mint px-5 py-5 sm:flex-col sm:items-start sm:gap-5 sm:p-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-16 shrink-0 sm:w-7" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span><span className="block font-semibold">Auto-deleted</span><span className="mt-1 block text-ink/70">You choose how long it stays.</span></span>
          </li>
        </ul>
      </section>
    </main>
  );
}
