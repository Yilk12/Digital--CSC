-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('NEW', 'USED');

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'NEW';
