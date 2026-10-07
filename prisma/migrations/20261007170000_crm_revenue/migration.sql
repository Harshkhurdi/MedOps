-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_orderId_fkey";

-- AlterTable
ALTER TABLE "AmcContract" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "orderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Manufacturer" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "ServiceVisit" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "TenderResult" ADD COLUMN     "competitorId" TEXT;

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "preferredChannel" TEXT NOT NULL DEFAULT 'EMAIL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInteraction" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contactId" TEXT,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "nextFollowUp" TIMESTAMP(3),
    "relatedModule" TEXT,
    "recordId" TEXT,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOpportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "customerId" TEXT NOT NULL,
    "manufacturerId" TEXT,
    "productId" TEXT,
    "tenderId" TEXT,
    "estimatedValue" DECIMAL(18,2),
    "probability" INTEGER,
    "expectedClose" DATE,
    "assignedToId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competitor" (
    "id" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "brands" TEXT,
    "categories" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorCustomer" (
    "id" TEXT NOT NULL,
    "competitorId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "category" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetitorCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalCost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "incurredDate" DATE NOT NULL,
    "customerId" TEXT NOT NULL,
    "manufacturerId" TEXT,
    "productId" TEXT,
    "tenderId" TEXT,
    "orderId" TEXT,
    "deliveryId" TEXT,
    "installationId" TEXT,
    "ticketId" TEXT,
    "employeeId" TEXT,
    "serviceCost" BOOLEAN NOT NULL DEFAULT false,
    "postSale" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAdjustment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "adjustmentDate" DATE NOT NULL,
    "reference" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_active_idx" ON "CustomerContact"("customerId", "active");

-- CreateIndex
CREATE INDEX "CustomerInteraction_customerId_occurredAt_idx" ON "CustomerInteraction"("customerId", "occurredAt");

-- CreateIndex
CREATE INDEX "CustomerInteraction_employeeId_nextFollowUp_idx" ON "CustomerInteraction"("employeeId", "nextFollowUp");

-- CreateIndex
CREATE INDEX "SalesOpportunity_customerId_stage_idx" ON "SalesOpportunity"("customerId", "stage");

-- CreateIndex
CREATE INDEX "SalesOpportunity_assignedToId_expectedClose_idx" ON "SalesOpportunity"("assignedToId", "expectedClose");

-- CreateIndex
CREATE UNIQUE INDEX "Competitor_company_key" ON "Competitor"("company");

-- CreateIndex
CREATE INDEX "CompetitorCustomer_customerId_competitorId_idx" ON "CompetitorCustomer"("customerId", "competitorId");

-- CreateIndex
CREATE INDEX "OperationalCost_customerId_incurredDate_idx" ON "OperationalCost"("customerId", "incurredDate");

-- CreateIndex
CREATE INDEX "OperationalCost_orderId_category_idx" ON "OperationalCost"("orderId", "category");

-- CreateIndex
CREATE INDEX "OperationalCost_manufacturerId_productId_idx" ON "OperationalCost"("manufacturerId", "productId");

-- CreateIndex
CREATE INDEX "FinancialAdjustment_invoiceId_adjustmentDate_idx" ON "FinancialAdjustment"("invoiceId", "adjustmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAdjustment_invoiceId_reference_key" ON "FinancialAdjustment"("invoiceId", "reference");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderResult" ADD CONSTRAINT "TenderResult_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CustomerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorCustomer" ADD CONSTRAINT "CompetitorCustomer_competitorId_fkey" FOREIGN KEY ("competitorId") REFERENCES "Competitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorCustomer" ADD CONSTRAINT "CompetitorCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "Installation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAdjustment" ADD CONSTRAINT "FinancialAdjustment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAdjustment" ADD CONSTRAINT "FinancialAdjustment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesOpportunity" ADD CONSTRAINT "SalesOpportunity_probability_range" CHECK ("probability" IS NULL OR "probability" BETWEEN 0 AND 100);
ALTER TABLE "OperationalCost" ADD CONSTRAINT "OperationalCost_amount_nonnegative" CHECK ("amount" >= 0);
ALTER TABLE "FinancialAdjustment" ADD CONSTRAINT "FinancialAdjustment_positive_amount" CHECK ("amount" > 0 AND "taxAmount" >= 0 AND ("type" != 'PAYMENT_REVERSAL' OR "taxAmount" = 0));
