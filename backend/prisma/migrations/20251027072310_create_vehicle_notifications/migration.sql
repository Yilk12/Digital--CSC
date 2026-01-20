-- CreateTable
CREATE TABLE "VehicleNotification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vehicleId" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleNotification_userId_idx" ON "VehicleNotification"("userId");

-- CreateIndex
CREATE INDEX "VehicleNotification_vehicleId_idx" ON "VehicleNotification"("vehicleId");

-- AddForeignKey
ALTER TABLE "VehicleNotification" ADD CONSTRAINT "VehicleNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleNotification" ADD CONSTRAINT "VehicleNotification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
