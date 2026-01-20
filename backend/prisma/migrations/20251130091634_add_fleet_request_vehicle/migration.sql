-- CreateTable
CREATE TABLE "FleetRequestVehicle" (
    "id" SERIAL NOT NULL,
    "fleetRequestId" INTEGER NOT NULL,
    "vehicleId" UUID NOT NULL,

    CONSTRAINT "FleetRequestVehicle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FleetRequestVehicle" ADD CONSTRAINT "FleetRequestVehicle_fleetRequestId_fkey" FOREIGN KEY ("fleetRequestId") REFERENCES "FleetRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetRequestVehicle" ADD CONSTRAINT "FleetRequestVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
