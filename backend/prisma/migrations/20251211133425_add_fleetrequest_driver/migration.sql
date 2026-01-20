-- AlterTable
ALTER TABLE "FleetRequest" ADD COLUMN     "driverId" UUID,
ADD COLUMN     "userId" UUID;

-- AddForeignKey
ALTER TABLE "FleetRequest" ADD CONSTRAINT "FleetRequest_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FleetRequest" ADD CONSTRAINT "FleetRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
