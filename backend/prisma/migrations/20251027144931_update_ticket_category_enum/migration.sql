/*
  Warnings:

  - The values [GENERAL,IT,HR,FINANCE] on the enum `TicketCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TicketCategory_new" AS ENUM ('REQUEST', 'PROBLEM', 'CHANGE', 'INCIDENT');
ALTER TABLE "Ticket" ALTER COLUMN "category" TYPE "TicketCategory_new" USING ("category"::text::"TicketCategory_new");
ALTER TYPE "TicketCategory" RENAME TO "TicketCategory_old";
ALTER TYPE "TicketCategory_new" RENAME TO "TicketCategory";
DROP TYPE "public"."TicketCategory_old";
COMMIT;
