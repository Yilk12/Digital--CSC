-- CreateTable
CREATE TABLE "VehicleReturn" (
    "id" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "returnedAt" TIMESTAMP(3) NOT NULL,
    "finalOdometerKm" INTEGER NOT NULL,
    "fuelLevel" TEXT NOT NULL,
    "warningLightsOn" BOOLEAN NOT NULL,
    "vehicleInspection" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleReturn_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleReturn" ADD CONSTRAINT "VehicleReturn_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleReturn" ADD CONSTRAINT "VehicleReturn_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
