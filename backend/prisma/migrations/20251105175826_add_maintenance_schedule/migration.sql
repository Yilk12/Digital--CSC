-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'MAINTAINED');

-- AlterTable
ALTER TABLE "DriverDetaile" ADD COLUMN     "image" TEXT;

-- CreateTable
CREATE TABLE "MaintenanceSchedule" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'PENDING',
    "actionByUserId" UUID,
    "description" TEXT,
    "maintenanceScheduleTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_vehicleId_idx" ON "MaintenanceSchedule"("vehicleId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_userId_idx" ON "MaintenanceSchedule"("userId");

-- CreateIndex
CREATE INDEX "MaintenanceSchedule_actionByUserId_idx" ON "MaintenanceSchedule"("actionByUserId");

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceSchedule" ADD CONSTRAINT "MaintenanceSchedule_actionByUserId_fkey" FOREIGN KEY ("actionByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
