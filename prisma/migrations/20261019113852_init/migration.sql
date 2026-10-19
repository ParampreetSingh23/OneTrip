-- CreateEnum
CREATE TYPE "AlbumStatus" AS ENUM ('DRAFT', 'ACTIVE');

-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "uploadKeyHash" TEXT NOT NULL,
    "passwordHash" TEXT,
    "status" "AlbumStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "hasThumb" BOOLEAN NOT NULL DEFAULT false,
    "uploaded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Album_tokenHash_key" ON "Album"("tokenHash");

-- CreateIndex
CREATE INDEX "Album_expiresAt_idx" ON "Album"("expiresAt");

-- CreateIndex
CREATE INDEX "Asset_albumId_idx" ON "Asset"("albumId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;
