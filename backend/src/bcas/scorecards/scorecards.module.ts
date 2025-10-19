import { Module } from '@nestjs/common'
import { ScorecardsService } from './scorecards.service'
import { ScorecardsController } from './scorecards.controller'
import { PrismaService } from '../../prisma/prisma.service'

@Module({
  controllers: [ScorecardsController],
  providers: [ScorecardsService, PrismaService],
  exports: [ScorecardsService],
})
export class ScorecardsModule {}
