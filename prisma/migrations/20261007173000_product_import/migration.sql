-- AlterTable
ALTER TABLE "PurchaseOrderItem" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "TenderItem" ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "BulkImport" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "preview" JSONB NOT NULL,
    "report" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PREVIEW',
    "runId" TEXT,
    "leaseUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulkImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkImport_ownerId_status_expiresAt_idx" ON "BulkImport"("ownerId", "status", "expiresAt");

-- AddForeignKey
ALTER TABLE "TenderItem" ADD CONSTRAINT "TenderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
