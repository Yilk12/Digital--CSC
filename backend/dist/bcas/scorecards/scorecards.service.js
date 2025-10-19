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
exports.ScorecardsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ScorecardsService = class ScorecardsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(params = {}) {
        const { scope, status, year, quarter } = params;
        return this.prisma.scorecard.findMany({
            where: {
                scope: scope || undefined,
                status: status || undefined,
                year: year !== null && year !== void 0 ? year : undefined,
                quarter: quarter !== null && quarter !== void 0 ? quarter : undefined,
            },
            orderBy: [{ createdAt: 'desc' }],
        });
    }
    get(id) {
        return this.prisma.scorecard.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.scorecard.create({ data: Object.assign({}, data) });
    }
    async update(id, data) {
        const exists = await this.prisma.scorecard.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Scorecard not found');
        return this.prisma.scorecard.update({ where: { id }, data: data });
    }
    async remove(id) {
        const exists = await this.prisma.scorecard.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Scorecard not found');
        await this.prisma.scorecard.delete({ where: { id } });
        return { ok: true };
    }
};
exports.ScorecardsService = ScorecardsService;
exports.ScorecardsService = ScorecardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScorecardsService);
//# sourceMappingURL=scorecards.service.js.map