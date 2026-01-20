-- CreateEnum
CREATE TYPE "FuelStatus" AS ENUM ('FUELED', 'NOT_FUELED', 'HALF_FUELED');

-- AlterTable
ALTER TABLE "FuelRequest" ADD COLUMN     "status" "FuelStatus" NOT NULL DEFAULT 'NOT_FUELED';
