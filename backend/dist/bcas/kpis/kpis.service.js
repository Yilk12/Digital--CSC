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
exports.KpisService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let KpisService = class KpisService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(objectiveId) {
        return this.prisma.kPI.findMany({
            where: { objectiveId: objectiveId || undefined },
            orderBy: [{ createdAt: 'desc' }],
        });
    }
    get(id) {
        return this.prisma.kPI.findUnique({ where: { id } });
    }
    create(data) {
        return this.prisma.kPI.create({ data: data });
    }
    async update(id, data) {
        const exists = await this.prisma.kPI.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('KPI not found');
        return this.prisma.kPI.update({ where: { id }, data: data });
    }
    async remove(id) {
        const exists = await this.prisma.kPI.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('KPI not found');
        await this.prisma.kPI.delete({ where: { id } });
        return { ok: true };
    }
    listTargets(kpiId) {
        return this.prisma.kpiTarget.findMany({ where: { kpiId }, orderBy: [{ periodStart: 'asc' }] });
    }
    createTarget(kpiId, data) {
        return this.prisma.kpiTarget.create({ data: Object.assign(Object.assign({}, data), { kpiId }) });
    }
    removeTarget(id) {
        return this.prisma.kpiTarget.delete({ where: { id } });
    }
    listDataPoints(kpiId) {
        return this.prisma.kpiDataPoint.findMany({ where: { kpiId }, orderBy: [{ periodDate: 'asc' }] });
    }
    createDataPoint(kpiId, data) {
        return this.prisma.kpiDataPoint.create({ data: Object.assign(Object.assign({}, data), { kpiId }) });
    }
    approveDataPoint(id, approverId) {
        return this.prisma.kpiDataPoint.update({ where: { id }, data: { status: 'APPROVED', approvedById: approverId, approvedAt: new Date() } });
    }
    removeDataPoint(id) {
        return this.prisma.kpiDataPoint.delete({ where: { id } });
    }
    async bulkCreateDataPoints(items) {
        if (!Array.isArray(items) || items.length === 0)
            return { created: 0 };
        const data = items.map((i) => (Object.assign(Object.assign({}, i), { periodDate: new Date(i.periodDate) })));
        const created = await this.prisma.kpiDataPoint.createMany({ data });
        return { created: created.count };
    }
};
exports.KpisService = KpisService;
exports.KpisService = KpisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KpisService);
//# sourceMappingURL=kpis.service.js.map