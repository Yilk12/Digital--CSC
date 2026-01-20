/*
  Warnings:

  - The values [OPEN,CLOSED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReadStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
BEGIN;
CREATE TYPE "TicketStatus_new" AS ENUM ('IN_PROGRESS', 'RESOLVED', 'PENDING');
ALTER TABLE "public"."Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus_new" USING ("status"::text::"TicketStatus_new");
ALTER TYPE "TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
COMMIT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "isRead" "ReadStatus" NOT NULL DEFAULT 'CLOSED',
ALTER COLUMN "status" SET DEFAULT 'IN_PROGRESS';
