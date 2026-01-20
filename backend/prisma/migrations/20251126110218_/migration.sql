-- AlterTable
ALTER TABLE "FleetRequest" ADD COLUMN     "durationType" TEXT,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "fromDate" TIMESTAMP(3),
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "toDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoUrl" TEXT;
