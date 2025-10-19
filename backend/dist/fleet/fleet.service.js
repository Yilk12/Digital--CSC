"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FleetService = class FleetService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listVehicles(q) {
        return this.prisma.vehicle.findMany({
            where: q ? { OR: [
                    { plate: { contains: q, mode: 'insensitive' } },
                    { make: { contains: q, mode: 'insensitive' } },
                    { model: { contains: q, mode: 'insensitive' } },
                ] } : undefined,
            orderBy: { createdAt: 'desc' },
        });
    }
    async createVehicle(body) {
        return this.prisma.vehicle.create({ data: body });
    }
    async updateVehicle(id, body) {
        return this.prisma.vehicle.update({ where: { id }, data: body });
    }
    async deleteVehicle(id) {
        return this.prisma.vehicle.delete({ where: { id } });
    }
    async listRequests(status) {
        return this.prisma.fleetRequest.findMany({
            where: status ? { status: status } : undefined,
            orderBy: { date: 'desc' },
        });
    }
    async createRequest(body) {
        const date = new Date(body.date);
        return this.prisma.fleetRequest.create({ data: Object.assign(Object.assign({}, body), { date }) });
    }
    async setRequestStatus(id, status) {
        return this.prisma.fleetRequest.update({ where: { id }, data: { status } });
    }
    async listTrips(vehicleId) {
        return this.prisma.trip.findMany({
            where: vehicleId ? { vehicleId } : undefined,
            orderBy: { startAt: 'desc' },
        });
    }
    async createTrip(body) {
        return this.prisma.trip.create({ data: Object.assign(Object.assign({}, body), { startAt: new Date(body.startAt) }) });
    }
};
exports.FleetService = FleetService;
exports.FleetService = FleetService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FleetService);
//# sourceMappingURL=fleet.service.js.map