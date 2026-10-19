import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import NavLinks from "@/components/NavLinks";
import { auth } from "@/lib/auth";

/** Same header + nav on every page; links depend on whether the visitor is signed in. */
export default function Header() {
  return (
    <header className="mb-8 flex min-h-11 items-center justify-between gap-3">
      <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-[-0.6px] text-ink">
        <Image src="/onetrip.svg" width={36} height={36} alt="" />
        <span className="max-sm:sr-only">OneTrip</span>
      </Link>
      <Suspense fallback={<div className="h-11" />}>
        <Nav />
      </Suspense>
    </header>
  );
}

async function Nav() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <NavLinks signedIn={!!session} />;
}
