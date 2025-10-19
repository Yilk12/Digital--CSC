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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async logAction(action, entity, entityId, userId, oldValues, newValues) {
        return this.prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                userId,
                oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
                newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
            },
        });
    }
    async getAuditLogs(entityType, entityId, userId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = {};
        if (entityType)
            where.entity = entityType;
        if (entityId)
            where.entityId = entityId;
        if (userId)
            where.userId = userId;
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getEntityHistory(entityType, entityId) {
        return this.prisma.auditLog.findMany({
            where: { entity: entityType, entityId },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
    }
    async getUserActivity(userId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return this.prisma.auditLog.findMany({
            where: {
                userId,
                createdAt: { gte: startDate },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getSystemActivity(days = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const [totalActions, actionsByType, actionsByUser, recentActions] = await Promise.all([
            this.prisma.auditLog.count({
                where: { createdAt: { gte: startDate } },
            }),
            this.prisma.auditLog.groupBy({
                by: ["action"],
                where: { createdAt: { gte: startDate } },
                _count: { action: true },
            }),
            this.prisma.auditLog.groupBy({
                by: ["userId"],
                where: {
                    createdAt: { gte: startDate },
                    userId: { not: null },
                },
                _count: { userId: true },
            }),
            this.prisma.auditLog.findMany({
                where: { createdAt: { gte: startDate } },
                include: {
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            }),
        ]);
        return {
            totalActions,
            actionsByType: actionsByType.reduce((acc, item) => {
                acc[item.action] = item._count.action;
                return acc;
            }, {}),
            actionsByUser: actionsByUser.reduce((acc, item) => {
                acc[item.userId] = item._count.userId;
                return acc;
            }, {}),
            recentActions,
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map