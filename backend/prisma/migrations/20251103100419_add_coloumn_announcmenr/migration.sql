-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';
