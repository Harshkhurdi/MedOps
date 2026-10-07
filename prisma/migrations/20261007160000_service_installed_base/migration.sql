-- AlterEnum
ALTER TYPE "WarrantyBasis" ADD VALUE 'CONTRACT';

-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Equipment" DROP CONSTRAINT "Equipment_orderItemId_fkey";

-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "department" TEXT,
ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "manufacturerId" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "productName" TEXT,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "orderId" DROP NOT NULL,
ALTER COLUMN "orderItemId" DROP NOT NULL,
ALTER COLUMN "deliveryId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Installation" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "StoredFile" ADD COLUMN     "ticketId" TEXT,
ADD COLUMN     "ticketVisitId" TEXT;

-- AlterTable
ALTER TABLE "Warranty" ADD COLUMN     "historical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalDate" DATE,
ADD COLUMN     "recordSource" TEXT NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "manufacturerId" TEXT,
    "serialNumber" TEXT,
    "productName" TEXT NOT NULL,
    "model" TEXT,
    "department" TEXT,
    "issue" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "reportedAt" TIMESTAMP(3) NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "firstVisitAt" TIMESTAMP(3),
    "scheduledVisit" TIMESTAMP(3),
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "slaRuleId" TEXT,
    "assignmentDueAt" TIMESTAMP(3),
    "firstVisitDueAt" TIMESTAMP(3),
    "resolutionDueAt" TIMESTAMP(3),
    "notes" TEXT,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketVisit" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "engineerId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "workDone" TEXT,
    "representative" TEXT,
    "acknowledgement" TEXT,
    "nextVisit" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "customerId" TEXT,
    "manufacturerId" TEXT,
    "amcId" TEXT,
    "warrantyType" TEXT,
    "assignmentHours" INTEGER NOT NULL,
    "firstVisitHours" INTEGER NOT NULL,
    "resolutionHours" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmcOpportunity" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "amcId" TEXT,
    "reason" TEXT NOT NULL,
    "triggerDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "assignedToId" TEXT,
    "followUpDate" TIMESTAMP(3),
    "estimatedValue" DECIMAL(18,2),
    "notes" TEXT,
    "generated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmcOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumable" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturerId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consumable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumableCompatibility" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "consumableId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumableCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumableOpportunity" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "consumableId" TEXT NOT NULL,
    "lastSale" DATE,
    "lastQuantity" INTEGER,
    "nextFollowUp" TIMESTAMP(3),
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumableOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SparePart" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturerId" TEXT,
    "compatibleModels" TEXT,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(18,2),
    "location" TEXT,
    "supplier" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "fromReserved" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "ticketId" TEXT,
    "engineerId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "actorId" TEXT NOT NULL,
    "onHandAfter" INTEGER NOT NULL,
    "reservedAfter" INTEGER NOT NULL,
    "notes" TEXT,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceTicket_number_key" ON "ServiceTicket"("number");

-- CreateIndex
CREATE INDEX "ServiceTicket_customerId_equipmentId_idx" ON "ServiceTicket"("customerId", "equipmentId");

-- CreateIndex
CREATE INDEX "ServiceTicket_assignedToId_status_scheduledVisit_idx" ON "ServiceTicket"("assignedToId", "status", "scheduledVisit");

-- CreateIndex
CREATE INDEX "ServiceTicket_priority_status_resolutionDueAt_idx" ON "ServiceTicket"("priority", "status", "resolutionDueAt");

-- CreateIndex
CREATE INDEX "TicketVisit_engineerId_status_scheduledAt_idx" ON "TicketVisit"("engineerId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "SlaRule_customerId_manufacturerId_active_idx" ON "SlaRule"("customerId", "manufacturerId", "active");

-- CreateIndex
CREATE INDEX "AmcOpportunity_status_followUpDate_idx" ON "AmcOpportunity"("status", "followUpDate");

-- CreateIndex
CREATE UNIQUE INDEX "AmcOpportunity_equipmentId_reason_key" ON "AmcOpportunity"("equipmentId", "reason");

-- CreateIndex
CREATE UNIQUE INDEX "Consumable_sku_key" ON "Consumable"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ConsumableCompatibility_productId_consumableId_key" ON "ConsumableCompatibility"("productId", "consumableId");

-- CreateIndex
CREATE INDEX "ConsumableOpportunity_customerId_equipmentId_status_idx" ON "ConsumableOpportunity"("customerId", "equipmentId", "status");

-- CreateIndex
CREATE INDEX "ConsumableOpportunity_nextFollowUp_idx" ON "ConsumableOpportunity"("nextFollowUp");

-- CreateIndex
CREATE UNIQUE INDEX "SparePart_sku_key" ON "SparePart"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryTransaction_requestId_key" ON "InventoryTransaction"("requestId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_partId_transactionDate_idx" ON "InventoryTransaction"("partId", "transactionDate");

-- CreateIndex
CREATE INDEX "InventoryTransaction_ticketId_idx" ON "InventoryTransaction"("ticketId");

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_ticketVisitId_fkey" FOREIGN KEY ("ticketVisitId") REFERENCES "TicketVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_slaRuleId_fkey" FOREIGN KEY ("slaRuleId") REFERENCES "SlaRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketVisit" ADD CONSTRAINT "TicketVisit_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaRule" ADD CONSTRAINT "SlaRule_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaRule" ADD CONSTRAINT "SlaRule_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaRule" ADD CONSTRAINT "SlaRule_amcId_fkey" FOREIGN KEY ("amcId") REFERENCES "AmcContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcOpportunity" ADD CONSTRAINT "AmcOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcOpportunity" ADD CONSTRAINT "AmcOpportunity_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcOpportunity" ADD CONSTRAINT "AmcOpportunity_amcId_fkey" FOREIGN KEY ("amcId") REFERENCES "AmcContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumable" ADD CONSTRAINT "Consumable_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableCompatibility" ADD CONSTRAINT "ConsumableCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableCompatibility" ADD CONSTRAINT "ConsumableCompatibility_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableOpportunity" ADD CONSTRAINT "ConsumableOpportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableOpportunity" ADD CONSTRAINT "ConsumableOpportunity_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsumableOpportunity" ADD CONSTRAINT "ConsumableOpportunity_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES "Consumable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePart" ADD CONSTRAINT "SparePart_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "SparePart"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SparePart" ADD CONSTRAINT "reserved_stock_valid" CHECK ("reserved">=0 AND "reserved"<=GREATEST("onHand",0)), ADD CONSTRAINT "reorder_nonnegative" CHECK ("reorderLevel">=0), ADD CONSTRAINT "unit_cost_nonnegative" CHECK ("unitCost" IS NULL OR "unitCost">=0);
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "inventory_quantity_valid" CHECK ("quantity"<>0 AND ("type"='ADJUSTMENT' OR "quantity">0)), ADD CONSTRAINT "reserved_after_valid" CHECK ("reservedAfter">=0 AND "reservedAfter"<=GREATEST("onHandAfter",0));
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ticket_resolution_ordered" CHECK ("resolvedAt" IS NULL OR "resolvedAt">="reportedAt");
ALTER TABLE "TicketVisit" ADD CONSTRAINT "ticket_visit_dates_ordered" CHECK ("completedAt" IS NULL OR ("startedAt" IS NOT NULL AND "completedAt">="startedAt"));
ALTER TABLE "SlaRule" ADD CONSTRAINT "sla_positive_hours" CHECK ("assignmentHours">0 AND "firstVisitHours">0 AND "resolutionHours">0);
