-- AlterTable
ALTER TABLE "FleetRequest" ADD COLUMN     "odometerKmDiff" INTEGER,
ADD COLUMN     "passengerCount" INTEGER,
ADD COLUMN     "returnOdometerKm" INTEGER,
ADD COLUMN     "returnTime" TEXT,
ADD COLUMN     "startOdometerKm" INTEGER;
