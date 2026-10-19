-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "collaborative" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "contributorId" TEXT;

-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contributor_keyHash_key" ON "Contributor"("keyHash");

-- CreateIndex
CREATE INDEX "Contributor_albumId_idx" ON "Contributor"("albumId");

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

