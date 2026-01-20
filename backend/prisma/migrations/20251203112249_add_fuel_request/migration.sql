/*
  Warnings:

  - You are about to drop the `FleetRequestVehicle` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FuelAmountType" AS ENUM ('LITER', 'COUPON', 'CASH');

-- DropForeignKey
ALTER TABLE "public"."FleetRequestVehicle" DROP CONSTRAINT "FleetRequestVehicle_fleetRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."FleetRequestVehicle" DROP CONSTRAINT "FleetRequestVehicle_vehicleId_fkey";

-- DropTable
DROP TABLE "public"."FleetRequestVehicle";

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" UUID NOT NULL,
    "requestorId" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountType" "FuelAmountType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_requestorId_fkey" FOREIGN KEY ("requestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
