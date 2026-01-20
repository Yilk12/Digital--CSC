-- CreateTable
CREATE TABLE "MaintainedVehicle" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "completedDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "cost" DECIMAL(12,2),
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintainedVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintainedVehicle_vehicleId_idx" ON "MaintainedVehicle"("vehicleId");

-- AddForeignKey
ALTER TABLE "MaintainedVehicle" ADD CONSTRAINT "MaintainedVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
