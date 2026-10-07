-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT NOT NULL DEFAULT '',
    "aiDailyLimit" INTEGER NOT NULL DEFAULT 10,
    "aiMaxOutputTokens" INTEGER NOT NULL DEFAULT 1200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "purpose" TEXT NOT NULL,
    "promptHash" TEXT NOT NULL,
    "inputCharacters" INTEGER NOT NULL,
    "outputTokens" INTEGER,
    "costUsd" DECIMAL(16,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_assignedToId_status_dueDate_idx" ON "Task"("assignedToId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");

-- CreateIndex
CREATE INDEX "AiRequest_userId_createdAt_idx" ON "AiRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Guard constraints complement API validation.
ALTER TABLE "Task" ADD CONSTRAINT "Task_status_valid" CHECK ("status" IN ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'));
ALTER TABLE "Task" ADD CONSTRAINT "Task_priority_valid" CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_singleton" CHECK ("id" = 'main');
ALTER TABLE "AppSettings" ADD CONSTRAINT "AppSettings_limits" CHECK ("aiDailyLimit" BETWEEN 1 AND 100 AND "aiMaxOutputTokens" BETWEEN 100 AND 4000);
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_status_valid" CHECK ("status" IN ('PENDING', 'SUCCEEDED', 'FAILED'));
ALTER TABLE "AiRequest" ADD CONSTRAINT "AiRequest_size_valid" CHECK ("inputCharacters" BETWEEN 10 AND 8000 AND ("outputTokens" IS NULL OR "outputTokens" >= 0) AND ("costUsd" IS NULL OR "costUsd" >= 0));
