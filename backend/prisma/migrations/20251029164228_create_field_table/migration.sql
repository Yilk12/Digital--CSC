-- CreateEnum
CREATE TYPE "RequestDecisionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "FieldRequest" (
    "id" UUID NOT NULL,
    "reqId" UUID NOT NULL,
    "departmentId" UUID,
    "fieldType" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "durationType" TEXT,
    "isRead" "ReadStatus" NOT NULL DEFAULT 'CLOSED',
    "status" "RequestDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FieldRequest_reqId_idx" ON "FieldRequest"("reqId");

-- CreateIndex
CREATE INDEX "FieldRequest_departmentId_idx" ON "FieldRequest"("departmentId");

-- AddForeignKey
ALTER TABLE "FieldRequest" ADD CONSTRAINT "FieldRequest_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldRequest" ADD CONSTRAINT "FieldRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
