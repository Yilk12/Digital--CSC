import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { KpisService } from './kpis.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/bcas/kpis')
export class KpisController {
  constructor(private readonly service: KpisService) {}

  @Get()
  @Roles('ADMIN' as any, 'GENERAL_DIRECTOR' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  list(@Query('objectiveId') objectiveId?: string) {
    return this.service.list(objectiveId)
  }

  @Get(':id')
  @Roles('ADMIN' as any, 'GENERAL_DIRECTOR' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  get(@Param('id') id: string) { return this.service.get(id) }

  @Post()
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  create(
    @Body() body: {
      objectiveId: string
      name: string
      unit: string
      direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET'
      calculationNotes?: string | null
      ownerId?: string | null
    },
  ) {
    return this.service.create(body)
  }

  @Patch(':id')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  update(@Param('id') id: string, @Body() body: Partial<Parameters<KpisService['create']>[0]>) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @Roles('ADMIN' as any)
  remove(@Param('id') id: string) { return this.service.remove(id) }

  // Targets
  @Get(':id/targets')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  listTargets(@Param('id') id: string) { return this.service.listTargets(id) }
  @Post(':id/targets')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  createTarget(
    @Param('id') kpiId: string,
    @Body() body: { periodStart: string; periodEnd: string; targetValue: number; thresholdGreen?: number | null; thresholdYellow?: number | null; deadline?: string | null },
  ) {
    return this.service.createTarget(
      kpiId,
      {
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        targetValue: body.targetValue,
        thresholdGreen: body.thresholdGreen ?? null,
        thresholdYellow: body.thresholdYellow ?? null,
        deadline: body.deadline ? new Date(body.deadline) : null,
      },
    )
  }
  @Delete('targets/:targetId')
  @Roles('ADMIN' as any)
  removeTarget(@Param('targetId') targetId: string) { return this.service.removeTarget(targetId) }

  // Data points
  @Get(':id/datapoints')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any, 'GENERAL_DIRECTOR' as any)
  listDataPoints(@Param('id') id: string) { return this.service.listDataPoints(id) }
  @Post(':id/datapoints')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  createDataPoint(
    @Param('id') kpiId: string,
    @Body() body: { periodDate: string; actualValue: number; source?: 'MANUAL' | 'IMPORT' | 'API'; submittedById?: string | null },
  ) { return this.service.createDataPoint(kpiId, { ...body, periodDate: new Date(body.periodDate) }) }
  @Patch('datapoints/:dataPointId/approve')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  approve(@Param('dataPointId') dataPointId: string, @Body() body: { approverId: string }) { return this.service.approveDataPoint(dataPointId, body.approverId) }
  @Delete('datapoints/:dataPointId')
  @Roles('ADMIN' as any)
  removeDataPoint(@Param('dataPointId') dataPointId: string) { return this.service.removeDataPoint(dataPointId) }

  // Bulk datapoints upload
  @Post('datapoints/bulk')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  bulkCreate(
    @Body()
    body: { items: Array<{ kpiId: string; periodDate: string; actualValue: number; source?: 'MANUAL' | 'IMPORT' | 'API'; submittedById?: string | null }> },
  ) {
    const items = (body?.items || []).map((i) => ({ ...i, periodDate: new Date(i.periodDate) }))
    return this.service.bulkCreateDataPoints(items as any)
  }
}
