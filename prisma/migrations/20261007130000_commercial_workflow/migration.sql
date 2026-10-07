-- DropForeignKey
ALTER TABLE "Tender" DROP CONSTRAINT "Tender_customerId_fkey";

-- AlterTable
ALTER TABLE "StoredFile" ADD COLUMN     "quotationId" TEXT,
ADD COLUMN     "rfqId" TEXT;

-- AlterTable
ALTER TABLE "Tender" ADD COLUMN     "bidNumber" TEXT,
ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "publicationDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceUrl" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "title" TEXT,
ALTER COLUMN "customerId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TenderDecision" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "decision" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "decisionBy" TEXT NOT NULL,
    "decisionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerContact" (
    "id" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "region" TEXT,
    "category" TEXT,
    "preferredChannel" TEXT NOT NULL DEFAULT 'EMAIL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rfq" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "tenderId" TEXT,
    "customerId" TEXT,
    "manufacturerId" TEXT NOT NULL,
    "contactId" TEXT,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "model" TEXT,
    "quantity" INTEGER NOT NULL,
    "accessories" TEXT,
    "warrantyRequirement" TEXT,
    "deliveryLocation" TEXT,
    "requiredDeliveryTime" TEXT,
    "tenderDeadline" TIMESTAMP(3),
    "quoteRequiredBy" TIMESTAMP(3),
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "notes" TEXT,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rfq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RfqFollowUp" (
    "id" TEXT NOT NULL,
    "rfqId" TEXT NOT NULL,
    "employeeId" TEXT,
    "contactDate" TIMESTAMP(3) NOT NULL,
    "nextDate" TIMESTAMP(3),
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RfqFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteSeries" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "rfqId" TEXT,
    "tenderId" TEXT,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationRevision" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "quotationDate" DATE NOT NULL,
    "validityDate" DATE,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "productName" TEXT NOT NULL,
    "model" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "baseTotal" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "accessories" TEXT,
    "accessoriesCost" DECIMAL(18,2) NOT NULL,
    "freight" DECIMAL(18,2) NOT NULL,
    "installation" DECIMAL(18,2) NOT NULL,
    "warranty" TEXT,
    "warrantyCost" DECIMAL(18,2) NOT NULL,
    "extendedWarrantyCost" DECIMAL(18,2) NOT NULL,
    "otherCosts" DECIMAL(18,2) NOT NULL,
    "discount" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "finalManufacturerPrice" DECIMAL(18,2),
    "leadTimeDays" INTEGER,
    "paymentTerms" TEXT,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialComparison" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tenderId" TEXT,
    "rfqId" TEXT,
    "quoteId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "procurementCost" DECIMAL(18,2) NOT NULL,
    "additionalCosts" DECIMAL(18,2) NOT NULL,
    "sellingPrice" DECIMAL(18,2) NOT NULL,
    "totalCost" DECIMAL(18,2) NOT NULL,
    "contribution" DECIMAL(18,2) NOT NULL,
    "marginPercent" DECIMAL(12,4),
    "leadTimeDays" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderResult" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "resultDate" DATE NOT NULL,
    "winner" TEXT,
    "winningPrice" DECIMAL(18,2),
    "competitorName" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenderDecision_tenderId_decisionAt_idx" ON "TenderDecision"("tenderId", "decisionAt");

-- CreateIndex
CREATE INDEX "ManufacturerContact_manufacturerId_active_idx" ON "ManufacturerContact"("manufacturerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Rfq_number_key" ON "Rfq"("number");

-- CreateIndex
CREATE INDEX "Rfq_status_quoteRequiredBy_idx" ON "Rfq"("status", "quoteRequiredBy");

-- CreateIndex
CREATE INDEX "Rfq_assignedToId_status_idx" ON "Rfq"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "RfqFollowUp_rfqId_nextDate_idx" ON "RfqFollowUp"("rfqId", "nextDate");

-- CreateIndex
CREATE INDEX "QuoteSeries_tenderId_idx" ON "QuoteSeries"("tenderId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteSeries_manufacturerId_number_key" ON "QuoteSeries"("manufacturerId", "number");

-- CreateIndex
CREATE INDEX "QuotationRevision_validityDate_idx" ON "QuotationRevision"("validityDate");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationRevision_seriesId_revision_key" ON "QuotationRevision"("seriesId", "revision");

-- CreateIndex
CREATE INDEX "CommercialComparison_tenderId_rfqId_idx" ON "CommercialComparison"("tenderId", "rfqId");

-- CreateIndex
CREATE INDEX "TenderResult_tenderId_resultDate_idx" ON "TenderResult"("tenderId", "resultDate");

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "QuotationRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderDecision" ADD CONSTRAINT "TenderDecision_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerContact" ADD CONSTRAINT "ManufacturerContact_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "ManufacturerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RfqFollowUp" ADD CONSTRAINT "RfqFollowUp_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteSeries" ADD CONSTRAINT "QuoteSeries_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteSeries" ADD CONSTRAINT "QuoteSeries_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteSeries" ADD CONSTRAINT "QuoteSeries_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteSeries" ADD CONSTRAINT "QuoteSeries_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "QuotationRevision_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "QuoteSeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialComparison" ADD CONSTRAINT "CommercialComparison_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialComparison" ADD CONSTRAINT "CommercialComparison_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "Rfq"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialComparison" ADD CONSTRAINT "CommercialComparison_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuotationRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderResult" ADD CONSTRAINT "TenderResult_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
