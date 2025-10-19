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
exports.PlanningService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PlanningService = class PlanningService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(params) {
        const { owner, status, q, page, pageSize, sortBy, sortDir, sortMulti } = params;
        const where = {};
        if (owner)
            where.ownerId = owner;
        if (status)
            where.status = status;
        if (q)
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { id: { contains: q, mode: 'insensitive' } },
            ];
        let orderBy = { createdAt: 'desc' };
        if (sortMulti) {
            const fields = String(sortMulti).split(',').map(s => s.trim()).filter(Boolean).map(part => {
                const [k, d] = part.split(':').map(t => t.trim());
                return { [k]: ((d === null || d === void 0 ? void 0 : d.toLowerCase()) === 'desc' ? 'desc' : 'asc') };
            });
            if (fields.length)
                orderBy = fields;
        }
        else if (sortBy) {
            orderBy = { [sortBy]: sortDir };
        }
        const total = await this.prisma.plan.count({ where });
        const items = await this.prisma.plan.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize });
        return { ok: true, items, page, pageSize, total };
    }
    async create(body) {
        return this.prisma.plan.create({ data: { title: body.title, description: body.description || '', ownerId: body.ownerId } });
    }
    async update(id, body) {
        return this.prisma.plan.update({ where: { id }, data: body });
    }
    async remove(id) {
        return this.prisma.plan.delete({ where: { id } });
    }
};
exports.PlanningService = PlanningService;
exports.PlanningService = PlanningService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PlanningService);
//# sourceMappingURL=planning.service.js.map