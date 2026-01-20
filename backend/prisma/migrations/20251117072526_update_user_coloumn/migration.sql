-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstNameAm" TEXT,
ADD COLUMN     "lastNameAm" TEXT,
ADD COLUMN     "middleName" TEXT,
ADD COLUMN     "middleNameAm" TEXT;

-- CreateTable
CREATE TABLE "AnnouncementCommentReply" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "authorId" UUID,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementCommentReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnnouncementCommentReply_commentId_idx" ON "AnnouncementCommentReply"("commentId");

-- CreateIndex
CREATE INDEX "AnnouncementCommentReply_authorId_idx" ON "AnnouncementCommentReply"("authorId");

-- AddForeignKey
ALTER TABLE "AnnouncementCommentReply" ADD CONSTRAINT "AnnouncementCommentReply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "AnnouncementComment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementCommentReply" ADD CONSTRAINT "AnnouncementCommentReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
