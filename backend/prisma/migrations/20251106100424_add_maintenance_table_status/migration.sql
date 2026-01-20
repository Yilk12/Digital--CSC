/*
  Warnings:

  - Added the required column `status` to the `MaintainedVehicle` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaintainedVehicleStatus" AS ENUM ('ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "MaintainedVehicle" ADD COLUMN     "status" "MaintainedVehicleStatus" NOT NULL;
