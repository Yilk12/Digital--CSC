import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ScorecardsService } from './scorecards.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/bcas/scorecards')
export class ScorecardsController {
  constructor(private readonly service: ScorecardsService) {}

  @Get()
  @Roles('ADMIN' as any, 'GENERAL_DIRECTOR' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  list(
    @Query('scope') scope?: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL',
    @Query('status') status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
    @Query('year') year?: string,
    @Query('quarter') quarter?: string,
  ) {
    return this.service.list({
      scope,
      status,
      year: year ? Number(year) : undefined,
      quarter: quarter ? Number(quarter) : undefined,
    })
  }

  @Get(':id')
  @Roles('ADMIN' as any, 'GENERAL_DIRECTOR' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  get(@Param('id') id: string) {
    return this.service.get(id)
  }

  @Post()
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  create(
    @Body()
    body: {
      name: string
      description?: string
      scope: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
      ownerId?: string | null
      year?: number | null
      quarter?: number | null
      status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
    },
  ) {
    return this.service.create(body)
  }

  @Patch(':id')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  update(@Param('id') id: string, @Body() body: Partial<Parameters<ScorecardsService['create']>[0]>) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @Roles('ADMIN' as any)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
