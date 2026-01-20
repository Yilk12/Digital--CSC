-- CreateTable
CREATE TABLE "HrOvertimeNotification" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "overtimeRequestId" UUID NOT NULL,
    "reqId" UUID NOT NULL,
    "actionByUserId" UUID,
    "departmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrOvertimeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HrOvertimeNotification_overtimeRequestId_idx" ON "HrOvertimeNotification"("overtimeRequestId");

-- CreateIndex
CREATE INDEX "HrOvertimeNotification_reqId_idx" ON "HrOvertimeNotification"("reqId");

-- CreateIndex
CREATE INDEX "HrOvertimeNotification_actionByUserId_idx" ON "HrOvertimeNotification"("actionByUserId");

-- CreateIndex
CREATE INDEX "HrOvertimeNotification_departmentId_idx" ON "HrOvertimeNotification"("departmentId");

-- AddForeignKey
ALTER TABLE "HrOvertimeNotification" ADD CONSTRAINT "HrOvertimeNotification_overtimeRequestId_fkey" FOREIGN KEY ("overtimeRequestId") REFERENCES "OvertimeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrOvertimeNotification" ADD CONSTRAINT "HrOvertimeNotification_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrOvertimeNotification" ADD CONSTRAINT "HrOvertimeNotification_actionByUserId_fkey" FOREIGN KEY ("actionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrOvertimeNotification" ADD CONSTRAINT "HrOvertimeNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
