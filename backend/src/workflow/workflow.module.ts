import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { WorkflowService } from './workflow.service'
import { PlanAssignmentsController } from './plan-assignments.controller'

@Module({
  imports: [PrismaModule],
  controllers: [PlanAssignmentsController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
