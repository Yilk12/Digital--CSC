import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FleetService } from './fleet.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '@prisma/client'

@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleet: FleetService) {}

  // Vehicles
  @ApiOperation({ summary: 'List vehicles' })
  @Get('vehicles')
  listVehicles(@Query('q') q?: string) {
    return this.fleet.listVehicles(q)
  }

  @ApiOperation({ summary: 'Create vehicle' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Post('vehicles')
  createVehicle(@Body() body: { plate: string; make?: string; model?: string; year?: number; departmentId?: string }) {
    return this.fleet.createVehicle(body)
  }

  @ApiOperation({ summary: 'Update vehicle' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Put('vehicles/:id')
  updateVehicle(@Param('id') id: string, @Body() body: any) {
    return this.fleet.updateVehicle(id, body)
  }

  @ApiOperation({ summary: 'Delete vehicle' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Delete('vehicles/:id')
  deleteVehicle(@Param('id') id: string) {
    return this.fleet.deleteVehicle(id)
  }

  // Requests
  @ApiOperation({ summary: 'List fleet requests' })
  @Get('requests')
  listRequests(@Query('status') status?: string) {
    return this.fleet.listRequests(status)
  }

  @ApiOperation({ summary: 'Create fleet request' })
  @Post('requests')
  createRequest(@Body() body: { requestorId: string; purpose: string; tripType?: string; destination?: string; date: string }) {
    return this.fleet.createRequest(body)
  }

  @ApiOperation({ summary: 'Approve request' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Put('requests/:id/approve')
  approveRequest(@Param('id') id: string) {
    return this.fleet.setRequestStatus(Number(id), 'APPROVED')
  }

  @ApiOperation({ summary: 'Reject request' })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Put('requests/:id/reject')
  rejectRequest(@Param('id') id: string) {
    return this.fleet.setRequestStatus(Number(id), 'REJECTED')
  }

  // Trips
  @ApiOperation({ summary: 'List trips' })
  @Get('trips')
  listTrips(@Query('vehicleId') vehicleId?: string) {
    return this.fleet.listTrips(vehicleId)
  }

  @ApiOperation({ summary: 'Create trip' })
  @Post('trips')
  createTrip(@Body() body: { vehicleId: string; driverId: string; startAt: string; origin?: string; destination?: string; distanceKm?: number }) {
    return this.fleet.createTrip(body)
  }
}
