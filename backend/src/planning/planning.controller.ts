import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PlanningService } from './planning.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('Planning')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planning')
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @ApiOperation({ summary: 'List plans with filters/sort/pagination' })
  @Get()
  list(
    @Query('owner') owner?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir: 'asc' | 'desc' = 'asc',
    @Query('sort') sortMulti?: string,
  ) {
    return this.planning.list({ owner, status, q, page: Number(page), pageSize: Number(pageSize), sortBy, sortDir, sortMulti })
  }

  @ApiOperation({ summary: 'Create plan' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER, UserRole.GENERAL_DIRECTOR)
  @Post()
  create(@Body() body: { title: string; description?: string; ownerId: string }) {
    return this.planning.create(body)
  }

  @ApiOperation({ summary: 'Update plan' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() body: { title?: string; description?: string; status?: string }) {
    return this.planning.update(id, body)
  }

  @ApiOperation({ summary: 'Delete plan' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planning.remove(id)
  }
}
