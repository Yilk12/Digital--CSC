-- AlterEnum
ALTER TYPE "MaintenanceStatus" ADD VALUE 'REJECTED';

-- AlterTable
ALTER TABLE "FuelRequest" ADD COLUMN     "remainingFuelRequest" DOUBLE PRECISION,
ADD COLUMN     "returnOdometerKm" INTEGER;
