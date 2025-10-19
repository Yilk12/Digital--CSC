import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { WorkflowService } from './workflow.service'
import { PlanAssignmentsController } from './plan-assignments.controller'
import { FieldOvertimeController } from './field-overtime.controller'

@Module({
  imports: [PrismaModule],
  controllers: [PlanAssignmentsController, FieldOvertimeController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
