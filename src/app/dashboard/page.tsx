import Link from "next/link";
import { Suspense } from "react";
import Collections from "@/components/Collections";
import Header from "@/components/Header";
import { listAlbums } from "@/lib/album";
import { pageUser } from "@/lib/session";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <Header />
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-[28px] leading-[1.1] font-medium tracking-[-1px] whitespace-nowrap text-ink sm:text-[32px]">My collections</h1>
        <Link href="/new" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-white">
          <span aria-hidden="true" className="text-lg leading-none">+</span> Create<span className="max-sm:hidden"> collection</span>
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-surface-card" />
            ))}
          </div>
        }
      >
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  const user = await pageUser("/dashboard");
  return <Collections albums={await listAlbums(user.id)} />;
}
