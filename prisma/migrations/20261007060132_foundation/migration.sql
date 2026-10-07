-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'DOCUMENTS_IN_PROGRESS', 'READY_FOR_SUBMISSION', 'SUBMITTED', 'WON', 'LOST', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ORDER_RECEIVED', 'MANUFACTURER_ORDER_PENDING', 'MANUFACTURER_ORDER_PLACED', 'PROCESSING', 'READY_FOR_DISPATCH', 'PARTIALLY_DELIVERED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Compliance" AS ENUM ('COMPLIES', 'DOES_NOT_COMPLY', 'REQUIRES_REVIEW');

-- CreateEnum
CREATE TYPE "InstallationStatus" AS ENUM ('PENDING', 'PARTIAL', 'INSTALLED', 'COMMISSIONED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "WarrantyBasis" AS ENUM ('DELIVERY', 'INSTALLATION', 'COMMISSIONING', 'ACCEPTANCE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "write" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "gstin" TEXT,
    "pan" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "signatory" TEXT,
    "designation" TEXT,
    "logoFileId" TEXT,
    "letterheadFileId" TEXT,
    "declarations" TEXT NOT NULL DEFAULT '',
    "additionalFields" JSONB NOT NULL DEFAULT '{}',
    "reminderDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "institutionType" TEXT,
    "address" TEXT,
    "state" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT,
    "manufacturerId" TEXT NOT NULL,
    "specifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "issueDate" DATE,
    "expiryDate" DATE,
    "manufacturerId" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "gemUrl" TEXT,
    "customerId" TEXT NOT NULL,
    "category" TEXT,
    "deadline" TIMESTAMP(3),
    "emd" DECIMAL(18,2),
    "estimatedValue" DECIMAL(18,2),
    "warrantyTerms" TEXT,
    "deliveryTerms" TEXT,
    "notes" TEXT,
    "status" "TenderStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderItem" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "model" TEXT,
    "quantity" INTEGER NOT NULL,
    "manufacturerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderRequirement" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "specification" TEXT NOT NULL DEFAULT '',
    "compliance" "Compliance" NOT NULL DEFAULT 'REQUIRES_REVIEW',
    "evidenceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenderStatusHistory" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "fromStatus" "TenderStatus",
    "toStatus" "TenderStatus" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT,
    "templateId" TEXT,
    "sourceModule" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "fileId" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "tenderId" TEXT,
    "customerId" TEXT NOT NULL,
    "poDate" DATE NOT NULL,
    "deliveryDeadline" DATE,
    "paymentTerms" TEXT,
    "notes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'ORDER_RECEIVED',
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "total" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "equipment" TEXT NOT NULL,
    "model" TEXT,
    "manufacturerId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "dispatchDate" DATE,
    "transporter" TEXT,
    "tracking" TEXT,
    "expectedDate" DATE,
    "actualDate" DATE,
    "location" TEXT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryItem" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "status" "InstallationStatus" NOT NULL DEFAULT 'PENDING',
    "installationDate" DATE,
    "commissioningDate" DATE,
    "acceptanceDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warranty" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "commencement" "WarrantyBasis" NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "terms" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyHistory" (
    "id" TEXT NOT NULL,
    "warrantyId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarrantyHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmcContract" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "serviceFrequencyMonths" INTEGER NOT NULL,
    "nextServiceDate" DATE,
    "responsibleName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "renewedFromId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmcContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmcEquipment" (
    "id" TEXT NOT NULL,
    "amcId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmcEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceVisit" (
    "id" TEXT NOT NULL,
    "amcId" TEXT NOT NULL,
    "employeeId" TEXT,
    "scheduledDate" DATE NOT NULL,
    "completedDate" DATE,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "complaint" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "invoiceDate" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "taxAmount" DECIMAL(18,2) NOT NULL,
    "total" DECIMAL(18,2) NOT NULL,
    "paymentTermDays" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "reference" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentFollowUp" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "employeeId" TEXT,
    "contactDate" DATE NOT NULL,
    "nextDate" DATE,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "companyDocumentId" TEXT,
    "tenderId" TEXT,
    "requirementId" TEXT,
    "orderId" TEXT,
    "deliveryId" TEXT,
    "warrantyId" TEXT,
    "amcId" TEXT,
    "invoiceId" TEXT,
    "serviceVisitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_userId_module_key" ON "Permission"("userId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_key_key" ON "LoginAttempt"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_manufacturerId_model_key" ON "Product"("manufacturerId", "model");

-- CreateIndex
CREATE INDEX "CompanyDocument_expiryDate_idx" ON "CompanyDocument"("expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Tender_number_key" ON "Tender"("number");

-- CreateIndex
CREATE INDEX "Tender_deadline_status_idx" ON "Tender"("deadline", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_fileId_key" ON "GeneratedDocument"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_number_key" ON "PurchaseOrder"("number");

-- CreateIndex
CREATE INDEX "PurchaseOrder_deliveryDeadline_status_idx" ON "PurchaseOrder"("deliveryDeadline", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryItem_deliveryId_orderItemId_key" ON "DeliveryItem"("deliveryId", "orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_serialNumber_key" ON "Equipment"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Installation_equipmentId_key" ON "Installation"("equipmentId");

-- CreateIndex
CREATE INDEX "Warranty_endDate_idx" ON "Warranty"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "AmcContract_number_key" ON "AmcContract"("number");

-- CreateIndex
CREATE INDEX "AmcContract_endDate_nextServiceDate_idx" ON "AmcContract"("endDate", "nextServiceDate");

-- CreateIndex
CREATE UNIQUE INDEX "AmcEquipment_amcId_equipmentId_key" ON "AmcEquipment"("amcId", "equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "PaymentFollowUp_nextDate_idx" ON "PaymentFollowUp"("nextDate");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_key_key" ON "Notification"("userId", "key");

-- CreateIndex
CREATE INDEX "AuditLog_module_createdAt_idx" ON "AuditLog"("module", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoredFile_key_key" ON "StoredFile"("key");

-- CreateIndex
CREATE INDEX "StoredFile_module_recordId_idx" ON "StoredFile"("module", "recordId");

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tender" ADD CONSTRAINT "Tender_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderItem" ADD CONSTRAINT "TenderItem_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderItem" ADD CONSTRAINT "TenderItem_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderRequirement" ADD CONSTRAINT "TenderRequirement_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenderStatusHistory" ADD CONSTRAINT "TenderStatusHistory_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "StoredFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryItem" ADD CONSTRAINT "DeliveryItem_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installation" ADD CONSTRAINT "Installation_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warranty" ADD CONSTRAINT "Warranty_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyHistory" ADD CONSTRAINT "WarrantyHistory_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcContract" ADD CONSTRAINT "AmcContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcEquipment" ADD CONSTRAINT "AmcEquipment_amcId_fkey" FOREIGN KEY ("amcId") REFERENCES "AmcContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmcEquipment" ADD CONSTRAINT "AmcEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_amcId_fkey" FOREIGN KEY ("amcId") REFERENCES "AmcContract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisit" ADD CONSTRAINT "ServiceVisit_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFollowUp" ADD CONSTRAINT "PaymentFollowUp_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentFollowUp" ADD CONSTRAINT "PaymentFollowUp_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_companyDocumentId_fkey" FOREIGN KEY ("companyDocumentId") REFERENCES "CompanyDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "TenderRequirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_amcId_fkey" FOREIGN KEY ("amcId") REFERENCES "AmcContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_serviceVisitId_fkey" FOREIGN KEY ("serviceVisitId") REFERENCES "ServiceVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
