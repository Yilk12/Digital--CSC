/*
  Warnings:

  - You are about to drop the column `requireAtSymbol` on the `PasswordPolicy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PasswordPolicy" DROP COLUMN "requireAtSymbol",
ADD COLUMN     "requireSpecialcharSymbol" BOOLEAN NOT NULL DEFAULT true;
