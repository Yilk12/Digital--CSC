-- CreateTable
CREATE TABLE "FleetCostRegistration" (
    "id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vehicleId" UUID NOT NULL,
    "category" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "reference" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FleetCostRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FleetCostRegistration_vehicleId_idx" ON "FleetCostRegistration"("vehicleId");

-- AddForeignKey
ALTER TABLE "FleetCostRegistration" ADD CONSTRAINT "FleetCostRegistration_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
