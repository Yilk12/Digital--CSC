-- CreateEnum
CREATE TYPE "OvertimeType" AS ENUM ('EXTRA_TIME', 'WEEKEND');

-- CreateEnum
CREATE TYPE "OvertimeDurationType" AS ENUM ('HALF_TIME', 'FULL_DAY');

-- CreateTable
CREATE TABLE "OvertimeRequest" (
    "id" UUID NOT NULL,
    "reqId" UUID NOT NULL,
    "departmentId" UUID,
    "overtimeType" "OvertimeType" NOT NULL,
    "durationType" "OvertimeDurationType" NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "dates" TIMESTAMP(3)[],
    "description" TEXT,
    "status" "RequestDecisionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vehicleId" UUID,

    CONSTRAINT "OvertimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimeNotification" (
    "id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "overtimeRequestId" UUID NOT NULL,
    "departmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleId" UUID,

    CONSTRAINT "OvertimeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OvertimeRequest_reqId_idx" ON "OvertimeRequest"("reqId");

-- CreateIndex
CREATE INDEX "OvertimeRequest_departmentId_idx" ON "OvertimeRequest"("departmentId");

-- CreateIndex
CREATE INDEX "OvertimeNotification_userId_idx" ON "OvertimeNotification"("userId");

-- CreateIndex
CREATE INDEX "OvertimeNotification_overtimeRequestId_idx" ON "OvertimeNotification"("overtimeRequestId");

-- CreateIndex
CREATE INDEX "OvertimeNotification_departmentId_idx" ON "OvertimeNotification"("departmentId");

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_overtimeRequestId_fkey" FOREIGN KEY ("overtimeRequestId") REFERENCES "OvertimeRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeNotification" ADD CONSTRAINT "OvertimeNotification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
