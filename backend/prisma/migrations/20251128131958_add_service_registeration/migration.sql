-- CreateTable
CREATE TABLE "ServiceRegistration" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "vehicleModel" TEXT,
    "odometerKm" INTEGER NOT NULL,
    "reachedDate5000" TIMESTAMP(3),
    "driverId" UUID,
    "driverName" TEXT,
    "garageName" TEXT,
    "serviceCenter" TEXT,
    "serviceStart" TIMESTAMP(3),
    "serviceEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceRegistration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceRegistration" ADD CONSTRAINT "ServiceRegistration_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRegistration" ADD CONSTRAINT "ServiceRegistration_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
