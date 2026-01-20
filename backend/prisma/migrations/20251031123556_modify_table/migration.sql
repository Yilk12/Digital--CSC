/*
  Warnings:

  - You are about to drop the column `assignedDepartmentId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `contactEmail` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `contactPhone` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `decisionAt` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `decisionSummary` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `escalatedTo` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `gmReviewerId` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `submitterDepartment` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the column `submitterName` on the `Submission` table. All the data in the column will be lost.
  - You are about to drop the `Feedback` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "SubmissionType" ADD VALUE 'COMPLIMENT';

-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Submission" DROP CONSTRAINT "Submission_assignedDepartmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Submission" DROP CONSTRAINT "Submission_gmReviewerId_fkey";

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "assignedDepartmentId",
DROP COLUMN "contactEmail",
DROP COLUMN "contactPhone",
DROP COLUMN "decisionAt",
DROP COLUMN "decisionSummary",
DROP COLUMN "escalatedTo",
DROP COLUMN "gmReviewerId",
DROP COLUMN "status",
DROP COLUMN "subject",
DROP COLUMN "submitterDepartment",
DROP COLUMN "submitterName",
ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "recipientUserId" UUID;

-- DropTable
DROP TABLE "public"."Feedback";

-- DropEnum
DROP TYPE "public"."FeedbackCategory";

-- CreateIndex
CREATE INDEX "Submission_recipientUserId_idx" ON "Submission"("recipientUserId");

-- CreateIndex
CREATE INDEX "Submission_departmentId_idx" ON "Submission"("departmentId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
