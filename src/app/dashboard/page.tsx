import Link from "next/link";
import { Suspense } from "react";
import Collections from "@/components/Collections";
import Header from "@/components/Header";
import SignOut from "@/components/SignOut";
import { listAlbums } from "@/lib/album";
import { pageUser } from "@/lib/session";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <Header>
        <SignOut />
      </Header>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-[32px] leading-[1.1] font-medium tracking-[-1px] text-ink">My collections</h1>
        <Link href="/new" className="inline-flex h-11 shrink-0 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white">
          + New
        </Link>
      </div>
      <Suspense fallback={<div className="h-32 animate-pulse rounded-lg bg-surface-card" />}>
        <List />
      </Suspense>
    </main>
  );
}

async function List() {
  const user = await pageUser("/dashboard");
  return <Collections albums={await listAlbums(user.id)} />;
}
