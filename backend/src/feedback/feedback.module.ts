import { Module } from "@nestjs/common"
import { FeedbackService } from "./feedback.service"
import { FeedbackController } from "./feedback.controller"
import { PrismaModule } from "../prisma/prisma.module"
import { CommonModule } from "../common/common.module"

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
