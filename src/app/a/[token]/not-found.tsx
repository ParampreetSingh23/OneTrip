import Link from "next/link";

export default function AlbumNotFound() {
  return (
    <section className="flex flex-1 flex-col justify-center gap-4 py-16">
      <h1 className="text-[40px] leading-[1.05] font-medium tracking-[-1.5px] text-ink">This album is gone</h1>
      <p className="text-muted">The link has expired or is incorrect. Expired photos are deleted automatically.</p>
      <Link href="/" className="inline-flex h-11 w-fit items-center rounded-md bg-primary px-5 text-sm font-semibold text-white">
        Share your own photos
      </Link>
    </section>
  );
}
