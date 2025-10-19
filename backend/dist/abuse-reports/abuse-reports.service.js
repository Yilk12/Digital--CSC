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
exports.AbuseReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const REPORT_STATUS = ['PENDING', 'RESOLVED', 'REJECTED'];
const REPORT_TARGET_TYPES = ['USER', 'ARTICLE', 'TICKET', 'POST', 'COMMENT'];
let AbuseReportsService = class AbuseReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(params) {
        try {
            const report = await this.prisma.abuseReport.create({
                data: {
                    reporterId: params.reporterId,
                    targetType: params.targetType,
                    targetId: params.targetId,
                    reason: params.reason,
                    description: params.description,
                },
            });
            return report;
        }
        catch (e) {
            if (String((e === null || e === void 0 ? void 0 : e.message) || '').includes('uniq_open_report_per_target')) {
                throw new common_1.ForbiddenException('Duplicate pending report exists');
            }
            throw e;
        }
    }
    async list(params) {
        return this.prisma.abuseReport.findMany({
            where: {
                status: params.status,
                targetType: params.targetType,
                reporterId: params.reporterId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status, actorId) {
        const existing = await this.prisma.abuseReport.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Report not found');
        const updated = await this.prisma.abuseReport.update({
            where: { id },
            data: { status },
        });
        await this.prisma.auditLog.create({
            data: {
                action: 'abuse_report_status_update',
                entity: 'abuse_report',
                entityId: id,
                userId: actorId,
                oldValues: { status: existing.status },
                newValues: { status },
            },
        }).catch(() => null);
        return updated;
    }
};
exports.AbuseReportsService = AbuseReportsService;
exports.AbuseReportsService = AbuseReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AbuseReportsService);
//# sourceMappingURL=abuse-reports.service.js.map