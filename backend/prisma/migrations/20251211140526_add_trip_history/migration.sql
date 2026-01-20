-- CreateTable
CREATE TABLE "TripHistory" (
    "id" UUID NOT NULL,
    "fleetRequestId" INTEGER NOT NULL,
    "vehicleId" UUID NOT NULL,
    "driverId" UUID NOT NULL,
    "requestorId" UUID NOT NULL,
    "departmentId" UUID,
    "requesterName" TEXT,
    "requesterPhone" TEXT,
    "purpose" TEXT,
    "destination" TEXT,
    "date" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "startOdometerKm" INTEGER,
    "returnOdometerKm" INTEGER,
    "odometerKmDiff" INTEGER,
    "passengerCount" INTEGER,
    "returnTime" TEXT,
    "status" TEXT,
    "vehiclePlate" TEXT,
    "vehicleMakeModel" TEXT,
    "kmPerLiter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripHistory_fleetRequestId_idx" ON "TripHistory"("fleetRequestId");

-- CreateIndex
CREATE INDEX "TripHistory_vehicleId_idx" ON "TripHistory"("vehicleId");

-- CreateIndex
CREATE INDEX "TripHistory_driverId_idx" ON "TripHistory"("driverId");

-- CreateIndex
CREATE INDEX "TripHistory_requestorId_idx" ON "TripHistory"("requestorId");

-- CreateIndex
CREATE INDEX "TripHistory_departmentId_idx" ON "TripHistory"("departmentId");

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_fleetRequestId_fkey" FOREIGN KEY ("fleetRequestId") REFERENCES "FleetRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripHistory" ADD CONSTRAINT "TripHistory_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
