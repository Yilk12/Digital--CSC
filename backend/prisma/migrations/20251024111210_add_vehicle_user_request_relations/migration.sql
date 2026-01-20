/*
  Warnings:

  - You are about to drop the column `departmentId` on the `Vehicle` table. All the data in the column will be lost.
  - Added the required column `reqId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'Team_Leader';

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "departmentId",
ADD COLUMN     "reqId" INTEGER NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "FleetRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
