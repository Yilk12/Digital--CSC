-- CreateTable
CREATE TABLE "FieldNotification" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "fieldRequestId" UUID NOT NULL,
    "departmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FieldNotification_userId_idx" ON "FieldNotification"("userId");

-- CreateIndex
CREATE INDEX "FieldNotification_fieldRequestId_idx" ON "FieldNotification"("fieldRequestId");

-- CreateIndex
CREATE INDEX "FieldNotification_departmentId_idx" ON "FieldNotification"("departmentId");

-- AddForeignKey
ALTER TABLE "FieldNotification" ADD CONSTRAINT "FieldNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldNotification" ADD CONSTRAINT "FieldNotification_fieldRequestId_fkey" FOREIGN KEY ("fieldRequestId") REFERENCES "FieldRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldNotification" ADD CONSTRAINT "FieldNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
