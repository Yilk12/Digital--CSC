-- AlterTable
ALTER TABLE "AllNotification" ADD COLUMN     "departmentId" UUID;

-- AddForeignKey
ALTER TABLE "AllNotification" ADD CONSTRAINT "AllNotification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
