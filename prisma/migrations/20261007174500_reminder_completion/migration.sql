-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "reminderAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Notification_userId_completedAt_dismissedAt_reminderAt_idx" ON "Notification"("userId", "completedAt", "dismissedAt", "reminderAt");
