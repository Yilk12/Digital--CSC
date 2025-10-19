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
exports.ObjectivesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ObjectivesService = class ObjectivesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(scorecardId) {
        return this.prisma.objective.findMany({
            where: { scorecardId: scorecardId || undefined },
            orderBy: [{ createdAt: 'desc' }],
        });
    }
    get(id) {
        return this.prisma.objective.findUnique({ where: { id } });
    }
    create(data) {
        return this.prisma.objective.create({ data: data });
    }
    async update(id, data) {
        const exists = await this.prisma.objective.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Objective not found');
        return this.prisma.objective.update({ where: { id }, data: data });
    }
    async remove(id) {
        const exists = await this.prisma.objective.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Objective not found');
        await this.prisma.objective.delete({ where: { id } });
        return { ok: true };
    }
};
exports.ObjectivesService = ObjectivesService;
exports.ObjectivesService = ObjectivesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ObjectivesService);
//# sourceMappingURL=objectives.service.js.map