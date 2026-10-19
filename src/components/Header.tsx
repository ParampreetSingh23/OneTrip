import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="mb-8 flex min-h-11 items-center justify-between gap-4">
      <Link href="/" className="inline-flex shrink-0 items-center gap-2.5 text-lg font-semibold tracking-[-0.6px] text-ink">
        <Image src="/onetrip.svg" width={36} height={36} alt="" />
        OneTrip
      </Link>
      <nav className="flex items-center gap-1 text-sm font-medium">{children}</nav>
    </header>
  );
}
