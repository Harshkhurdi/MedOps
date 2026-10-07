-- AlterTable
ALTER TABLE "StoredFile" ADD COLUMN     "securityId" TEXT;

-- CreateTable
CREATE TABLE "Security" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tenderId" TEXT,
    "orderId" TEXT,
    "customerId" TEXT NOT NULL,
    "bank" TEXT,
    "reference" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "issueDate" DATE,
    "validityDate" DATE,
    "claimExpiry" DATE,
    "expectedRefundDate" DATE,
    "actualRefundDate" DATE,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "historical" BOOLEAN NOT NULL DEFAULT false,
    "originalDate" DATE,
    "recordSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BidChecklist" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BidChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalPolicy" (
    "id" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "preventSelf" BOOLEAN NOT NULL DEFAULT true,
    "approverRole" TEXT NOT NULL DEFAULT 'ADMIN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "relatedModule" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "relevantVersion" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdById" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "submittedById" TEXT,
    "submittedAt" TIMESTAMP(3),
    "decisionById" TEXT,
    "decisionAt" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalEvent" (
    "id" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "comments" TEXT,
    "relevantVersion" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailLog" (
    "id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "relatedModule" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerId" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Security_status_validityDate_idx" ON "Security"("status", "validityDate");

-- CreateIndex
CREATE INDEX "Security_customerId_expectedRefundDate_idx" ON "Security"("customerId", "expectedRefundDate");

-- CreateIndex
CREATE INDEX "Security_tenderId_orderId_idx" ON "Security"("tenderId", "orderId");

-- CreateIndex
CREATE INDEX "BidChecklist_tenderId_status_idx" ON "BidChecklist"("tenderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BidChecklist_tenderId_section_title_key" ON "BidChecklist"("tenderId", "section", "title");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalPolicy_workflow_key" ON "ApprovalPolicy"("workflow");

-- CreateIndex
CREATE INDEX "Approval_relatedModule_recordId_status_idx" ON "Approval"("relatedModule", "recordId", "status");

-- CreateIndex
CREATE INDEX "Approval_approverId_status_idx" ON "Approval"("approverId", "status");

-- CreateIndex
CREATE INDEX "MailLog_relatedModule_recordId_idx" ON "MailLog"("relatedModule", "recordId");

-- AddForeignKey
ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Security" ADD CONSTRAINT "Security_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BidChecklist" ADD CONSTRAINT "BidChecklist_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "Tender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalEvent" ADD CONSTRAINT "ApprovalEvent_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "Approval"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Security" ADD CONSTRAINT "security_amount_nonnegative" CHECK ("amount" >= 0), ADD CONSTRAINT "security_dates_ordered" CHECK ("validityDate" IS NULL OR "issueDate" IS NULL OR "validityDate" >= "issueDate");
ALTER TABLE "QuotationRevision" ADD CONSTRAINT "quotation_nonnegative" CHECK ("quantity">0 AND "unitPrice">=0 AND "total">=0 AND "discount">=0), ADD CONSTRAINT "quotation_dates_ordered" CHECK ("validityDate" IS NULL OR "validityDate">="quotationDate");
ALTER TABLE "Rfq" ADD CONSTRAINT "rfq_quantity_positive" CHECK ("quantity">0);
