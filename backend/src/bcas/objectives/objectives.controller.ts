import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ObjectivesService } from './objectives.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/bcas/objectives')
export class ObjectivesController {
  constructor(private readonly service: ObjectivesService) {}

  @Get()
  @Roles('ADMIN' as any, 'GENERAL_DIRECTOR' as any, 'STAFF_MANAGER' as any, 'SUPPORT_AGENT' as any)
  list(@Query('scorecardId') scorecardId?: string) {
    return this.service.list(scorecardId)
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
      scorecardId: string
      title: string
      description?: string
      perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL' | 'LEARNING_GROWTH'
      parentObjectiveId?: string | null
      weight?: number | null
      ownerId?: string | null
    },
  ) {
    return this.service.create(body)
  }

  @Patch(':id')
  @Roles('ADMIN' as any, 'STAFF_MANAGER' as any)
  update(@Param('id') id: string, @Body() body: Partial<Parameters<ObjectivesService['create']>[0]>) {
    return this.service.update(id, body)
  }

  @Delete(':id')
  @Roles('ADMIN' as any)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
