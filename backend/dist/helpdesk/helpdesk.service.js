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
exports.HelpdeskService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let HelpdeskService = class HelpdeskService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(userId, userRole) {
        const where = this.buildWhereClause(userId, userRole);
        const [totalTickets, openTickets, resolvedTickets, overdueTickets, recentTickets, priorityDistribution, statusDistribution, avgResolutionTime] = await Promise.all([
            this.prisma.ticket.count({ where }),
            this.prisma.ticket.count({ where: Object.assign(Object.assign({}, where), { status: { in: [client_1.TicketStatus.OPEN, client_1.TicketStatus.IN_PROGRESS] } }) }),
            this.prisma.ticket.count({ where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED }) }),
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { slaDeadline: { lt: new Date() }, status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] } })
            }),
            this.prisma.ticket.findMany({
                where,
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                    creator: { select: { firstName: true, lastName: true } },
                    assignee: { select: { firstName: true, lastName: true } }
                }
            }),
            this.prisma.ticket.groupBy({
                by: ["priority"],
                where,
                _count: { priority: true }
            }),
            this.prisma.ticket.groupBy({
                by: ["status"],
                where,
                _count: { status: true }
            }),
            this.calculateAverageResolutionTime(where)
        ]);
        return {
            summary: {
                totalTickets,
                openTickets,
                resolvedTickets,
                overdueTickets,
                avgResolutionTime
            },
            recentTickets,
            priorityDistribution: this.formatGroupByResults(priorityDistribution, "priority"),
            statusDistribution: this.formatGroupByResults(statusDistribution, "status")
        };
    }
    async getTicketMetrics(userId, userRole, period) {
        const where = this.buildWhereClause(userId, userRole);
        const dateRange = this.getDateRange(period);
        const metricsWhere = Object.assign(Object.assign({}, where), { createdAt: { gte: dateRange.start, lte: dateRange.end } });
        const [createdCount, resolvedCount, avgResolutionTime, firstResponseTime, customerSatisfaction, slaCompliance] = await Promise.all([
            this.prisma.ticket.count({ where: metricsWhere }),
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, metricsWhere), { status: client_1.TicketStatus.RESOLVED })
            }),
            this.calculateAverageResolutionTime(metricsWhere),
            this.calculateAverageFirstResponseTime(metricsWhere),
            this.calculateCustomerSatisfaction(metricsWhere),
            this.calculateSlaCompliance(metricsWhere)
        ]);
        return {
            period,
            metrics: {
                ticketsCreated: createdCount,
                ticketsResolved: resolvedCount,
                resolutionRate: createdCount > 0 ? (resolvedCount / createdCount * 100).toFixed(2) : 0,
                avgResolutionTime,
                avgFirstResponseTime: firstResponseTime,
                customerSatisfaction,
                slaCompliance
            }
        };
    }
    async getSlaPerformance(userId, userRole, departmentId) {
        const where = this.buildWhereClause(userId, userRole);
        if (departmentId)
            where.departmentId = departmentId;
        const [withinSla, breachedSla, totalTickets] = await Promise.all([
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { OR: [
                        { status: client_1.TicketStatus.RESOLVED, resolvedAt: { lte: this.prisma.ticket.fields.slaDeadline } },
                        { status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] }, slaDeadline: { gte: new Date() } }
                    ] })
            }),
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { OR: [
                        { status: client_1.TicketStatus.RESOLVED, resolvedAt: { gt: this.prisma.ticket.fields.slaDeadline } },
                        { status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] }, slaDeadline: { lt: new Date() } }
                    ] })
            }),
            this.prisma.ticket.count({ where })
        ]);
        const slaPerformance = totalTickets > 0 ? (withinSla / totalTickets * 100).toFixed(2) : '0';
        return {
            withinSla,
            breachedSla,
            totalTickets,
            slaPerformance: parseFloat(slaPerformance)
        };
    }
    async getAgentPerformance() {
        const agents = await this.prisma.user.findMany({
            where: { role: { in: [client_1.UserRole.SUPPORT_AGENT, client_1.UserRole.STAFF_MANAGER] } },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
            }
        });
        const performance = await Promise.all(agents.map(async (agent) => {
            const [assigned, resolved, avgResolutionTime, customerRating] = await Promise.all([
                this.prisma.ticket.count({ where: { assigneeId: agent.id } }),
                this.prisma.ticket.count({
                    where: { assigneeId: agent.id, status: client_1.TicketStatus.RESOLVED }
                }),
                this.calculateAverageResolutionTime({ assigneeId: agent.id }),
                this.calculateAgentRating(agent.id)
            ]);
            return {
                agent,
                metrics: {
                    assignedTickets: assigned,
                    resolvedTickets: resolved,
                    resolutionRate: assigned > 0 ? (resolved / assigned * 100).toFixed(2) : 0,
                    avgResolutionTime,
                    customerRating
                }
            };
        }));
        return performance;
    }
    async getTicketTrends(userId, userRole, period, groupBy) {
        const where = this.buildWhereClause(userId, userRole);
        const dateRange = this.getDateRange(period);
        const tickets = await this.prisma.ticket.findMany({
            where: Object.assign(Object.assign({}, where), { createdAt: { gte: dateRange.start, lte: dateRange.end } }),
            select: {
                createdAt: true,
                status: true,
                priority: true
            },
            orderBy: { createdAt: "asc" }
        });
        const trends = this.groupTicketsByTime(tickets, groupBy);
        return {
            period,
            groupBy,
            trends
        };
    }
    async getWorkloadDistribution() {
        const distribution = await this.prisma.ticket.groupBy({
            by: ["assigneeId"],
            _count: { assigneeId: true },
            where: {
                status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] }
            }
        });
        const workload = await Promise.all(distribution.map(async (item) => {
            if (!item.assigneeId)
                return null;
            const agent = await this.prisma.user.findUnique({
                where: { id: item.assigneeId },
                select: { firstName: true, lastName: true, email: true }
            });
            return {
                agent,
                activeTickets: item._count.assigneeId
            };
        }));
        return workload.filter(Boolean);
    }
    async getSatisfactionMetrics(period) {
        var _a, _b;
        const dateRange = this.getDateRange(period);
        const satisfaction = await this.prisma.articleFeedback.groupBy({
            by: ["isLike"],
            _count: { isLike: true },
            where: {
                createdAt: { gte: dateRange.start, lte: dateRange.end }
            }
        });
        const totalFeedback = satisfaction.reduce((sum, item) => { var _a; return sum + (((_a = item._count) === null || _a === void 0 ? void 0 : _a.isLike) || 0); }, 0);
        const likes = ((_b = (_a = satisfaction.find(item => item.isLike)) === null || _a === void 0 ? void 0 : _a._count) === null || _b === void 0 ? void 0 : _b.isLike) || 0;
        const avgRating = totalFeedback > 0 ? (likes / totalFeedback * 100) : 0;
        return {
            period,
            totalFeedback,
            averageRating: avgRating || 0,
            distribution: satisfaction
        };
    }
    async getEscalationStats(userId, userRole) {
        const where = this.buildWhereClause(userId, userRole);
        const escalated = await this.prisma.ticket.count({
            where: Object.assign(Object.assign({}, where), { priority: client_1.TicketPriority.URGENT })
        });
        return {
            escalatedTickets: escalated,
        };
    }
    async getDepartmentStats(userId, userRole) {
        const where = this.buildWhereClause(userId, userRole);
        const departmentStats = await this.prisma.ticket.groupBy({
            by: ["departmentId"],
            where,
            _count: { departmentId: true }
        });
        const stats = await Promise.all(departmentStats.map(async (stat) => {
            const department = await this.prisma.department.findUnique({
                where: { id: stat.departmentId || '' },
                select: { name: true }
            });
            return {
                department: (department === null || department === void 0 ? void 0 : department.name) || "Unknown",
                ticketCount: stat._count.departmentId
            };
        }));
        return stats;
    }
    async getQueueStatus(userId, userRole) {
        const where = this.buildWhereClause(userId, userRole);
        const [unassigned, inProgress, pending, overdue] = await Promise.all([
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { assigneeId: null, status: client_1.TicketStatus.OPEN })
            }),
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.IN_PROGRESS })
            }),
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.PENDING })
            }),
            this.prisma.ticket.count({
                where: Object.assign(Object.assign({}, where), { slaDeadline: { lt: new Date() }, status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] } })
            })
        ]);
        return {
            unassigned,
            inProgress,
            pending,
            overdue
        };
    }
    async getOverdueTickets(userId, userRole, limit) {
        const where = this.buildWhereClause(userId, userRole);
        return this.prisma.ticket.findMany({
            where: Object.assign(Object.assign({}, where), { slaDeadline: { lt: new Date() }, status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] } }),
            take: limit,
            orderBy: { slaDeadline: "asc" },
            include: {
                creator: { select: { firstName: true, lastName: true } },
                assignee: { select: { firstName: true, lastName: true } },
                department: { select: { name: true } }
            }
        });
    }
    async getRecentActivity(userId, userRole, limit) {
        const where = this.buildWhereClause(userId, userRole);
        return this.prisma.auditLog.findMany({
            where: {
                entity: "TICKET",
                ticket: where
            },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { firstName: true, lastName: true } }
            }
        });
    }
    async exportData(format, type, userId) {
        return {
            message: `Export initiated for ${type} in ${format} format`,
            downloadUrl: `/api/helpdesk/download/${type}-${Date.now()}.${format}`
        };
    }
    buildWhereClause(userId, userRole) {
        const where = {};
        if (userRole === client_1.UserRole.END_USER) {
            where.createdById = userId;
        }
        else if (userRole === client_1.UserRole.SUPPORT_AGENT) {
            where.OR = [{ createdById: userId }, { assigneeId: userId }];
        }
        return where;
    }
    getDateRange(period) {
        const now = new Date();
        const start = new Date();
        switch (period) {
            case "day":
                start.setDate(now.getDate() - 1);
                break;
            case "week":
                start.setDate(now.getDate() - 7);
                break;
            case "month":
                start.setMonth(now.getMonth() - 1);
                break;
            case "3months":
                start.setMonth(now.getMonth() - 3);
                break;
            case "year":
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                start.setMonth(now.getMonth() - 1);
        }
        return { start, end: now };
    }
    formatGroupByResults(results, field) {
        return results.reduce((acc, item) => {
            acc[item[field]] = item._count[field];
            return acc;
        }, {});
    }
    async calculateAverageResolutionTime(where) {
        const resolvedTickets = await this.prisma.ticket.findMany({
            where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED, resolvedAt: { not: null } }),
            select: { createdAt: true, resolvedAt: true }
        });
        if (resolvedTickets.length === 0)
            return 0;
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
            const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
            return sum + resolutionTime;
        }, 0);
        return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60));
    }
    async calculateAverageFirstResponseTime(where) {
        return 0;
    }
    async calculateCustomerSatisfaction(where) {
        return 0;
    }
    async calculateSlaCompliance(where) {
        return 0;
    }
    async calculateAgentRating(agentId) {
        return 0;
    }
    groupTicketsByTime(tickets, groupBy) {
        return [];
    }
};
exports.HelpdeskService = HelpdeskService;
exports.HelpdeskService = HelpdeskService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HelpdeskService);
//# sourceMappingURL=helpdesk.service.js.map