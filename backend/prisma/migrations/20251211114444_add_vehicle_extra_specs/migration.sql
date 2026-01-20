-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "chassisNumber" TEXT,
ADD COLUMN     "countryOfOrigin" TEXT,
ADD COLUMN     "cylinderCount" INTEGER,
ADD COLUMN     "engineNumber" TEXT,
ADD COLUMN     "fuelType" TEXT,
ADD COLUMN     "kmPerLiter" DOUBLE PRECISION,
ADD COLUMN     "seatingCapacity" INTEGER,
ADD COLUMN     "vehicleTypeName" TEXT;
