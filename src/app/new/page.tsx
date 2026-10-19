import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import Uploader from "@/components/Uploader";
import { pageUser } from "@/lib/session";

export default function NewCollectionPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <Header>
        <Link href="/dashboard" className="rounded-md px-3 py-2 text-muted hover:text-ink">
          My collections
        </Link>
      </Header>
      <Suspense>
        <Authed />
      </Suspense>
    </main>
  );
}

async function Authed() {
  await pageUser("/new");
  return <Uploader />;
}
