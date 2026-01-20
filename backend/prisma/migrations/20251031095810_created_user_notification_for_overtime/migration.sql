-- CreateTable
CREATE TABLE "UserOvertimeNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "overtimeRequestId" UUID NOT NULL,
    "departmentId" UUID,
    "actionByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserOvertimeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserOvertimeNotification_userId_idx" ON "UserOvertimeNotification"("userId");

-- CreateIndex
CREATE INDEX "UserOvertimeNotification_overtimeRequestId_idx" ON "UserOvertimeNotification"("overtimeRequestId");

-- CreateIndex
CREATE INDEX "UserOvertimeNotification_departmentId_idx" ON "UserOvertimeNotification"("departmentId");

-- CreateIndex
CREATE INDEX "UserOvertimeNotification_actionByUserId_idx" ON "UserOvertimeNotification"("actionByUserId");

-- AddForeignKey
ALTER TABLE "UserOvertimeNotification" ADD CONSTRAINT "UserOvertimeNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOvertimeNotification" ADD CONSTRAINT "UserOvertimeNotification_actionByUserId_fkey" FOREIGN KEY ("actionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOvertimeNotification" ADD CONSTRAINT "UserOvertimeNotification_overtimeRequestId_fkey" FOREIGN KEY ("overtimeRequestId") REFERENCES "OvertimeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOvertimeNotification" ADD CONSTRAINT "UserOvertimeNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
