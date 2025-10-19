import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { DashboardsService } from './dashboards.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/bcas/dashboards')
export class DashboardsController {
  constructor(private readonly service: DashboardsService) {}

  @Get('executive')
  @Roles('ADMIN' as any, 'GENERAL_DIRECTOR' as any)
  executive(
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
  ) {
    return this.service.executive({ year: year ? Number(year) : undefined, quarter: quarter ? Number(quarter) : undefined })
  }

  @Get('manager')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  manager(@Query('departmentId') departmentId?: string) {
    return this.service.manager({ departmentId })
  }

  @Get('employee')
  @Roles('ADMIN' as any, 'END_USER' as any)
  employee(@Query('userId') userId: string) {
    return this.service.employee({ userId })
  }
}
