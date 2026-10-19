import { Suspense } from "react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Unlock from "@/components/Unlock";
import Header from "@/components/Header";
import { findActiveAlbum, isUnlocked, listPhotos, unlockCookieName } from "@/lib/viewer";

export default function AlbumPage({ params }: PageProps<"/a/[token]">) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6">
      <Header />
      <Suspense fallback={<GallerySkeleton />}>
        <Album params={params} />
      </Suspense>
    </main>
  );
}

async function Album({ params }: { params: PageProps<"/a/[token]">["params"] }) {
  const { token } = await params;
  const album = await findActiveAlbum(token);
  if (!album) notFound();

  const jar = await cookies();
  if (!isUnlocked(album, jar.get(unlockCookieName(album.id))?.value)) return <Unlock token={token} />;

  const photos = await listPhotos(album);
  return <Gallery token={token} title={album.title} photos={photos} expiresAt={album.expiresAt.toISOString()} />;
}

function GallerySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-sm bg-surface-strong" />
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-sm bg-surface-card" />
        ))}
      </div>
    </div>
  );
}
