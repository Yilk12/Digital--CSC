import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { FleetService } from './fleet.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole, MaintenanceStatus, RequestDecisionStatus, FuelStatus  } from '@prisma/client'
import { CreateFieldRequestDto } from './dto/create-field-request.dto'
import { CreateFleetRequestDto } from './dto/create-fleet-request.dto'
import { CreateFuelRequestDto } from './dto/create-fuel-request.dto'
import { CreateVehicleDto } from './dto/CreateVehicleDto'
import { get } from 'http'
import { UpdateTripMetricsDto, UpdateVehicleDto } from './dto/UpdateVehicleDto'
import { CreateVehicleReturnDto } from './dto/create-vehicle-return.dto'
import { CreateFleetCostDto } from './dto/create-fleet-cost.dto'
import { CreateServiceRegistrationDto } from './dto/create-service-registration.dto'

@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleet: FleetService) {}

  // Vehicles
  @ApiOperation({ summary: 'List vehicles (optionally filter by type NEW or USED)' })
  @Get('vehicles')
  listVehicles(@Query('q') q?: string, @Query('type') type?: 'NEW' | 'USED') {
    const normType = type === 'NEW' || type === 'USED' ? type : undefined
    return this.fleet.listVehicles(q, normType)
  }

  @ApiOperation({ summary: 'Get a single vehicle by id' })
  @UseGuards(JwtAuthGuard)
  @Get('vehicles/:id')
  getVehicle(@Param('id') id: string) {
    return this.fleet.getVehicle(id)
  }

  @ApiOperation({ summary: 'List all vehicles (no filters)' })
  @Get('vehicles/all')
  listAllVehicles() {
    return this.fleet.listVehicles()
  }

  @ApiOperation({ summary: 'Get my assigned vehicle (by JWT user id)' })
  @UseGuards(JwtAuthGuard)
  @Get('my-vehicle')
  async getMyVehicle(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.sub || req?.user?.userId || req?.user?.user_id;
    if (!userId) {
      throw new Error('User not authenticated or missing user id in token');
    }
    return this.fleet.getMyVehicle(userId);
  }

  @ApiOperation({ summary: 'List NEW vehicles' })
  @Get('vehicles/new')
  listNewVehicles(@Query('q') q?: string) {
    return this.fleet.listVehicles(q, 'NEW')
  }

  @ApiOperation({ summary: 'List USED vehicles' })
  @Get('vehicles/used')
  listUsedVehicles(@Query('q') q?: string) {
    return this.fleet.listVehicles(q, 'USED')
  }

  @ApiOperation({ summary: 'Create vehicle and optionally assign driver/request' })
  @Roles(UserRole.ADMIN, UserRole.Fleet_Manager)
  @Post('vehicles')
  createVehicle(@Body() body: CreateVehicleDto) {
    return this.fleet.createVehicle(body);
  }
  

  @ApiOperation({ summary: 'Update vehicle' })
  @Roles(UserRole.ADMIN, UserRole.Department_Head, UserRole.Fleet_Manager)
  @Put('vehicles/:id')
  updateVehicle(@Param('id') id: string, @Body() body: UpdateVehicleDto) {
    return this.fleet.updateVehicle(id, body)
  }

  @ApiOperation({ summary: 'Delete vehicle' })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Delete('vehicles/:id')
  deleteVehicle(@Param('id') id: string) {
    return this.fleet.deleteVehicle(id)
  }

  

  
  @UseGuards(JwtAuthGuard)
  @Get('requests')
  async listRequests(@Req() req, @Query('status') status?: string) {
    if (!req.user) throw new Error('User not authenticated'); // optional safety
    console.log("this is the user that try to access",req.user)
  
    const currentUser = {
      id: req.user.userId,          // make sure JWT guard attaches this
      role: req.user.role,
      departmentId: req.user.departmentId, // optional
    };
  
    console.log('Current user:', currentUser);
  
    return this.fleet.listRequests(currentUser, status);
  }

  @ApiOperation({ summary: 'List requests created by the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get('requests/my')
  async listMyRequests(@Req() req) {
    if (!req.user?.userId) {
      throw new Error('User not authenticated');
    }
    return this.fleet.listRequestsByRequestor(req.user.userId);
  }
  
  

  @ApiOperation({ summary: 'Create fleet request' })
  @Post('fleet-requests')
  createFleetRequest(@Body() body: CreateFleetRequestDto) {
    return this.fleet.createFleetRequest(body);
  }

  @ApiOperation({ summary: 'List fleet requests for the authenticated user (matches frontend /fleet/fleet-requests)' })
  @UseGuards(JwtAuthGuard)
  @Get('fleet-requests')
  async listMyFleetRequestsForDashboard(@Req() req: any, @Query('status') status?: string) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.fleet.getMyFleetRequests(String(userId), status);
  }

  // =======================
  // Fuel Requests
  // =======================

  @ApiOperation({ summary: 'Create fuel request for authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Post('fuel-requests')
  async createFuelRequest(@Req() req: any, @Body() body: CreateFuelRequestDto) {
    console.log('fuel-requests user:', req.user)
    const userId = req?.user?.userId as string | undefined
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return this.fleet.createFuelRequest(userId, body)
  }

  @ApiOperation({ summary: 'List fuel requests (Fleet Manager/Admin)' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Driver)
  @Get('manager/fuel-requests')
  async listFuelRequestsForManager(
    @Query('vehicleId') vehicleId?: string,
    @Query('requestorId') requestorId?: string,
  ) {
    return this.fleet.listFuelRequestsForManager({ vehicleId, requestorId })
  }

  @ApiOperation({ summary: 'List fuel requests created by the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get('fuel-requests/my')
  async listMyFuelRequests(@Req() req: any) {
    const userId = req?.user?.userId as string | undefined
    if (!userId) {
      throw new Error('User not authenticated')
    }
    return this.fleet.listMyFuelRequests(userId)
  }

  @ApiOperation({ summary: 'Driver updates return odometer of their fuel request' })
  @Roles(UserRole.Driver)
  @UseGuards(JwtAuthGuard)
  @Patch('fuel-requests/:id/return-odometer')
  async updateFuelRequestReturnOdometer(
    @Param('id') id: string,
    @Req() req: any,
    @Body('returnOdometerKm') returnOdometerKm: number,
  ) {
    const userId = req?.user?.userId as string | undefined
    if (!userId) {
      throw new Error('User not authenticated')
    }
    const value = typeof returnOdometerKm === 'number' ? returnOdometerKm : Number(returnOdometerKm)
    if (!Number.isFinite(value) || value < 0) {
      throw new Error('Invalid returnOdometerKm')
    }
    return this.fleet.updateFuelRequestReturnOdometer(id, userId, value)
  }
  
  @ApiOperation({ summary: 'Update status of a fuel request (FUELED / NOT_FUELED / HALF_FUELED)' })
  @UseGuards(JwtAuthGuard)
  @Patch('fuel-requests/:id/status')
  async updateFuelRequestStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body('status') status: FuelStatus,
  ) {
    const userId = req?.user?.userId as string | undefined
    if (!userId) {
      throw new Error('User not authenticated')
    }

    // Ensure status is a valid FuelStatus value
    const allowed = Object.values(FuelStatus) as string[]
    if (!status || !allowed.includes(status)) {
      throw new Error('Invalid fuel status')
    }

    return this.fleet.updateFuelRequestStatus(id, userId, status)
  }

  // fleet request updtae some value
  @ApiOperation({ summary: 'Update trip odometer and passenger metrics' })
  @UseGuards(JwtAuthGuard)
  @Put(':id/update-metrics')
  async updateTripMetrics(
    @Param('id') id: string,
    @Body() dto: UpdateTripMetricsDto,
  ) {
    return this.fleet.updateTripMetrics(id, dto);
  }

  // =======================
  // Field Requests
  // =======================

  @ApiOperation({ summary: 'Create field request' })
  @Post('field-requests')
  createFieldRequest(@Body() body: CreateFieldRequestDto) {
    return this.fleet.createFieldRequest(body)
  }

  @ApiOperation({ summary: 'List field requests' })
  @Get('field-requests')
  listFieldRequests(
    @Query('departmentId') departmentId?: string,
    @Query('reqId') reqId?: string,
    @Query('status') status?: string,
  ) {
    return this.fleet.listFieldRequests({ departmentId, reqId, status })
  }

  @ApiOperation({ summary: 'List my field requests (current user)' })
  @UseGuards(JwtAuthGuard)
  @Get('field-requests/my')
  async listMyFieldRequests(@Req() req, @Query('status') status?: string) {
    const userId = req?.user?.userId as string | undefined;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.fleet.listFieldRequests({ reqId: userId, status });
  }


@ApiOperation({ summary: 'Get my fleet requests' })
@UseGuards(JwtAuthGuard)
@Get('requests/my-requests')
async getMyFleetRequests(@Req() req: any) { // Remove the 'id' parameter
  console.log('Request user:', req.user); // Debug log to see what's in req.user
  
  // Try different possible properties for user ID
  const userId = req.user?.id || req.user?.sub || req.user?.userId;
  return this.fleet.getMyFleetRequests(userId);
}

  @ApiOperation({ summary: 'List field requests for current user\'s department' })
  @Roles(UserRole.Department_Head)
  @UseGuards(JwtAuthGuard)
  @Get('field-requests/department')
  async listDepartmentFieldRequests(@Req() req, @Query('status') status?: string) {
    const departmentId = req?.user?.departmentId as string | undefined;
    if (!departmentId) {
      throw new Error('Current user has no department assigned');
    }
    return this.fleet.listDepartmentFieldRequests(departmentId, status);
  }

  @ApiOperation({ summary: 'Approve field request' })
  @Roles(UserRole.Department_Head)
  @UseGuards(JwtAuthGuard)
  @Put('field-requests/:id/approve')
  async approveFieldRequest(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.userId as string | undefined
    return this.fleet.setFieldRequestStatus(id, RequestDecisionStatus.APPROVED, userId)
  }

  @ApiOperation({ summary: 'Reject field request' })
  @Roles(UserRole.Department_Head)
  @UseGuards(JwtAuthGuard)
  @Put('field-requests/:id/reject')
  async rejectFieldRequest(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?.userId as string | undefined
    return this.fleet.setFieldRequestStatus(id, RequestDecisionStatus.REJECTED, userId)
  }

  //fleet -departmetn 
@ApiOperation({ summary: 'Get department fleet requests with team member info' })
@UseGuards(JwtAuthGuard)
@Get('requests/department-requests')
async getDepartmentFleetRequests(@Req() req: any, @Query('status') status?: string) {
  console.log('🔍 Request user object:', req.user);
  console.log('🔍 Request user keys:', req.user ? Object.keys(req.user) : 'No user object');
  console.log('🔍 Full request object keys:', Object.keys(req));
  
  // Try different possible user ID properties
  const departmentHeadId = req.user?.id || req.user?.sub || req.user?.userId || req.user?.user_id;
  
  console.log('🔍 Extracted departmentHeadId:', departmentHeadId);
  
  if (!departmentHeadId) {
    console.error('❌ No department head ID found in request.user:', req.user);
    throw new Error('Department Head ID not found in authentication token');
  }

  return this.fleet.getDepartmentFleetRequests(departmentHeadId, status);
}

  @ApiOperation({ summary: 'List fleet requests for the current user\'s department (no role filtering)' })
  @UseGuards(JwtAuthGuard)
  @Get('department/requests')
  async listRequestsByDepartment(@Req() req, @Query('status') status?: string) {
    const departmentId = req?.user?.departmentId as string | undefined;
    if (!departmentId) {
      throw new Error('Current user has no department assigned');
    }
    return this.fleet.listRequestsByDepartment(departmentId, status);
  }

  @ApiOperation({ summary: 'Get assignment history for the current user\'s department' })
  @UseGuards(JwtAuthGuard)
  @Get('department/assignment-history')
  async getDepartmentAssignmentHistory(@Req() req: any) {
    const departmentId = req?.user?.departmentId as string | undefined;
    if (!departmentId) {
      throw new Error('Current user has no department assigned');
    }
    return this.fleet.getDepartmentAssignmentHistory(departmentId);
  }

  @ApiOperation({ summary: 'Get pending fleet request count for current user\'s department' })
  @UseGuards(JwtAuthGuard)
  @Get('department/pending-request-count')
  async getPendingRequestCount(@Req() req: any) {
    const departmentId = req?.user?.departmentId as string | undefined;
    if (!departmentId) {
      throw new Error('Current user has no department assigned');
    }

    // Use existing listRequestsByDepartment with PENDING status
    const res = await this.fleet.listRequestsByDepartment(
      departmentId,
      RequestDecisionStatus.PENDING,
    );

    return {
      departmentId,
      status: RequestDecisionStatus.PENDING,
      count: Array.isArray(res?.data) ? res.data.length : 0,
    };
  }

@ApiOperation({ summary: 'Approve request' })
@Roles(UserRole.ADMIN, UserRole.Department_Head)
@Put('/fleet-requests/:id/approve')
approveRequest(@Param('id') id: string) {
  return this.fleet.setRequestStatus(id, 'APPROVED');
}

@ApiOperation({ summary: 'Reject request' })
@Roles(UserRole.ADMIN, UserRole.Department_Head)
@Put('fleet-requests/:id/reject')
rejectRequest(@Param('id') id: string) {
  return this.fleet.setRequestStatus(id, 'REJECTED');
}


//fleet for driver 
@ApiOperation({ summary: 'Get field management information for drivers' })
@UseGuards(JwtAuthGuard)
@Get('field-management')
async getFieldManagementInfo(@Req() req: any) {
  // Try different possible user ID properties
  const driverId = req.user?.id || req.user?.sub || req.user?.userId || req.user?.user_id;
  
  if (!driverId) {
    console.error('❌ No driver ID found in request.user:', req.user);
    throw new Error('Driver ID not found in authentication token');
  }

  return this.fleet.getFieldManagementInfo(driverId);
}

//fleet driver update 
@ApiOperation({ summary: 'Mark vehicle assignment as completed' })
  @UseGuards(JwtAuthGuard)
  @Put('vehicles/:id/complete')
  async completeVehicleAssignment(@Param('id') id: string) {
    return this.fleet.completeVehicleAssignment(id);
  }

  @ApiOperation({ summary: 'Mark vehicle assignment as completed with custom time' })
  @UseGuards(JwtAuthGuard)
  @Put('vehicles/:id/complete-with-time')
  async completeVehicleAssignmentWithTime(
    @Param('id') id: string,
    @Body() body: { endTime: string }
  ) {
    return this.fleet.completeVehicleAssignment(id, body.endTime);
  }


  // Trips
  @ApiOperation({ summary: 'List trips' })
  @Get('trips')
  listTrips(@Query('vehicleId') vehicleId?: string) {
    return this.fleet.listTrips(vehicleId)
  }

  // Trip History
  @ApiOperation({ summary: 'Create trip history entry for a fleet request' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN)
  @Post('trip-history/:requestId')
  async createTripHistoryForRequest(@Param('requestId') requestId: string) {
    const numericId = Number(requestId);
    if (Number.isNaN(numericId)) {
      throw new Error('Invalid requestId; must be a number');
    }
    return this.fleet.createTripHistoryForRequest(numericId);
  }

  @ApiOperation({ summary: 'List trip history for the authenticated driver' })
  @UseGuards(JwtAuthGuard)
  @Get('trip-history/driver/me')
  async listMyTripHistoryAsDriver(@Req() req: any) {
    const driverId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    if (!driverId) {
      throw new Error('User not authenticated');
    }
    return this.fleet.listTripHistoryForDriver(driverId);
  }

  @ApiOperation({ summary: 'List all trip history records for fleet managers' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN)
  @UseGuards(JwtAuthGuard)
  @Get('trip-history/manager/all')
  async listAllTripHistoryForManager() {
    return this.fleet.listAllTripHistoryForManager();
  }

  @ApiOperation({ summary: 'List trip history for the authenticated requestor' })
  @UseGuards(JwtAuthGuard)
  @Get('trip-history/requestor/me')
  async listMyTripHistoryAsRequestor(@Req() req: any) {
    const requestorId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    if (!requestorId) {
      throw new Error('User not authenticated');
    }
    return this.fleet.listTripHistoryForRequestor(requestorId);
  }

  // =======================
  // Vehicle Returns
  // =======================

  @Post('returns')
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN)
  async createVehicleReturn(@Req() req: any, @Body() body: CreateVehicleReturnDto) {
    const userId =
      req?.user?.id ||
      req?.user?.sub ||
      req?.user?.userId;

    return this.fleet.createVehicleReturn(body, userId);
  }

  @ApiOperation({ summary: 'List all vehicle return records' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Department_Head)
  @Get('returns')
  async listVehicleReturns() {
    return this.fleet.listVehicles();
  }


  // =======================
  // Fleet Cost Registration
  // =======================

  @ApiOperation({ summary: 'Create fleet cost registration record' })
  @Roles(UserRole.Finance_Department, UserRole.Fleet_Manager, UserRole.ADMIN,UserRole.Department_Head,UserRole.END_USER)
  @Post('costs')
  async createFleetCost(@Body() body: CreateFleetCostDto) {
    console.log('Incoming body:', body);
    return this.fleet.createFleetCostRegistration(body);
  }

  // =======================
  // Service Registrations (5,000 KM etc.)
  // =======================

  @ApiOperation({ summary: 'Create a service registration record' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN)
  @Post('service-registrations')
  async createServiceRegistration(@Body() body: CreateServiceRegistrationDto) {
    return this.fleet.createServiceRegistration(body);
  }

  @ApiOperation({ summary: 'List service registrations (optionally filter by vehicleId)' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN)
  @Get('service-registrations')
  async listServiceRegistrations(@Query('vehicleId') vehicleId?: string) {
    return this.fleet.listServiceRegistrations(vehicleId);
  }

  @ApiOperation({ summary: 'List all fleet cost registrations' })
  @Roles(UserRole.Finance_Department, UserRole.Fleet_Manager, UserRole.ADMIN,UserRole.Department_Head,UserRole.Commissioner)
  @Get('costs')
  async listFleetCosts() {
    return this.fleet.listFleetCosts();
  }

  @ApiOperation({ summary: 'Create trip' })
  @Post('trips')
  createTrip(@Body() body: { vehicleId: string; driverId: string; startAt: string; origin?: string; destination?: string; distanceKm?: number }) {
    return this.fleet.createTrip(body)
  }

  // =======================
  // DriverDetaile Endpoints
  // =======================

  @ApiOperation({ summary: 'Create or update driver details (by user and empId)' })
  @Post('driver-details/:userId')
  upsertDriverDetail(
    @Param('userId') userId: string,
    @Body()
    body: {
      empId: string;
      dateOfBirth: string | Date;
      address?: string | null;
      licenceNumber: string;
      licenceClass: string;
      licenceExpiredDate: string | Date;
      issuedBy: string;
      vehicleId?: string | null;
      emergencyContactName: string;
      emergencyContactPhone: string;
      additionalInformation?: string | null;
      licenceCertificate?: string | null;
      image?: string | null;

    },
  ) {
    return this.fleet.upsertDriverDetail(userId, body);
  }

  @ApiOperation({ summary: 'List driver details (filter by empId/userId/vehicleId)' })
  @Get('driver-details')
  listDriverDetails(
    @Query('empId') empId?: string,
    @Query('userId') userId?: string,
    @Query('vehicleId') vehicleId?: string,
  ) {
    return this.fleet.listDriverDetails({ empId, userId, vehicleId });
  }

  @ApiOperation({ summary: 'Get driver details by user' })
  @Get('driver-details/user/:userId')
  getDriverDetailByUser(@Param('userId') userId: string) {
    return this.fleet.getDriverDetailByUser(userId);
  }

  // =======================
  // Maintenance Schedule
  // =======================
  @ApiOperation({ summary: 'Create a maintenance schedule for the authenticated user\'s assigned vehicle' })
  @UseGuards(JwtAuthGuard)
  @Post('maintenance/schedules')
  async createMaintenanceSchedule(
    @Req() req: any,
    @Body()
    body: {
      incidentDate: string | Date;
      location?: string;
      description?: string;
      actionTakeByuser?:string;
      status?: MaintenanceStatus;
    },
  ) {
    const userId = req?.user?.userId as string;
    if (!userId) throw new Error('Missing authenticated user');
    return this.fleet.createMaintenanceSchedule(userId, body);
  }

  // Fetch maintenance schedules for the authenticated user
  @ApiOperation({ summary: 'Get maintenance schedules for the authenticated user' })
  @UseGuards(JwtAuthGuard)
  @Get('maintenance/schedules')
  async getMyMaintenanceSchedules(
    @Req() req: any,
    @Query('status') status?: MaintenanceStatus,
  ) {
    const userId = req?.user?.userId as string;
    if (!userId) throw new Error('Missing authenticated user');
    return this.fleet.getMaintenanceSchedulesByUser(userId, { status });
  }

  // List all maintenance schedules (Fleet Manager/Admin)
  @ApiOperation({ summary: 'List all maintenance schedules (Fleet Manager/Admin)' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Maintenace_Team)
  @Get('manager/maintenance/schedules')
  async listAllMaintenanceSchedules(
    @Query('status') status?: MaintenanceStatus,
  ) {
    return this.fleet.listAllMaintenanceSchedules({ status });
  }

  @ApiOperation({ summary: 'Assign maintenance day to multiple schedules' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Maintenace_Team)
  @Post('manager/maintenance/schedules/assign-day')
  async assignMaintenanceDay(
    @Body() body: { ids: string[]; day: string },
  ) {
    const { ids, day } = body || ({} as any)
    return this.fleet.assignMaintenanceDay(ids, day)
  }

  @ApiOperation({ summary: 'Assign maintenance day to a single schedule' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Maintenace_Team)
  @Patch('manager/maintenance/schedules/:id/assign-day')
  async assignMaintenanceDaySingle(
    @Param('id') id: string,
    @Body() body: { day: string },
  ) {
    return this.fleet.assignMaintenanceDay([id], body?.day)
  }

  @ApiOperation({ summary: 'Update maintenance schedule status' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Maintenace_Team)
  @Patch('manager/maintenance/schedules/:id/status')
  async updateMaintenanceStatus(
    @Param('id') id: string,
    @Body() body: { status: MaintenanceStatus; actionByUserId?: string },
  ) {
    return this.fleet.updateMaintenanceStatus(id, body?.status, body?.actionByUserId)
  }

  @ApiOperation({ summary: 'List vehicles with MAINTAINED maintenance schedules (distinct vehicles)' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Maintenace_Team)
  @Get('manager/maintenance/maintained-vehicles')
  async listMaintainedVehiclesFromSchedules() {
    return this.fleet.getMaintainedVehiclesFromSchedules()
  }

  @ApiOperation({ summary: 'Create maintained vehicle history record' })
  @Roles(UserRole.Fleet_Manager, UserRole.ADMIN, UserRole.Maintenace_Team)
  @Post('manager/maintenance/maintained-vehicles')
  async createMaintainedVehicle(
    @Body()
    body: {
      vehicleId: string;
      completedDate: string | Date;
      description?: string | null;
      cost?: number | string | null;
      imageUrl?: string | null;
      status: 'ACCEPTED' | 'REJECTED';
    },
  ) {
    return this.fleet.createMaintainedVehicle(body)
  }

  // // =======================
  // // Department Head Endpoints
  // // =======================
  // @ApiOperation({ summary: 'List all maintained vehicle records (Department Head)' })
  // @Roles(UserRole.Department_Head)
  // @Get('department-head/maintained-vehicles')
  // async listMaintainedVehiclesForDepartmentHead() {
  //   return this.fleet.listMaintainedVehicles()
  // }

  @ApiOperation({ summary: 'Update maintained vehicle status (Department Head)' })
  @Roles(UserRole.Department_Head)
  @Patch('department-head/maintained-vehicles/:id/status')
  async updateMaintainedVehicleStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACCEPTED' | 'REJECTED',
    @Body('imageUrl') imageUrl?: string,
  ) {
    return this.fleet.updateMaintainedVehicleStatus(id, status, imageUrl)
  }

  @ApiOperation({ summary: 'Delete driver detail by composite key (userId, empId)' })
  @Delete('driver-details/:userId/:empId')
  deleteDriverDetail(@Param('userId') userId: string, @Param('empId') empId: string) {
    return this.fleet.deleteDriverDetail(userId, empId);
  }

  // =======================
// Fleet Manager Endpoints
// =======================

@ApiOperation({ summary: 'Get all approved requests (Fleet Manager)' })
@Roles(UserRole.Fleet_Manager)
@Get('manager/requests/approved')
async getApprovedRequests() {
  return this.fleet.getApprovedRequests();
}

@ApiOperation({ summary: 'Assign driver to an approved request' })
@Roles(UserRole.Fleet_Manager)
@Put('manager/requests/:id/assign-driver')
async assignDriver(
  @Param('id') id: string,
  @Body('driverId') driverId: string,
  @Body('vehicleId') vehicleId: string,
) {
  return this.fleet.assignDriver(Number(id), driverId, vehicleId);
}


  // Vehicles
@ApiOperation({ summary: 'List drivers' })
@Get('driver')
listDriver(@Query('q') q?: string) {
  return this.fleet.listDriver(q);
}



// Assign Driver 

@ApiOperation({ summary: 'Assign driver to a vehicle' })
@Post('vehicles/:vehicleId/assign-driver')
async assignDriverToVehicle(
  @Param('vehicleId') vehicleId: string,
  @Body('userId') userId: string,
) {
  return this.fleet.assignDrivertoviechle(vehicleId, userId);
}



@ApiOperation({ summary: 'Get all drivers that have vehicles' })
@Get('vehicle-driver')
async getDriversWithVehicles() {
  return this.fleet.getDriversWithVehicles();
}

// assign driver and vehicle to the request
// fleet.controller.ts
@ApiOperation({ summary: 'Assign a request to a vehicle' })
@Patch('vehicles/:vehicleId/assign-request')
async assignRequestToVehicle(
  @Param('vehicleId') vehicleId: string,
  @Body('requestId') requestId: string,
) {
  return this.fleet.assignRequestToVehicle(vehicleId, requestId);
}


@ApiOperation({ summary: 'Assign multiple requests to a vehicle (multi-assign)' })
@Post('vehicles/:vehicleId/assign-requests')
async assignRequestsToVehicle(
  @Param('vehicleId') vehicleId: string,
  @Body('requestIds') requestIds: (string | number)[],
) {
  return this.fleet.assignRequestsToVehicle(vehicleId, requestIds);
}


// =======================
// Vehicle Notification Endpoints
// =======================

@ApiOperation({ summary: 'Get vehicle notifications for a user' })
@UseGuards(JwtAuthGuard)
@Get('vehicle-notifications/user/:userId')
async getVehicleNotifications(@Param('userId') userId: string) {
  return this.fleet.getVehicleNotificationsByUser(userId);
}

// @ApiOperation({ summary: 'Get fleet requests assigned to the authenticated driver' })
// @Roles(UserRole.Driver)
// @UseGuards(JwtAuthGuard)
// @Get('driver/assigned-requests')
// async getDriverAssignedRequests(@Req() req: any) {
//   const driverId = req?.user?.userId as string | undefined;
//   if (!driverId) throw new Error('Missing authenticated user');
//   return this.fleet.getDriverAssignedRequests(driverId);
// }

// mark as rread 
@ApiOperation({ summary: 'Mark a notification as read' })
@Patch('vehicle-notifications/:id/read')
async markNotificationAsRead(@Param('id') id: string) {
  return this.fleet.markNotificationAsRead(id);
}

//==================Report===========================
 @ApiOperation({ summary: "Get combined fleet overview" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("overview")
  getFleetOverview() {
    return this.fleet.getFleetOverview();
  }

  @ApiOperation({ summary: "Get vehicle statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("vehicle-stats")
  getVehicleStats() {
    return this.fleet.getVehicleStats();
  }

  @ApiOperation({ summary: "Get maintenance statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("maintenance-stats")
  getMaintenanceStats() {
    return this.fleet.getMaintenanceStats();
  }

  @ApiOperation({ summary: "Get incident statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("incident-stats")
  getIncidentStats() {
    return this.fleet.getIncidentStats();
  }

  @ApiOperation({ summary: "Get utilization statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("utilization-stats")
  getUtilizationStats() {
    return this.fleet.getUtilizationStats();
  }

  @ApiOperation({ summary: "Get maintenance schedule analytics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("maintenance-analytics")
  getMaintenanceScheduleAnalytics() {
    return this.fleet.getMaintenanceScheduleAnalytics();
  }

  @ApiOperation({ summary: "Get cost analysis" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("cost-analysis")
  getCostAnalysis() {
    return this.fleet.getCostAnalysis();
  }

  @ApiOperation({ summary: "Get fleet health score" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("health-score")
  getFleetHealthScore() {
    return this.fleet.getFleetHealthScore();
  }

  // In fleet.controller.ts
@ApiOperation({ summary: 'Get all fleet requests with details' })
@Get('requests/details')
async getFleetRequestsWithDetails() {
  return this.fleet.getFleetRequestsWithDetails();
}

@ApiOperation({ summary: 'Get flattened fleet request summary with requestor, vehicle and driver' })
@Get('requests/summary')
async listFleetRequestsSummary() {
  return this.fleet.listFleetRequestsSummary();
}
}
