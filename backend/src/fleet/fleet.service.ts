import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FleetService {
  constructor(private prisma: PrismaService) {}

  // Vehicles
  async listVehicles(q?: string) {
    return this.prisma.vehicle.findMany({
      where: q ? { OR: [
        { plate: { contains: q, mode: 'insensitive' } },
        { make: { contains: q, mode: 'insensitive' } },
        { model: { contains: q, mode: 'insensitive' } },
      ] } : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async createVehicle(body: { plate: string; make?: string; model?: string; year?: number; departmentId?: string }) {
    return this.prisma.vehicle.create({ data: body })
  }

  async updateVehicle(id: string, body: any) {
    return this.prisma.vehicle.update({ where: { id }, data: body })
  }

  async deleteVehicle(id: string) {
    return this.prisma.vehicle.delete({ where: { id } })
  }

  // Requests
  async listRequests(status?: string) {
    return this.prisma.fleetRequest.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { date: 'desc' },
    })
  }

  async createRequest(body: { requestorId: string; purpose: string; tripType?: string; destination?: string; date: string }) {
    const date = new Date(body.date)
    return this.prisma.fleetRequest.create({ data: { ...body, date } })
  }

  async setRequestStatus(id: number, status: 'APPROVED' | 'REJECTED') {
    return this.prisma.fleetRequest.update({ where: { id }, data: { status } as any })
  }

  // Trips
  async listTrips(vehicleId?: string) {
    return this.prisma.trip.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      orderBy: { startAt: 'desc' },
    })
  }

  async createTrip(body: { vehicleId: string; driverId: string; startAt: string; origin?: string; destination?: string; distanceKm?: number }) {
    return this.prisma.trip.create({ data: { ...body, startAt: new Date(body.startAt) } })
  }
}
