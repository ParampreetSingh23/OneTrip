import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import Unlock from "@/components/Unlock";
import Header from "@/components/Header";
import { auth } from "@/lib/auth";
import { contributorCookieName, currentContributor } from "@/lib/collab";
import { db } from "@/lib/db";
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

  // The signed-in owner gets management tools and never needs the album password.
  const session = await auth.api.getSession({ headers: await headers() });
  const isOwner = session?.user.id === album.userId;

  const jar = await cookies();
  if (!isOwner && !isUnlocked(album, jar.get(unlockCookieName(album.id))?.value)) return <Unlock token={token} />;

  const [owner, me] = await Promise.all([
    db.user.findUnique({ where: { id: album.userId }, select: { name: true } }),
    currentContributor(album.id, jar.get(contributorCookieName(album.id))?.value),
  ]);
  const photos = await listPhotos(album, owner?.name ?? "Owner");
  return (
    <Gallery
      token={token}
      title={album.title}
      photos={photos}
      expiresAt={album.expiresAt.toISOString()}
      ownerAlbumId={isOwner ? album.id : undefined}
      collaborative={album.collaborative}
      me={isOwner ? { id: "owner", name: owner?.name ?? "Owner" } : me ? { id: me.id, name: me.name } : undefined}
    />
  );
}

function GallerySkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading photos">
      <div className="-mx-4 h-64 animate-pulse bg-surface-strong sm:mx-0 sm:h-80 sm:rounded-xl" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-surface-card" />
        ))}
      </div>
      <div className="-mx-4 grid grid-cols-3 gap-0.5 sm:mx-0 sm:grid-cols-4 sm:gap-1.5 lg:grid-cols-5">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-surface-card sm:rounded-sm" />
        ))}
      </div>
    </div>
  );
}
