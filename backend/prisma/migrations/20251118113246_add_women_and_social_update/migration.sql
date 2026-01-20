-- AlterTable
ALTER TABLE "WomenadnSocilaInclusion" ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "userId" UUID,
ADD COLUMN     "victimId" UUID;

-- CreateIndex
CREATE INDEX "WomenadnSocilaInclusion_victimId_idx" ON "WomenadnSocilaInclusion"("victimId");

-- CreateIndex
CREATE INDEX "WomenadnSocilaInclusion_departmentId_idx" ON "WomenadnSocilaInclusion"("departmentId");

-- CreateIndex
CREATE INDEX "WomenadnSocilaInclusion_userId_idx" ON "WomenadnSocilaInclusion"("userId");

-- AddForeignKey
ALTER TABLE "WomenadnSocilaInclusion" ADD CONSTRAINT "WomenadnSocilaInclusion_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WomenadnSocilaInclusion" ADD CONSTRAINT "WomenadnSocilaInclusion_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WomenadnSocilaInclusion" ADD CONSTRAINT "WomenadnSocilaInclusion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
