"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOut from "@/components/SignOut";

export default function NavLinks({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      aria-current={path === href ? "page" : undefined}
      className={`rounded-md px-3 py-2 ${path === href ? "bg-surface-card text-ink" : "text-muted hover:text-ink"}`}
    >
      {label}
    </Link>
  );
  const cta = (href: string, label: string) => (
    <Link href={href} className="ml-1 inline-flex h-10 items-center rounded-md bg-primary px-4 font-semibold text-white">
      {label}
    </Link>
  );

  return (
    <nav aria-label="Main" className="flex items-center gap-1 text-sm font-medium">
      {signedIn ? (
        <>
          {link("/dashboard", "My collections")}
          <SignOut />
        </>
      ) : (
        <>
          {path !== "/login" && link("/login", "Sign in")}
          {/* Album pages are for guests: no sign-up CTA competing with the photos. */}
          {path !== "/new" && !path.startsWith("/a/") && cta("/new", "Share photos")}
        </>
      )}
    </nav>
  );
}
