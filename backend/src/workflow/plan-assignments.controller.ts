import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { WorkflowService } from './workflow.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('Workflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflow/plans')
export class PlanAssignmentsController {
  constructor(private readonly workflow: WorkflowService) {}

  @ApiOperation({ summary: 'Distribute plan assignments' })
  @Roles(UserRole.ADMIN, UserRole.Department_Head, UserRole.Commissioner)
  @Post('distribute')
  distribute(@Body() body: { planId: string; toUsers: string[]; by: string; dueDate?: string; notes?: string }) {
    return this.workflow.distributePlanAssignments(body)
  }
}
