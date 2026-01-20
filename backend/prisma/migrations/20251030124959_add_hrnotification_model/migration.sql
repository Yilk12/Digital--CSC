-- CreateTable
CREATE TABLE "HrNotification" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "fieldRequestId" UUID NOT NULL,
    "reqId" UUID NOT NULL,
    "actionByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HrNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HrNotification_fieldRequestId_idx" ON "HrNotification"("fieldRequestId");

-- CreateIndex
CREATE INDEX "HrNotification_reqId_idx" ON "HrNotification"("reqId");

-- CreateIndex
CREATE INDEX "HrNotification_actionByUserId_idx" ON "HrNotification"("actionByUserId");

-- AddForeignKey
ALTER TABLE "HrNotification" ADD CONSTRAINT "HrNotification_fieldRequestId_fkey" FOREIGN KEY ("fieldRequestId") REFERENCES "FieldRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrNotification" ADD CONSTRAINT "HrNotification_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrNotification" ADD CONSTRAINT "HrNotification_actionByUserId_fkey" FOREIGN KEY ("actionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
