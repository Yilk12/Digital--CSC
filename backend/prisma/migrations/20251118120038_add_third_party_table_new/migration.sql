/*
  Warnings:

  - Added the required column `reqId` to the `ThirdPartySexualAssault` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ThirdPartySexualAssault" ADD COLUMN     "reqId" UUID NOT NULL,
ADD COLUMN     "victimId" UUID;

-- CreateIndex
CREATE INDEX "ThirdPartySexualAssault_reqId_idx" ON "ThirdPartySexualAssault"("reqId");

-- CreateIndex
CREATE INDEX "ThirdPartySexualAssault_victimId_idx" ON "ThirdPartySexualAssault"("victimId");

-- AddForeignKey
ALTER TABLE "ThirdPartySexualAssault" ADD CONSTRAINT "ThirdPartySexualAssault_reqId_fkey" FOREIGN KEY ("reqId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThirdPartySexualAssault" ADD CONSTRAINT "ThirdPartySexualAssault_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
