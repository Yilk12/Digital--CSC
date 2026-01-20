import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateFleetRequestDto } from './dto/create-fleet-request.dto';
import { CreateVehicleDto } from './dto/CreateVehicleDto'
import { CreateServiceRegistrationDto } from './dto/create-service-registration.dto'
;
import { $Enums, MaintenanceStatus, RequestDecisionStatus, FuelStatus } from '@prisma/client'
import { CreateVehicleReturnDto } from './dto/create-vehicle-return.dto';
import { CreateFieldRequestDto } from './dto/create-field-request.dto';
import { UpdateTripMetricsDto } from './dto/UpdateVehicleDto';



@Injectable()
export class FleetService {
  async getMaintenanceSchedulesByUser(
    userId: string,
    options: { status?: $Enums.MaintenanceStatus } = {},
  ) {
    if (!userId) {
      throw new Error('Missing userId for maintenance schedules');
    }

    const where: any = { userId };
    if (options.status) {
      where.status = options.status;
    }

    return (this.prisma as any).maintenanceSchedule.findMany({
      where,
      orderBy: { incidentDate: 'desc' },
      include: {
        vehicle: true,
      },
    });
  }

  markNotificationAsRead(id: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  // Vehicles
  async listVehicles(q?: string, type?: 'NEW' | 'USED') {
    const where: any = {};
    if (q) {
      where.OR = [
        { plate: { contains: q, mode: 'insensitive' } },
        { make: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (type) {
      where.type = type as any;
    }
    return this.prisma.vehicle.findMany({
      where,
      include: {
        user: true,      // Include driver info
        request: true,   // Include associated fleet request info
        trips: true,     // Include trips if any
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getVehicle(id: string) {
    if (!id) {
      throw new Error('Vehicle id is required');
    }

    return this.prisma.vehicle.findUnique({
      where: { id },
    });
  }

  // Get the vehicle assigned to a specific driver (by userId)
  async getMyVehicle(userId: string) {
    if (!userId) {
      throw new Error('User ID is required to get driver vehicle');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!vehicle) {
      return {
        success: true,
        message: 'No vehicle assigned to this driver',
        data: null,
      };
    }

    return {
      success: true,
      data: vehicle,
    };
  }

  // Fleet cost registration
  async createFleetCostRegistration(body: {
    date: string | Date;
    vehicleId: string;
    category?: string | null;
    amount: number | string;
    currency?: string;
    reference?: string | null;
    description?: string | null;
  }) {
    const date = body.date instanceof Date ? body.date : new Date(body.date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date for fleet cost');
    }

    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
    if (!Number.isFinite(amount)) {
      throw new Error('Invalid amount for fleet cost');
    }

    return (this.prisma as any).fleetCostRegistration.create({
      data: {
        date,
        vehicleId: body.vehicleId,
        category: body.category ?? null,
        amount,
        currency: body.currency || 'ETB',
        reference: body.reference ?? null,
        description: body.description ?? null,
      },
      include: {
        vehicle: true,
      },
    });
  }

  // List all fleet cost registrations
  async listFleetCosts() {
    return (this.prisma as any).fleetCostRegistration.findMany({
      include: {
        vehicle: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

// fleet.service.ts
async createVehicleReturn(
  body: CreateVehicleReturnDto,
  submittedByUserId: string
) {
  console.log("🚗 Incoming Vehicle Return:", body);

  const { 
    driverId,
    vehicleId,
    plateNumber,
    returnedAt,
    finalOdometerKm,
    fuelLevel,
    warningLightsOn,
    vehicleInspection,
    description,
    fileUrl,
    fileName,
    fileType
  } = body;

  try {
    // Validate driver exists
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      select: { id: true }
    });

    if (!driver) throw new Error("Driver not found");

    // Create the return record
    const record = await this.prisma.vehicleReturn.create({
      data: {
        driverId,
        vehicleId,
        plateNumber,
        returnedAt: new Date(returnedAt),
        finalOdometerKm,
        fuelLevel,
        warningLightsOn,
        vehicleInspection,
        description,
        fileUrl,
        fileName,
        fileType,
        // Save who submitted this return
        // submittedByUserId
      }
    });

    return {
      success: true,
      message: "Vehicle return recorded successfully",
      data: record
    };

  } catch (e) {
    console.error("❌ Prisma Create Error:", e);
    throw e;
  }
}


  

  async createVehicle(body: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        plate: body.plate,
        make: body.make,
        model: body.model,
        year: body.year,
        type: body.type,
        countryOfOrigin: body.countryOfOrigin,
        seatingCapacity: body.seatingCapacity,
        kmPerLiter: body.kmPerLiter,
        vehicleTypeName: body.vehicleTypeName,
        chassisNumber: body.chassisNumber,
        engineNumber: body.engineNumber,
        fuelType: body.fuelType,
        cylinderCount: body.cylinderCount,
        userId: body.userId,
        reqId: body.reqId,
      },
    });
  }
  // update some value
  async updateTripMetrics(id: string, dto: UpdateTripMetricsDto) {
    const numericId = Number(id);

    const existing = await this.prisma.fleetRequest.findUnique({
      where: { id: numericId },
      include: {
        vehicles: true,
      },
    });

    if (!existing) {
      throw new Error(`FleetRequest with ID ${id} not found`);
    }

    const updated = await this.prisma.fleetRequest.update({
      where: { id: numericId },
      data: {
        startOdometerKm: dto.startOdometerKm,
        odometerKmDiff: dto.odometerKmDiff,
        returnOdometerKm: dto.returnOdometerKm,
        returnTime: dto.returnTime,
        passengerCount: dto.passengerCount,
      },
    });

    // Also mark any assigned vehicles for this request as completed so
    // manager assignment tables immediately reflect the new status.
    if (Array.isArray((existing as any).vehicles)) {
      for (const v of (existing as any).vehicles) {
        if (!v || !v.id) continue;
        try {
          await this.completeVehicleAssignment(v.id);
        } catch (e) {
          console.error('Failed to complete vehicle assignment from trip metrics update', {
            fleetRequestId: numericId,
            vehicleId: v.id,
            error: e,
          });
        }
      }
    }

    // Also persist a new trip history snapshot for this request so we never override
    // previous history entries. This creates an additional TripHistory row each time
    // metrics are updated/completed from the driver side.
    try {
      await this.createTripHistoryForRequest(numericId);
    } catch (e) {
      // Do not block the main update if history creation fails; just log.
      console.error('Failed to create trip history from updateTripMetrics', {
        fleetRequestId: numericId,
        error: e,
      });
    }

    return {
      message: 'Trip metrics updated successfully',
      data: updated,
    };
  }

  // =======================
  // Trip History
  // =======================

  // Create a TripHistory row based on a FleetRequest and its related entities
  async createTripHistoryForRequest(requestId: number) {
    const request = await this.prisma.fleetRequest.findUnique({
      where: { id: requestId },
      include: {
        requestor: true,
        department: true,
        vehicles: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error(`FleetRequest with ID ${requestId} not found`);
    }

    const firstVehicle = request.vehicles[0] as any | undefined;
    const vehicleId = firstVehicle?.id as string | undefined;
    const driverUser = (firstVehicle?.user as any) || null;

    if (!vehicleId) {
      throw new Error('No vehicle is assigned to this request; cannot create trip history');
    }

    if (!driverUser) {
      throw new Error('No driver is assigned to the vehicle; cannot create trip history');
    }

    const requester = request.requestor as any;

    const history = await (this.prisma as any).tripHistory.create({
      data: {
        fleetRequestId: request.id,
        vehicleId,
        driverId: driverUser.id,
        requestorId: request.requestorId,
        departmentId: request.departmentId ?? null,

        requesterName: requester
          ? `${requester.firstName || ''} ${requester.lastName || ''}`.trim() || null
          : null,
        requesterPhone: requester?.phone ?? null,
        purpose: request.purpose ?? null,
        destination: request.destination ?? null,
        date: request.fromDate ?? request.date ?? null,
        startTime: request.startTime ?? null,
        endTime: request.endTime ?? null,

        startOdometerKm: (request as any).startOdometerKm ?? null,
        returnOdometerKm: (request as any).returnOdometerKm ?? null,
        odometerKmDiff: (request as any).odometerKmDiff ?? null,
        passengerCount: (request as any).passengerCount ?? null,
        returnTime: (request as any).returnTime ?? null,
        status: request.status ?? null,

        vehiclePlate: firstVehicle?.plate ?? null,
        vehicleMakeModel:
          firstVehicle
            ? `${firstVehicle.make || ''} ${firstVehicle.model || ''}`.trim() || null
            : null,
        kmPerLiter: (firstVehicle as any)?.kmPerLiter ?? null,
      },
      include: {
        fleetRequest: true,
        vehicle: true,
        driver: true,
        requestor: true,
        department: true,
      },
    });

    return {
      message: 'Trip history created successfully',
      data: history,
    };
  }

  // List trip history records where the user is the driver
  async listTripHistoryForDriver(driverId: string) {
    if (!driverId) {
      throw new Error('Driver ID is required to list trip history');
    }

    const items = await (this.prisma as any).tripHistory.findMany({
      where: { driverId },
      orderBy: { date: 'desc' },
      // Limit to the most recent 10,000 records per driver to keep the
      // የመስክ ታሪክ (Completed Trips) table manageable on the driver reports page
      take: 10000,
      include: {
        fleetRequest: true,
        vehicle: true,
        requestor: true,
        department: true,
      },
    });

    return { data: items, count: items.length };
  }

  // List trip history records for fleet managers (all vehicles/drivers)
  // This is used by the fleet manager reports page to compute per-vehicle
  // aggregates (e.g. monthly total kilometers) based on the same
  // TripHistory source that powers the driver "የመስክ ታሪክ (Completed Trips)"
  // table.
  async listAllTripHistoryForManager() {
    const items = await (this.prisma as any).tripHistory.findMany({
      orderBy: { date: 'desc' },
      // Keep an upper bound so the manager reports page remains responsive
      // even if there is a large amount of history.
      take: 20000,
      include: {
        vehicle: true,
        driver: true,
        requestor: true,
        department: true,
      },
    });

    return { data: items, count: items.length };
  }

  // List trip history records where the user is the original requestor
  async listTripHistoryForRequestor(requestorId: string) {
    if (!requestorId) {
      throw new Error('Requestor ID is required to list trip history');
    }

    const items = await (this.prisma as any).tripHistory.findMany({
      where: { requestorId },
      orderBy: { date: 'desc' },
      include: {
        fleetRequest: true,
        vehicle: true,
        driver: true,
        department: true,
      },
    });

    return { data: items, count: items.length };
  }
  async updateVehicle(id: string, body: any) {
    return this.prisma.vehicle.update({ where: { id }, data: body })
  }

  // =======================
  // Service Registrations (5,000 KM etc.)
  // =======================

  async createServiceRegistration(body: CreateServiceRegistrationDto) {
    // Basic validation
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: body.vehicleId },
      select: { id: true, plate: true, make: true, model: true },
    });
    if (!vehicle) {
      throw new Error('Vehicle not found for provided vehicleId');
    }

    const record = await (this.prisma as any).serviceRegistration.create({
      data: {
        vehicleId: vehicle.id,
        plateNumber: body.plateNumber || vehicle.plate,
        vehicleModel: body.vehicleModel ?? vehicle.model ?? null,
        odometerKm: body.odometerKm,
        reachedDate5000: body.reachedDate5000 ? new Date(body.reachedDate5000) : null,
        driverId: body.driverId ?? null,
        driverName: body.driverName ?? null,
        garageName: body.garageName ?? null,
        serviceCenter: body.serviceCenter ?? null,
        serviceStart: body.serviceStart ? new Date(body.serviceStart) : null,
        serviceEnd: body.serviceEnd ? new Date(body.serviceEnd) : null,
      },
      include: {
        vehicle: true,
        driver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return record;
  }

  async listServiceRegistrations(vehicleId?: string) {
    return (this.prisma as any).serviceRegistration.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        driver: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  // =======================
  // Fuel Requests
  // =======================

 async createFuelRequest(
  requestorId: string,
  body: {
    vehicleId: string
    date: string | Date
    odometer: number
    amount: number
    amountType: 'LITER' | 'COUPON' | 'CASH'
    notes?: string
    // maps to remainingFuelRequest column
    remainingFuelRequest?: number
  },
) {
  if (!requestorId) throw new Error('Missing requestorId for FuelRequest')

  const date = body.date instanceof Date ? body.date : new Date(body.date)
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date for FuelRequest')
  }

  try {
    return await (this.prisma as any).fuelRequest.create({
      data: {
        requestorId,
        vehicleId: body.vehicleId,
        date,
        odometer: body.odometer,
        amount: body.amount,
        // Use provided remainingFuelRequest if present, otherwise default to 0
        remainingFuelRequest: body.remainingFuelRequest ?? 0,
        amountType: body.amountType,
        notes: body.notes ?? null,
      },
      include: {
        vehicle: true,
        user: true,
      },
    })
  } catch (e) {
    console.error('createFuelRequest Prisma error:', e)
    throw e   // let Nest turn it into 400/500, but now you see the real cause
  }
}

  async listFuelRequestsForManager(filters?: { vehicleId?: string; requestorId?: string }) {
    return (this.prisma as any).fuelRequest.findMany({
      where: {
        ...(filters?.vehicleId ? { vehicleId: filters.vehicleId } : {}),
        ...(filters?.requestorId ? { requestorId: filters.requestorId } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
        user: true,
      },
    })
  }

  async listMyFuelRequests(requestorId: string) {
    if (!requestorId) {
      throw new Error('requestorId is required to list fuel requests')
    }

    return (this.prisma as any).fuelRequest.findMany({
      where: { requestorId },
      orderBy: { date: 'desc' },
      include: {
        vehicle: true,
        user: true,
      },
    })
  }

  async updateFuelRequestReturnOdometer(
    id: string,
    userId: string,
    returnOdometerKm: number | null,
  ) {
    if (!userId) {
      throw new Error('Missing userId');
    }

    return (this.prisma as any).fuelRequest.update({
      where: { id },
      data: { returnOdometerKm: returnOdometerKm ?? null },
    });
  }

  
  
  async deleteVehicle(id: string) {
    return this.prisma.vehicle.delete({ where: { id } })
  }

  // =======================
  // Field Requests
  // =======================

  async createFieldRequest(body: CreateFieldRequestDto) {
    const fromDate = new Date(body.fromDate)
    const toDate = new Date(body.toDate)

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new Error('Invalid fromDate or toDate for FieldRequest')
    }

    let departmentId: string | null = body.departmentId ?? null

    if (!departmentId) {
      const user = await this.prisma.user.findUnique({
        where: { id: body.requestorId }, // Use reqId from DTO
        include: { department: true },
      })

      if (!user) {
        throw new Error('User not found for FieldRequest.reqId')
      }

      if (user.department) {
        departmentId = user.department.id
      } else if (user.departmentId) {
        const existingDept = await this.prisma.department.findUnique({
          where: { id: user.departmentId },
        })
        if (existingDept) {
          departmentId = existingDept.id
        }
      }

      if (!departmentId) {
        const newDepartment = await this.prisma.department.create({
          data: {
            name: `Dept_of_${user.firstName || ''}_${user.lastName || ''}`.trim() || 'Unknown_Department',
          },
        })
        departmentId = newDepartment.id

        await this.prisma.user.update({
          where: { id: user.id },
          data: { departmentId },
        })
      }
    }

    const startTime = body.startTime ? new Date(body.startTime) : null
    const endTime = body.endTime ? new Date(body.endTime) : null

    return this.prisma.fieldRequest.create({
      data: {
        reqId: body.requestorId, // Use reqId instead of requestorId
        departmentId,
        fieldType: body.fieldType,
        description: body.description ?? null,
        location: body.location ?? null,
        fromDate,
        toDate,
        durationType: body.durationType ?? null,
      },
    })
  }

  async listFieldRequests(params?: {
    departmentId?: string
    reqId?: string
    status?: RequestDecisionStatus | string
  }) {
    const where: any = {}
    if (params?.departmentId) where.departmentId = params.departmentId
    if (params?.reqId) where.reqId = params.reqId
    if (params?.status) where.status = params.status as any

    return this.prisma.fieldRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: true,
      },
    })
  }

  async updateFuelRequestStatus(
  id: string,
  userId: string,
  status: FuelStatus,
) {
  if (!userId) {
    throw new Error('Missing userId');
  }

  // 1) Load the fuel request
  const request = await (this.prisma as any).fuelRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new Error('FuelRequest not found');
  }

  // 2) Only the driver who created the request can change its status
  if (request.requestorId !== userId) {
    throw new Error('Not allowed to update this fuel request');
  }

  // 3) Update status
  return (this.prisma as any).fuelRequest.update({
    where: { id },
    data: { status },
  });
}

  async listDepartmentFieldRequests(departmentId: string, status?: RequestDecisionStatus | string) {
    return this.listFieldRequests({ departmentId, status })
  }

  async setFieldRequestStatus(
    id: string,
    status: RequestDecisionStatus,
    actionByUserId?: string,
  ) {
    if (!id) throw new Error('id is required')
    if (!status) throw new Error('status is required')

    const allowed = Object.values(RequestDecisionStatus)
    if (!allowed.includes(status)) {
      throw new Error('Invalid field request status')
    }

    return this.prisma.fieldRequest.update({
      where: { id },
      data: {
        status,
        // Stamp "end" time when status changes (approved/rejected/etc.)
        endTime: new Date(),
        // actionByUserId can be wired later if you add such a column
      } as any,
    })
  }

  // Requests// fleet.service.ts
async listRequests(
  currentUser: { id: string; role: string; departmentId?: string },
  status?: string
) {
  if (!currentUser?.id) throw new Error('Current user ID is required to list requests');
  if (!currentUser.departmentId) throw new Error('Current user has no department assigned.');

  const where: any = {
    departmentId: currentUser.departmentId, // only requests for this department
  };

  if (status) where.status = status; // optional status filter

  // If the viewer is a Department Head, do not show *their own* requests in the department queue
  // (but still show all teammate requests in the same department)
  if (currentUser.role === 'Department_Head') {
    where.requestorId = { not: currentUser.id } as any;
  }

  const requests = await this.prisma.fleetRequest.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      requestor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      department: {
        select: { id: true, name: true },
      },
    },
  });

  return { data: requests };
}

// Request history for a specific requester (used for Vehicle Assignment Request history)
async listRequestsByRequestor(requestorId: string) {
  if (!requestorId) throw new Error('requestorId is required');

  const items = await this.prisma.fleetRequest.findMany({
    where: { requestorId },
    orderBy: { date: 'desc' },
    include: {
      requestor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { data: items };
}


async createFleetRequest(body: CreateFleetRequestDto) {
  const fromDate = body.fromDate ? new Date(body.fromDate) : null;
  const toDate = body.toDate ? new Date(body.toDate) : null;

  if ((fromDate && isNaN(fromDate.getTime())) || (toDate && isNaN(toDate.getTime()))) {
    throw new Error("Invalid fromDate or toDate for FleetRequest");
  }

  let departmentId: string | null = body.departmentId ?? null;

  if (!departmentId) {
    const user = await this.prisma.user.findUnique({
      where: { id: body.requestorId },
      include: { department: true },
    });

    if (!user) throw new Error("User not found for FleetRequest.requestorId");

    departmentId = user.department?.id ?? user.departmentId ?? null;

    if (!departmentId) {
      const newDepartment = await this.prisma.department.create({
        data: { name: `Dept_of_${(user.firstName || "").trim()}_${(user.lastName || "").trim()}`.trim() || "Unknown_Department" },
      });
      departmentId = newDepartment.id;

      await this.prisma.user.update({
        where: { id: user.id },
        data: { departmentId },
      });
    }
  }

  return this.prisma.fleetRequest.create({
    data: {
      requestorId: body.requestorId,
      departmentId,
      purpose: body.purpose ?? null,
      tripType: body.tripType ?? null,
      destination: body.destination ?? null,
      durationType: body.durationType ?? null,
      date: new Date(),
      fromDate,
      toDate,
      startTime: body.startTime ?? null,
      endTime: body.endTime ?? null,
    },
  });
}


  // List fleet requests by department only (no role-based filtering)
  async listRequestsByDepartment(departmentId: string, status?: string) {
    if (!departmentId) throw new Error('departmentId is required');

    const where: any = { departmentId };
    if (status) where.status = status;

    const requests = await this.prisma.fleetRequest.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    return { data: requests };
  }

  //fleet 

  // In your fleet.service.ts
async getMyFleetRequests(id: string, status?: string) {
  if (!id) {
    throw new Error('User ID is required');
  }

  const where: any = {
    requestorId: id, // Only get requests for this user
  };

  // Optional status filter
  if (status) {
    where.status = status;
  }

  try {
    const requests = await this.prisma.fleetRequest.findMany({
      where,
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        // Include vehicles if they are assigned
        vehicles: {
          select: {
            id: true,
            plate: true,
            make: true,
            model: true,
            year: true,
            user: { // Include driver info if vehicle is assigned
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest first
      },
    });

    return {
      success: true,
      data: requests,
      count: requests.length,
    };
  } catch (error) {
    console.error('Error fetching user fleet requests:', error);
    throw new Error('Failed to fetch fleet requests');
  }
}

// In your fleet.service.ts
async getTeamFleetRequests(departmentHeadId: string, status?: string) {
  if (!departmentHeadId) {
    throw new Error('Department Head ID is required');
  }

  try {
    // First, get the department head's department
    const departmentHead = await this.prisma.user.findUnique({
      where: { id: departmentHeadId },
      include: { department: true }
    });

    if (!departmentHead) {
      throw new Error('Department Head not found');
    }

    if (!departmentHead.department) {
      throw new Error('Department Head does not have a department assigned');
    }

    const departmentId = departmentHead.department.id;

    // Get all fleet requests from users in the same department
    // EXCLUDE the department head's own requests
    const where: any = {
      departmentId: departmentId,
      requestorId: { not: departmentHeadId } // Exclude department head's own requests
    };

    // Optional status filter
    if (status) {
      where.status = status;
    }

    const teamRequests = await this.prisma.fleetRequest.findMany({
      where,
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicles: {
          select: {
            id: true,
            plate: true,
            make: true,
            model: true,
            year: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: teamRequests,
      count: teamRequests.length,
      department: departmentHead.department.name,
      departmentHead: `${departmentHead.firstName} ${departmentHead.lastName}`
    };
  } catch (error) {
    console.error('Error fetching team fleet requests:', error);
    throw new Error('Failed to fetch team fleet requests');
  }
}


async getDepartmentFleetRequests(departmentHeadId: string, status?: string) {
  if (!departmentHeadId) {
    throw new Error('Department Head ID is required');
  }

  try {
    // Get the department head's department
    const departmentHead = await this.prisma.user.findUnique({
      where: { id: departmentHeadId },
      include: { 
        department: {
          include: {
            users: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
              }
            }
          }
        } 
      }
    });

    if (!departmentHead?.department) {
      throw new Error('Department Head or department not found');
    }

    const departmentId = departmentHead.department.id;

    // Build where clause with optional status filter
    const where: any = {
      departmentId: departmentId,
    };

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    // Get ALL fleet requests from the department (including department head's requests)
    const departmentRequests = await this.prisma.fleetRequest.findMany({
      where,
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicles: {
          select: {
            id: true,
            plate: true,
            make: true,
            model: true,
            year: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by status for summary
    const statusSummary = {
      PENDING: departmentRequests.filter(req => req.status === 'PENDING').length,
      APPROVED: departmentRequests.filter(req => req.status === 'APPROVED').length,
      REJECTED: departmentRequests.filter(req => req.status === 'REJECTED').length,
      ASSIGNED: departmentRequests.filter(req => req.status === 'ASSIGNED').length,
    };

    return {
      success: true,
      data: departmentRequests,
      summary: {
        total: departmentRequests.length,
        ...statusSummary
      },
      department: {
        id: departmentHead.department.id,
        name: departmentHead.department.name,
        totalMembers: departmentHead.department.users.length
      },
      departmentHead: {
        id: departmentHead.id,
        name: `${departmentHead.firstName} ${departmentHead.lastName}`
      }
    };
  } catch (error) {
    console.error('Error fetching department fleet requests:', error);
    throw new Error('Failed to fetch department fleet requests');
  }
}

// Optional: Get team members in the department
async getDepartmentTeamMembers(departmentHeadId: string) {
  if (!departmentHeadId) {
    throw new Error('Department Head ID is required');
  }

  try {
    const departmentHead = await this.prisma.user.findUnique({
      where: { id: departmentHeadId },
      include: { 
        department: {
          include: {
            users: {
              where: {
                id: { not: departmentHeadId } // Exclude department head
              },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
               
                isActive: true,
              },
              orderBy: {
                firstName: 'asc',
              },
            },
          },
        },
      },
    });

    if (!departmentHead?.department) {
      throw new Error('Department Head or department not found');
    }

    return {
      success: true,
      data: departmentHead.department.users,
      count: departmentHead.department.users.length,
      department: departmentHead.department.name
    };
  } catch (error) {
    console.error('Error fetching department team members:', error);
    throw new Error('Failed to fetch department team members');
  }
}


// In your fleet.service.ts
async getFieldManagementInfo(driverId: string) {
  if (!driverId) {
    throw new Error('Driver ID is required');
  }

  try {
    // Get the vehicle assigned to this driver
    const driverVehicle = await this.prisma.vehicle.findFirst({
      where: { userId: driverId },
      select: { id: true, plate: true, make: true, model: true, kmPerLiter: true }
    });

    if (!driverVehicle) {
      return {
        success: true,
        message: 'No vehicle assigned to driver',
        data: []
      };
    }

    // Get fleet requests assigned to this driver's vehicle
    const fieldTrips = await this.prisma.fleetRequest.findMany({
      where: {
        vehicles: {
          some: {
            userId: driverId
          }
        }
      },
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        vehicles: {
          where: { userId: driverId },
          select: {
            plate: true,
            make: true,
            model: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        fromDate: 'asc',
      },
    });

  
    // Also expose trip metrics so the driver UI can display them
    const formattedData = fieldTrips.map((trip, index) => ({
      id: trip.id, // Include the FleetRequest ID
      number: index + 1,
      requesterName: `${trip.requestor?.firstName || ''} ${trip.requestor?.lastName || ''}`.trim(),
      locationDestination: trip.destination || 'N/A',
      fieldPurpose: trip.purpose,
      fieldDate: trip.fromDate ? new Date(trip.fromDate).toLocaleDateString('en-GB') : 'N/A',
      startTime: trip.startTime || 'N/A',
      endTime: trip.endTime || 'N/A',
      status: trip.status,
      action: trip.status === 'ASSIGNED' ? 'Pending' : trip.status,
      requesterPhone: trip.requestor?.phone || 'N/A',
      vehicle: trip.vehicles[0] ? `${trip.vehicles[0].make} ${trip.vehicles[0].model} (${trip.vehicles[0].plate})` : 'N/A',
      department: trip.department?.name || 'N/A',
      vehicleId: driverVehicle.id,
      actualEndTime: trip.vehicles[0]?.endTime || null,

      // Trip metrics stored on FleetRequest (used in driver table)
      startKm: (trip as any).startOdometerKm ?? null,
      kmDifference: (trip as any).odometerKmDiff ?? null,
      returnKm: (trip as any).returnOdometerKm ?? null,
      returnTime: (trip as any).returnTime ?? null,
      passengerCount: (trip as any).passengerCount ?? null,

      // Vehicle efficiency in km per liter for this driver
      kmPerLiter: (driverVehicle as any)?.kmPerLiter ?? null,
    }));

    return {
      success: true,
      data: formattedData,
      count: formattedData.length,
      driverVehicle: driverVehicle
    };
  } catch (error) {
    console.error('Error fetching field management info:', error);
    throw new Error('Failed to fetch field management information');
  }
}

// Alternative: Get all assigned trips for the driver
async getDriverFieldTrips(driverId: string) {
  if (!driverId) {
    throw new Error('Driver ID is required');
  }

  try {
    const assignedTrips = await this.prisma.fleetRequest.findMany({
      where: {
        vehicles: {
          some: {
            userId: driverId
          }
        },
        status: {
          in: ['ASSIGNED', 'APPROVED'] // Only show assigned or approved trips
        }
      },
      include: {
        requestor: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        vehicles: {
          where: { userId: driverId },
          select: {
            plate: true,
            make: true,
            model: true,
            year: true,
          },
        },
      },
      orderBy: {
        fromDate: 'asc',
      },
    });

    // Format for Amharic table columns
    const tableData = assignedTrips.map((trip, index) => ({
      '№': index + 1,
      'የጠየቀው ስም': `${trip.requestor?.firstName || ''} ${trip.requestor?.lastName || ''}`.trim(),
      'መነሻ ቦታ - መድረሻ': trip.destination || 'N/A',
      'የመስኩ አላማ': trip.purpose,
      'የመስክ ቀን': trip.fromDate ? new Date(trip.fromDate).toLocaleDateString('en-GB') : 'N/A',
      'የመጀመሪያ ሰዓት': trip.startTime || 'N/A',
      'የመጨረሻ ሰዓት': trip.endTime || 'N/A',
      'ሁኔታ': trip.status,
      'ተግባር': 'መንቀሳቀስ', // Default action
      'ስልክ': trip.requestor?.phone || 'N/A',
      'መኪና': trip.vehicles[0] ? `${trip.vehicles[0].make} ${trip.vehicles[0].model}` : 'N/A',
      'መንጃ ሰሌዳ': trip.vehicles[0]?.plate || 'N/A'
    }));

    return {
      success: true,
      data: tableData,
      count: tableData.length,
      summary: {
        totalTrips: assignedTrips.length,
        assignedTrips: assignedTrips.filter(t => t.status === 'ASSIGNED').length,
        approvedTrips: assignedTrips.filter(t => t.status === 'APPROVED').length
      }
    };
  } catch (error) {
    console.error('Error fetching driver field trips:', error);
    throw new Error('Failed to fetch driver field trips');
  }
}


// In your fleet.service.ts
async completeVehicleAssignment(vehicleId: string, customEndTime?: string) {
  if (!vehicleId) {
    throw new Error('Vehicle ID is required');
  }

  try {
    // First, verify the vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        user: true,
        request: true
      }
    });

    if (!vehicle) {
      throw new Error(`Vehicle with ID ${vehicleId} not found`);
    }

    // Determine the end time - use custom time if provided, otherwise current time
    const endTime = customEndTime ? new Date(customEndTime) : new Date();

    if (isNaN(endTime.getTime())) {
      throw new Error('Invalid end time provided');
    }

    // Update the vehicle
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { 
        isCompleted: true,
        endTime: endTime
      },
      include: {
        user: true,
        request: {
          include: {
            requestor: true
          }
        }
      }
    });

    // Create completion notification for the driver
    if (updatedVehicle.userId) {
      await this.prisma.vehicleNotification.create({
        data: {
          userId: updatedVehicle.userId,
          title: 'Vehicle Assignment Completed',
          message: `Your vehicle assignment for ${updatedVehicle.plate} has been completed.`,
          type: 'COMPLETED',
          vehicleId: vehicleId,
        },
      });
    }

    // Create completion notification for all fleet managers
    try {
      const fleetManagers = await this.prisma.user.findMany({
        where: { role: 'Fleet_Manager' },
        select: { id: true },
      });

      const driverName = updatedVehicle.user
        ? `${updatedVehicle.user.firstName || ''} ${updatedVehicle.user.lastName || ''}`.trim() || 'the driver'
        : 'the driver';

      if (fleetManagers.length > 0) {
        await this.prisma.vehicleNotification.createMany({
          data: fleetManagers.map((manager) => ({
            userId: manager.id,
            vehicleId: vehicleId,
            title: 'Vehicle Assignment Completed',
            message: `Driver ${driverName} assignment has been completed.`,
            type: 'COMPLETED_MANAGER',
          })),
        });
      }
    } catch (notifyError) {
      console.error('Error notifying fleet managers about completion:', notifyError);
    }

    // If there's an associated request, you might want to update its status too
    if (updatedVehicle.reqId) {
      await this.prisma.fleetRequest.update({
        where: { id: updatedVehicle.reqId },
        data: { 
          status: 'COMPLETED',
          // Do not overwrite the original planned endTime from the request form
        } as any,
      });

      // Notify the requester that their request is completed
      if (updatedVehicle.request?.requestorId) {
        await this.prisma.vehicleNotification.create({
          data: {
            userId: updatedVehicle.request.requestorId,
            title: 'Field Trip Completed',
            message: `Your field trip with vehicle ${updatedVehicle.plate} has been completed by the driver.`,
            type: 'COMPLETED',
            vehicleId: vehicleId,
          },
        });
      }
    }

    // Log the completion for audit purposes
    console.log(`Vehicle ${vehicleId} marked as completed at ${endTime}`);

    return {
      success: true,
      message: 'Vehicle assignment successfully completed',
      data: {
        vehicle: {
          id: updatedVehicle.id,
          plate: updatedVehicle.plate,
          isCompleted: updatedVehicle.isCompleted,
          endTime: updatedVehicle.endTime,
          completedAt: updatedVehicle.endTime?.toLocaleString()
        },
        driver: updatedVehicle.user ? {
          id: updatedVehicle.user.id,
          name: `${updatedVehicle.user.firstName} ${updatedVehicle.user.lastName}`
        } : null,
        request: updatedVehicle.request ? {
          id: updatedVehicle.request.id,
          purpose: updatedVehicle.request.purpose,
          status: 'COMPLETED'
        } : null
      }
    };

  } catch (error) {
    console.error('Error completing vehicle assignment:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to complete vehicle assignment: ${error.message}`);
    }
    
    throw new Error('Failed to complete vehicle assignment');
  }
}


async setRequestStatus(id: string, status: 'APPROVED' | 'REJECTED') {
  // Convert to number only if your FleetRequest model uses numeric IDs
  const numericId = Number(id);
  
  if (isNaN(numericId)) {
    throw new Error('Invalid request ID: must be a number');
  }

  // 1️⃣ Update the FLEET request
  const request = await this.prisma.fleetRequest.update({
    where: { id: numericId },
    data: { status },
    include: {
      requestor: true, 
    },
  });

  // 2️⃣ Create notification
  await this.prisma.vehicleNotification.create({
    data: {
      userId: request.requestorId,
      title: `Fleet Request ${status}`,
      message:
        status === 'APPROVED'
          ? 'የመኪና ጥያቄዎ ተቀባይነት  አግኚቷል'
          : `Your fleet request for "${request.purpose}" has been rejected.`,
      type: status,
      vehicleId: null,
    },
  });

  return request;
}
  

  // Trips
  async listTrips(vehicleId?: string) {
    return this.prisma.trip.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      orderBy: { startAt: 'desc' },
    })
  }

  // Return distinct vehicles that have maintenance schedules with status MAINTAINED
  async getMaintainedVehiclesFromSchedules() {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: { status: MaintenanceStatus.MAINTAINED },
      include: { vehicle: true },
      orderBy: { updatedAt: 'desc' },
    })

    // Deduplicate by vehicleId and return vehicles only
    const vehiclesById = new Map<string, any>()
    for (const s of schedules) {
      if (s.vehicleId && s.vehicle) {
        if (!vehiclesById.has(s.vehicleId)) vehiclesById.set(s.vehicleId, s.vehicle)
      }
    }
    return Array.from(vehiclesById.values())
  }

  async createTrip(body: { vehicleId: string; driverId: string; startAt: string; origin?: string; destination?: string; distanceKm?: number }) {
    return this.prisma.trip.create({ data: { ...body, startAt: new Date(body.startAt) } })
  }

  // DriverDetaile CRUD
  async upsertDriverDetail(userId: string, payload: {
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
  }) {
    const data = {
      userId,
      empId: payload.empId,
      dateOfBirth: payload.dateOfBirth instanceof Date ? payload.dateOfBirth : new Date(payload.dateOfBirth),
      address: payload.address ?? null,
      licenceNumber: payload.licenceNumber,
      licenceClass: payload.licenceClass,
      licenceExpiredDate: payload.licenceExpiredDate instanceof Date ? payload.licenceExpiredDate : new Date(payload.licenceExpiredDate),
      issuedBy: payload.issuedBy,
      vehicleId: payload.vehicleId ?? null,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactPhone: payload.emergencyContactPhone,
      additionalInformation: payload.additionalInformation ?? null,
      licenceCertificate: payload.licenceCertificate ?? null,
    };

    return this.prisma.driverDetaile.upsert({
      where: { userId_empId: { userId, empId: payload.empId } },
      create: data,
      update: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async getDriverDetailByUser(userId: string) {
    return this.prisma.driverDetaile.findMany({
      where: { userId },
      include: { user: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listDriverDetails(q?: { empId?: string; userId?: string; vehicleId?: string }) {
    return this.prisma.driverDetaile.findMany({
      where: {
        ...(q?.empId ? { empId: { contains: q.empId, mode: 'insensitive' } } : {}),
        ...(q?.userId ? { userId: q.userId } : {}),
        ...(q?.vehicleId ? { vehicleId: q.vehicleId } : {}),
      },
      include: { user: true, vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDriverDetail(userId: string, empId: string) {
    return this.prisma.driverDetaile.delete({ where: { userId_empId: { userId, empId } } });
  }


  async getDepartmentAssignmentHistory(departmentId: string) {
  if (!departmentId) throw new Error('departmentId is required');

  const requests = await this.prisma.fleetRequest.findMany({
    where: {
      departmentId,
      // Show all requests that have actually been assigned or completed
      status: { in: ['ASSIGNED', 'COMPLETED'] },
    },
    include: {
      requestor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      department: {
        select: { id: true, name: true },
      },
      vehicles: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  return {
    data: requests.map((r: any) => {
      const requestor = r.requestor || {};
      const firstVehicle = r.vehicles?.[0] || null;
      const driver = firstVehicle?.user || null;

      return {
        id: r.id,
        requestorName: `${requestor.firstName || ''} ${requestor.lastName || ''}`.trim(),
        purpose: r.purpose,
        tripType: r.tripType,
        date: r.date,
        phone: requestor.phone,
        durationType: r.durationType,
        status: r.status,
        driverName: driver
          ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
          : null,
        destination: r.destination,
        approvedAt: r.updatedAt,
      };
    }),
  };
}

  // 1️⃣ Get all approved requests
  async getApprovedRequests() {
    return this.prisma.fleetRequest.findMany({
      where: { status: 'APPROVED' },
      include: {
        requestor: true,
        department: {
          include: {
            users: true, // so frontend can resolve Department_Head user
        },
      },
    },
    orderBy: { date: 'asc' },
  });
}

// 2️⃣ Assign driver to a request
async assignDriver(id: number, driverId: string, vehicleId: string) {
  // validate request, driver, vehicle...

  const [updatedVehicle, updatedRequest] = await this.prisma.$transaction([
    this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        userId: driverId,       
        reqId: id as any,
      },
    }),
    this.prisma.fleetRequest.update({
      where: { id },
      data: {
        status: 'ASSIGNED',
        driverId,                 
      } as any,
    }),
  ]);

  return { message: 'Driver assigned successfully', request: updatedRequest, vehicle: updatedVehicle };
}

  //Get Driver 
  async listDriver(q?: string) {
    return this.prisma.user.findMany({
      where: {
        role: 'Driver',
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: 'insensitive' } },
                { lastName: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        userType: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  //Assign Driver 
  async assignDrivertoviechle(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new Error(`Vehicle with ID ${vehicleId} not found`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error(`User with ID ${userId} not found`);

    // Allow a driver to be assigned to multiple vehicles:
    // simply set userId on this vehicle without checking for other assignments.
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { userId },
      include: { user: true },
    });

    return updatedVehicle;
  }

  async getDriversWithVehicles() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        userId: { not: null }, // only vehicles that are assigned
      },
      include: {
        user: true, // include driver info
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return vehicles.map((v) => ({
      vehicleId: v.id,
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      driver: v.user
        ? {
            id: v.user.id,
            firstName: v.user.firstName,
            lastName: v.user.lastName,
            role: v.user.role,
          }
        : null,
    }));
  }

  // Assign Driver and Vehicle to a single request (used by single-assign and multi-assign flows)
  async assignRequestToVehicle(vehicleId: string, requestId: string | number) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new Error(`Vehicle with ID ${vehicleId} not found`);

    const numericRequestId = typeof requestId === 'number' ? requestId : Number(requestId);
    if (Number.isNaN(numericRequestId)) {
      throw new Error('Invalid requestId: must be a number');
    }

    const request = await this.prisma.fleetRequest.findUnique({
      where: { id: numericRequestId },
      include: {
        requestor: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });
    if (!request) throw new Error(`Request with ID ${requestId} not found`);

    // Link vehicle to request
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { reqId: numericRequestId },
    });

    // Mark request as ASSIGNED so it moves out of the approved queue and into history
    await this.prisma.fleetRequest.update({
      where: { id: numericRequestId },
      data: { status: 'ASSIGNED' } as any,
    });

    const requesterName = request.requestor
      ? `${request.requestor.firstName || ''} ${request.requestor.lastName || ''}`.trim() || 'N/A'
      : 'N/A';
    const requesterPhone = request.requestor?.phone || 'N/A';
    const destination = request.destination || 'N/A';
    const requesterStartTime = request.startTime || 'N/A';
    const requesterEndTime = request.endTime || 'N/A';

    // Notify requester that a vehicle has been assigned
    await this.prisma.vehicleNotification.create({
      data: {
        userId: request.requestorId,
        vehicleId,
        title: 'Vehicle Assigned',
        message:
          `መኪና የጠየቀዉ አካል: ${requesterName}\n` +
          `ስልክ: ${requesterPhone}\n` +
          `መድረሻ (Destination): ${destination}\n` +
          `መነሻ ሰዓት: ${requesterStartTime}\n` +
          `መመለሻ ሰዓት: ${requesterEndTime}`,
        type: 'ASSIGNED',
        isRead: false,
      },
    });

    // Notify driver (if the vehicle already has a driver assigned)
    if (vehicle.userId) {
      const startTime = request.startTime || 'N/A';
      const endTime = request.endTime || 'N/A';
      const driverMessage =
        `መኪና የጠየቀዉ አካል: ${requesterName}\n` +
        `ስልክ: ${requesterPhone}\n` +
        `መድረሻ (Destination): ${destination}\n` +
        `መነሻ ሰዓት: ${startTime}\n` +
        `መመለሻ ሰዓት: ${endTime}`;

      await this.prisma.vehicleNotification.create({
        data: {
          userId: vehicle.userId,
          vehicleId,
          title: 'New Field Trip Assigned',
          message: driverMessage,
          type: 'ASSIGNED_DRIVER',
          isRead: false,
        },
      });
    }

    return updatedVehicle;
  }

  // Assign a vehicle to multiple requests by reusing assignRequestToVehicle
  async assignRequestsToVehicle(
    vehicleId: string,
    requestIds: (string | number)[],
  ) {
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      throw new Error('requestIds must be a non-empty array');
    }

    const results = [] as any[];
    for (const requestId of requestIds) {
      const res = await this.assignRequestToVehicle(vehicleId, requestId);
      results.push(res);
    }

    return {
      success: true,
      count: results.length,
      data: results,
    };
  }

  // FleetService additions
  async getVehicleNotificationsByUser(userId: string) {
    return this.prisma.vehicleNotification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: {
          include: {
            user: true, // driver assigned to this vehicle, if any
          },
        },
      },
    });
  }

  async createMaintenanceSchedule(
    userId: string,
    body: {
      incidentDate: string | Date;
      location?: string;
      description?: string;
      actionTakeByuser?: string;
      status?: MaintenanceStatus;
    }
  ) {
    // Find the vehicle assigned to this user
    const vehicle = await this.prisma.vehicle.findFirst({ where: { userId } });
    if (!vehicle) throw new Error(`No vehicle assigned to user ${userId}`);

    const incidentDate =
      body.incidentDate instanceof Date
        ? body.incidentDate
        : new Date(body.incidentDate);

    // Validate optional actor id as a UUID; if invalid, treat as null
    const isUuid = (v?: string) =>
      !!v &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
        v,
      );
    const actionByUserId = isUuid(body.actionTakeByuser) ? body.actionTakeByuser! : null;

    return this.prisma.maintenanceSchedule.create({
      data: {
        vehicleId: vehicle.id,
        userId,
        incidentDate,
        location: body.location ?? null,
        status: body.status ?? MaintenanceStatus.PENDING,
        actionByUserId,
        description: body.description ?? null,
      },
    });
  }

  // Fetch all maintenance schedules (for Fleet Manager/Admin), optionally filter by status
  async listAllMaintenanceSchedules(options?: { status?: MaintenanceStatus }) {
    return this.prisma.maintenanceSchedule.findMany({
      where: {
        ...(options?.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        vehicle: true,
        user: true,
        actionBy: true,
      },
    });
  }

  // Bulk assign a maintenance date to multiple schedules
  async assignMaintenanceDay(ids: string[], day: string) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error('ids must be a non-empty array');
    }
    if (!day) {
      throw new Error('day is required');
    }
    const date = new Date(day)
    if (isNaN(date.getTime())) {
      throw new Error('day must be a valid date string');
    }

    // Ensure IDs are unique
    const uniqueIds = Array.from(new Set(ids))

    // Update all matching schedules (store in maintenanceScheduleTime)
    await this.prisma.maintenanceSchedule.updateMany({
      where: { id: { in: uniqueIds } },
      data: { maintenanceScheduleTime: date },
    })

    // Return updated rows for UI refresh
    const updated = await this.prisma.maintenanceSchedule.findMany({
      where: { id: { in: uniqueIds } },
      include: {
        vehicle: true,
        user: true,
        actionBy: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    return { ok: true, count: updated.length, items: updated }
  }

  // Update maintenance schedule status (and optionally who took the action)
  async updateMaintenanceStatus(
    id: string,
    status: MaintenanceStatus,
    actionByUserId?: string,
  ) {
    if (!id) throw new Error('id is required')
    if (!status) throw new Error('status is required')

    // Validate status against enum
    const allowed = Object.values(MaintenanceStatus)
    if (!allowed.includes(status)) {
      throw new Error('Invalid maintenance status')
    }

    return this.prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        status,
        ...(actionByUserId ? { actionByUserId } : {}),
      },
      include: {
        vehicle: true,
        user: true,
        actionBy: true,
      },
    })
  }

  // Create a maintained vehicle history record
  async createMaintainedVehicle(body: {
    vehicleId: string;
    completedDate: string | Date;
    description?: string | null;
    cost?: number | string | null;
    imageUrl?: string | null;
    status: 'ACCEPTED' | 'REJECTED';
  }) {
    if (!body?.vehicleId) throw new Error('vehicleId is required')
    if (!body?.completedDate) throw new Error('completedDate is required')
    if (!body?.status) throw new Error('status is required')
    const allowedStatus = ['ACCEPTED', 'REJECTED'] as const
    if (!allowedStatus.includes(body.status)) throw new Error('status must be ACCEPTED or REJECTED')

    // Ensure vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: body.vehicleId } })
    if (!vehicle) throw new Error(`Vehicle with id ${body.vehicleId} not found`)

    // Normalize date
    const completedDate = body.completedDate instanceof Date
      ? body.completedDate
      : new Date(body.completedDate)
    if (isNaN(completedDate.getTime())) throw new Error('completedDate must be a valid date')

    // Normalize cost (Prisma Decimal accepts string or number)
    const cost = body.cost == null ? undefined : (typeof body.cost === 'number' ? body.cost : String(body.cost))

    return (this.prisma as any).maintainedVehicle.create({
      data: {
        vehicleId: body.vehicleId,
        completedDate,
        description: body.description ?? null,
        cost,
        imageUrl: body.imageUrl ?? null,
        status: body.status as 'ACCEPTED' | 'REJECTED',
      },
      include: { vehicle: true },
    })
  }

  // Update maintained vehicle status
  async updateMaintainedVehicleStatus(id: string, status: 'ACCEPTED' | 'REJECTED', imageUrl?: string | null) {
    if (!id) throw new Error('id is required')
    const allowed = ['ACCEPTED', 'REJECTED'] as const
    if (!allowed.includes(status)) throw new Error('status must be ACCEPTED or REJECTED')

    const data: any = { status }
    if (typeof imageUrl === 'string') {
      data.imageUrl = imageUrl
    }

    return (this.prisma as any).maintainedVehicle.update({
      where: { id },
      data,
      include: { vehicle: true },
    })
  }

  //===============Report================================

   // --- Combined Fleet Overview ---
  async getFleetOverview() {
    const [
      vehicleStats,
      maintenanceStats,
      incidentStats,
      utilizationStats
    ] = await Promise.all([
      this.getVehicleStats(),
      this.getMaintenanceStats(),
      this.getIncidentStats(),
      this.getUtilizationStats()
    ]);

    return {
      totalVehicles: vehicleStats.totalVehicles,
      vehiclesWithDrivers: vehicleStats.vehiclesWithDrivers,
      vehiclesWithoutDrivers: vehicleStats.vehiclesWithoutDrivers,
      totalMaintained: maintenanceStats.totalMaintained,
      totalMaintenanceCost: maintenanceStats.totalMaintenanceCost,
      totalIncidents: incidentStats.totalIncidents,
      activeIncidents: incidentStats.activeIncidents,
      utilizationRate: utilizationStats.utilizationRate,
      averageTripsPerVehicle: utilizationStats.averageTripsPerVehicle
    };
  }

  // --- Vehicle Statistics ---
  async getVehicleStats() {
    const totalVehicles = await this.prisma.vehicle.count();
    
    // Vehicles with drivers (assuming DriverDetaile relation indicates assigned driver)
    const vehiclesWithDrivers = await this.prisma.vehicle.count({
      where: {
        DriverDetaile: {
          some: {} // At least one driver detail exists
        }
      }
    });

    const vehiclesWithoutDrivers = totalVehicles - vehiclesWithDrivers;

    // Vehicles by type
    const vehiclesByType = await this.prisma.vehicle.groupBy({
      by: ['type'],
      _count: { id: true }
    });

    // New vs Used vehicles
    const newVehicles = await this.prisma.vehicle.count({
      where: { type: 'NEW' }
    });
    const usedVehicles = await this.prisma.vehicle.count({
      where: { type: 'USED' }
    });

    return {
      totalVehicles,
      vehiclesWithDrivers,
      vehiclesWithoutDrivers,
      vehiclesByType,
      newVehicles,
      usedVehicles,
      driverAssignmentRate: totalVehicles > 0 ? 
        Math.round((vehiclesWithDrivers / totalVehicles) * 100) : 0
    };
  }

  // --- Maintenance Statistics ---
  async getMaintenanceStats() {
    const totalMaintained = await this.prisma.maintainedVehicle.count();
    
    // Total maintenance cost
    const maintenanceCosts = await this.prisma.maintainedVehicle.aggregate({
      _sum: {
        cost: true
      }
    });

    const totalMaintenanceCost = maintenanceCosts._sum.cost || 0;

    // Maintenance by status
    const maintenanceByStatus = await this.prisma.maintainedVehicle.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { cost: true }
    });

    // Average maintenance cost
    const avgMaintenanceCost = totalMaintained > 0 ? 
      Number(totalMaintenanceCost) / totalMaintained : 0;

    // Recent maintenance (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMaintenance = await this.prisma.maintainedVehicle.count({
      where: {
        completedDate: { gte: thirtyDaysAgo }
      }
    });

    return {
      totalMaintained,
      totalMaintenanceCost: Number(totalMaintenanceCost),
      avgMaintenanceCost,
      recentMaintenance,
      maintenanceByStatus
    };
  }

  // --- Incident Statistics ---
  async getIncidentStats() {
    const totalIncidents = await this.prisma.maintenanceSchedule.count();
    
    const activeIncidents = await this.prisma.maintenanceSchedule.count({
      where: { status: MaintenanceStatus.PENDING }
    });

    const resolvedIncidents = await this.prisma.maintenanceSchedule.count({
      where: { status: MaintenanceStatus.MAINTAINED }
    });

    // Incidents by type
    const incidentsByType = await this.prisma.maintenanceSchedule.groupBy({
      by: ['IncidentType'],
      _count: { id: true }
    });

    // Average resolution time
    const resolvedIncidentsData = await this.prisma.maintenanceSchedule.findMany({
      where: { 
        status: MaintenanceStatus.MAINTAINED
      },
      select: {
        incidentDate: true,
        updatedAt: true
      }
    });

    let totalResolutionTime = 0;
    resolvedIncidentsData.forEach(incident => {
      if (incident.updatedAt) {
        const resolutionTime = incident.updatedAt.getTime() - incident.incidentDate.getTime();
        totalResolutionTime += resolutionTime;
      }
    });

    const avgResolutionDays = resolvedIncidentsData.length > 0 ? 
      Math.round(totalResolutionTime / resolvedIncidentsData.length / (1000 * 60 * 60 * 24)) : 0;

    return {
      totalIncidents,
      activeIncidents,
      resolvedIncidents,
      incidentsByType,
      resolutionRate: totalIncidents > 0 ? 
        Math.round((resolvedIncidents / totalIncidents) * 100) : 0,
      avgResolutionDays
    };
  }

  // --- Utilization Statistics ---
  async getUtilizationStats() {
    const totalVehicles = await this.prisma.vehicle.count();
    const vehiclesWithTrips = await this.prisma.vehicle.count({
      where: {
        trips: {
          some: {} // At least one trip exists
        }
      }
    });

    // Total trips
    const totalTrips = await this.prisma.trip.count();

    // Recent trips (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTrips = await this.prisma.trip.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Vehicles with overtime requests
    const vehiclesWithOvertime = await this.prisma.vehicle.count({
      where: {
        overtimeRequests: {
          some: {}
        }
      }
    });

    return {
      utilizationRate: totalVehicles > 0 ? 
        Math.round((vehiclesWithTrips / totalVehicles) * 100) : 0,
      totalTrips,
      recentTrips,
      vehiclesWithTrips,
      vehiclesWithOvertime,
      averageTripsPerVehicle: totalVehicles > 0 ? 
        Math.round(totalTrips / totalVehicles) : 0
    };
  }

  // --- Maintenance Schedule Analytics ---
  async getMaintenanceScheduleAnalytics() {
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      include: {
        vehicle: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { incidentDate: 'desc' }
    });

    // Group by month for trends
    const monthlyTrends: Record<string, number> = {};
    schedules.forEach(schedule => {
      const month = schedule.incidentDate.toISOString().slice(0, 7); // YYYY-MM
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
    });

    // Pending maintenance schedules
    const pendingSchedules = schedules.filter(s => s.status === 'PENDING');

    return {
      totalSchedules: schedules.length,
      pendingSchedules: pendingSchedules.length,
      monthlyTrends,
      recentSchedules: schedules.slice(0, 10)
    };
  }

  // --- Cost Analysis ---
  async getCostAnalysis() {
    const maintenanceCosts = await this.prisma.maintainedVehicle.aggregate({
      _sum: { cost: true },
      _avg: { cost: true },
      _min: { cost: true },
      _max: { cost: true }
    });

    // Cost by vehicle (top 10 most expensive maintenance)
    const expensiveMaintenance = await this.prisma.maintainedVehicle.findMany({
      include: {
        vehicle: {
          select: {
            plate: true,
            make: true,
            model: true
          }
        }
      },
      orderBy: { cost: 'desc' },
      take: 10
    });

    return {
      totalCost: Number(maintenanceCosts._sum.cost || 0),
      averageCost: Number(maintenanceCosts._avg.cost || 0),
      minCost: Number(maintenanceCosts._min.cost || 0),
      maxCost: Number(maintenanceCosts._max.cost || 0),
      expensiveMaintenance: expensiveMaintenance.map(m => ({
        ...m,
        cost: Number(m.cost || 0)
      }))
    };
  }

  // --- Fleet Health Score ---
  async getFleetHealthScore() {
    const [
      vehicleStats,
      maintenanceStats,
      incidentStats
    ] = await Promise.all([
      this.getVehicleStats(),
      this.getMaintenanceStats(),
      this.getIncidentStats()
    ]);

    // Calculate health score based on multiple factors
    const driverAssignmentScore = vehicleStats.driverAssignmentRate;
    const maintenanceScore = 100 - (incidentStats.activeIncidents / vehicleStats.totalVehicles * 100);
    const utilizationScore = (await this.getUtilizationStats()).utilizationRate;
    const resolutionScore = incidentStats.resolutionRate;

    const healthScore = Math.round(
      (driverAssignmentScore + maintenanceScore + utilizationScore + resolutionScore) / 4
    );

    return {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      factors: {
        driverAssignment: driverAssignmentScore,
        maintenance: maintenanceScore,
        utilization: utilizationScore,
        incidentResolution: resolutionScore
      }
    };
  }

  // Report for fleet manager: include manager notification time per vehicle
  // In fleet.service.ts
async getFleetRequestsWithDetails() {
  const items = await this.prisma.fleetRequest.findMany({
    include: {
      requestor: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      vehicles: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          VehicleNotification: {
            where: { type: 'COMPLETED_MANAGER' },
            orderBy: { createdAt: 'asc' },
            select: { createdAt: true },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Map Prisma result to a simpler shape for the frontend
  return items.map((req: any) => ({
    ...req,
    vehicles: (req.vehicles || []).map((v: any) => ({
      id: v.id,
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      driver: v.user
        ? {
            id: v.user.id,
            firstName: v.user.firstName,
            lastName: v.user.lastName,
            phone: v.user.phone,
          }
        : null,
      // time when fleet manager received the completion notification
      managerNotifiedAt: v.VehicleNotification?.[0]?.createdAt ?? null,
    })),
  }));
}

// Flattened summary rows for UI tables (one row per request)
async listFleetRequestsSummary(page = 1, pageSize = 10) {
  const take = Math.max(1, pageSize);
  const skip = Math.max(0, (page - 1) * take);

  const [total, result] = await this.prisma.$transaction([
    this.prisma.fleetRequest.count(),
    this.prisma.fleetRequest.findMany({
      orderBy: { date: 'desc' },
      skip,
      take,
      include: {
        requestor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        vehicles: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const rows = result.map((req: any, index) => {
    const v = (req.vehicles && req.vehicles[0]) || null;
    const driver = v?.user || null;
    const requestor = req.requestor || null;

    return {
      number: skip + index + 1,
      id: req.id,
      requestorId: req.requestorId,
      requestorName: requestor
        ? `${requestor.firstName || ''} ${requestor.lastName || ''}`.trim()
        : null,
      requestorPhone: requestor?.phone ?? null,
      departmentName: req.department?.name ?? null,
      purpose: req.purpose ?? null,
      destination: req.destination ?? null,
      tripType: req.tripType ?? null,
      date: req.date,
      fromDate: req.fromDate,
      toDate: req.toDate,
      startTime: req.startTime ?? null,
      endTime: req.endTime ?? null,
      status: req.status ?? null,
      vehicleId: v?.id ?? null,
      vehiclePlate: v?.plate ?? null,
      vehicleMakeModel: v
        ? `${v.make || ''} ${v.model || ''}`.trim()
        : null,
      driverId: driver?.id ?? null,
      driverName: driver
        ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
        : null,
      driverPhone: driver?.phone ?? null,
    };
  });

  return { data: rows, count: rows.length, total, page, pageSize: take };
}
}