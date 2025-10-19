import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { PlanningService } from './planning.service'
import { PlanningController } from './planning.controller'

@Module({
  imports: [PrismaModule],
  controllers: [PlanningController],
  providers: [PlanningService],
  exports: [PlanningService],
})
export class PlanningModule {}
