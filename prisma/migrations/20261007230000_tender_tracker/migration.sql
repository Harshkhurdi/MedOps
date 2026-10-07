-- AlterTable
ALTER TABLE "Tender" ADD COLUMN     "institutionName" TEXT;

-- AlterTable
ALTER TABLE "TenderItem" ADD COLUMN     "category" TEXT,
ADD COLUMN     "sourceItemId" TEXT,
ADD COLUMN     "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "TenderTrackerGrant" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "codeConsumed" BOOLEAN NOT NULL DEFAULT false,
    "tokenHash" TEXT,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenderTrackerGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalTenderImport" (
    "id" TEXT NOT NULL,
    "externalSource" TEXT NOT NULL DEFAULT 'TENDER_TRACKER',
    "externalTenderId" TEXT NOT NULL,
    "externalSourceUrl" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "ExternalTenderImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderSourceVersion" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "discoveredAt" TIMESTAMP(3) NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolution" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TenderSourceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderTrackerHealth" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "lastSuccessAt" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "failureReason" TEXT,

    CONSTRAINT "TenderTrackerHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderTrackerRate" (
    "key" TEXT NOT NULL,
    "window" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "TenderTrackerRate_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenderTrackerGrant_codeHash_key" ON "TenderTrackerGrant"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "TenderTrackerGrant_tokenHash_key" ON "TenderTrackerGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "TenderTrackerGrant_expiresAt_idx" ON "TenderTrackerGrant"("expiresAt");

-- CreateIndex
CREATE INDEX "ExternalTenderImport_tenderId_idx" ON "ExternalTenderImport"("tenderId");

-- CreateIndex
CREATE INDEX "ExternalTenderImport_externalSourceUrl_idx" ON "ExternalTenderImport"("externalSourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalTenderImport_externalSource_externalTenderId_key" ON "ExternalTenderImport"("externalSource", "externalTenderId");

-- CreateIndex
CREATE INDEX "TenderSourceVersion_importId_receivedAt_idx" ON "TenderSourceVersion"("importId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TenderSourceVersion_importId_fingerprint_key" ON "TenderSourceVersion"("importId", "fingerprint");

-- AddForeignKey
ALTER TABLE "ExternalTenderImport" ADD CONSTRAINT "ExternalTenderImport_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderSourceVersion" ADD CONSTRAINT "TenderSourceVersion_importId_fkey" FOREIGN KEY ("importId") REFERENCES "ExternalTenderImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

