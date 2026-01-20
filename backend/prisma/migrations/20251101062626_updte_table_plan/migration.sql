-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "departmentHeadId" UUID,
ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "endUserId" UUID,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "tasks" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "teamLeaderId" UUID,
ADD COLUMN     "titleAm" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "typeAm" TEXT;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_departmentHeadId_fkey" FOREIGN KEY ("departmentHeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_endUserId_fkey" FOREIGN KEY ("endUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
