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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateTicketReport(generateReportDto, userId) {
        const { dateFrom, dateTo, format } = generateReportDto;
        const where = {
            createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
        };
        const [tickets, summary] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                include: {
                    creator: { select: { firstName: true, lastName: true } },
                    assignee: { select: { firstName: true, lastName: true } },
                    department: { select: { name: true } },
                    comments: true,
                    attachments: true
                }
            }),
            this.getTicketSummary(where)
        ]);
        const reportData = {
            type: 'ticket-report',
            period: { from: dateFrom, to: dateTo },
            summary,
            tickets: tickets.map(ticket => {
                var _a;
                return ({
                    id: ticket.id,
                    title: ticket.title,
                    status: ticket.status,
                    priority: ticket.priority,
                    assignee: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned',
                    department: ((_a = ticket.department) === null || _a === void 0 ? void 0 : _a.name) || 'No Department',
                    createdAt: ticket.createdAt,
                    resolvedAt: ticket.resolvedAt,
                    commentsCount: ticket.comments.length,
                    attachmentsCount: ticket.attachments.length,
                    slaStatus: this.getSlaStatus(ticket.slaDeadline, ticket.resolvedAt, ticket.status)
                });
            })
        };
        return this.generateReport(reportData, format, "ticket-report", userId);
    }
    async generateAgentPerformanceReport(generateReportDto, userId) {
        const { dateFrom, dateTo, format } = generateReportDto;
        const agents = await this.prisma.user.findMany({
            where: { role: { in: [client_1.UserRole.SUPPORT_AGENT, client_1.UserRole.STAFF_MANAGER] } },
            select: { id: true, firstName: true, lastName: true, email: true, role: true }
        });
        const performanceData = await Promise.all(agents.map(async (agent) => {
            const where = {
                assigneeId: agent.id,
                createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
            };
            const [totalTickets, resolvedTickets, avgResolutionTime, customerRating, slaCompliance] = await Promise.all([
                this.prisma.ticket.count({ where }),
                this.prisma.ticket.count({ where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED }) }),
                this.calculateAvgResolutionTime(where),
                this.calculateCustomerRating(agent.id, dateFrom, dateTo),
                this.calculateSlaCompliance(where)
            ]);
            return {
                agent: {
                    id: agent.id,
                    name: `${agent.firstName} ${agent.lastName}`,
                    email: agent.email,
                    role: agent.role
                },
                metrics: {
                    totalTickets,
                    resolvedTickets,
                    resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
                    avgResolutionTime,
                    customerRating,
                    slaCompliance
                }
            };
        }));
        const reportData = {
            type: 'agent-performance-report',
            period: { from: dateFrom, to: dateTo },
            agents: performanceData
        };
        return this.generateReport(reportData, format, "agent-performance-report", userId);
    }
    async generateSlaReport(generateReportDto, userId) {
        const { dateFrom, dateTo, format } = generateReportDto;
        const where = {
            createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
        };
        const [totalTickets, slaCompliance, slaByPriority] = await Promise.all([
            this.prisma.ticket.count({ where }),
            this.calculateSlaCompliance(where),
            this.getSlaByPriority(where)
        ]);
        const reportData = {
            type: 'sla-report',
            period: { from: dateFrom, to: dateTo },
            summary: {
                totalTickets,
                overallCompliance: slaCompliance,
                complianceByPriority: slaByPriority
            }
        };
        return this.generateReport(reportData, format, "sla-report", userId);
    }
    async generateDepartmentReport(generateReportDto, userId) {
        const { dateFrom, dateTo, format } = generateReportDto;
        const departments = await this.prisma.department.findMany({
            select: { id: true, name: true }
        });
        const departmentData = await Promise.all(departments.map(async (dept) => {
            const where = {
                departmentId: dept.id,
                createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
            };
            const [totalTickets, resolvedTickets, avgResolutionTime] = await Promise.all([
                this.prisma.ticket.count({ where }),
                this.prisma.ticket.count({ where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED }) }),
                this.calculateAvgResolutionTime(where)
            ]);
            return {
                department: dept,
                metrics: {
                    totalTickets,
                    resolvedTickets,
                    resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
                    avgResolutionTime
                }
            };
        }));
        const reportData = {
            type: 'department-report',
            period: { from: dateFrom, to: dateTo },
            departments: departmentData
        };
        return this.generateReport(reportData, format, "department-report", userId);
    }
    async generateSatisfactionReport(generateReportDto, userId) {
        const { dateFrom, dateTo, format } = generateReportDto;
        const feedbackData = [
            { rating: 5, count: 10 },
            { rating: 4, count: 15 },
            { rating: 3, count: 8 },
            { rating: 2, count: 3 },
            { rating: 1, count: 2 }
        ];
        const totalFeedback = feedbackData.reduce((sum, item) => sum + item.count, 0);
        const avgRating = feedbackData.reduce((sum, item) => sum + (item.rating * item.count), 0) / totalFeedback;
        const reportData = {
            type: 'satisfaction-report',
            period: { from: dateFrom, to: dateTo },
            summary: {
                totalFeedback,
                averageRating: avgRating.toFixed(2),
                ratingDistribution: this.getRatingDistribution(feedbackData)
            }
        };
        return this.generateReport(reportData, format, "satisfaction-report", userId);
    }
    async generateKnowledgeBaseReport(generateReportDto, userId) {
        const { dateFrom, dateTo, format } = generateReportDto;
        const where = {
            createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
        };
        const [totalArticles, publishedArticles, totalViews, totalLikes, searchStats] = await Promise.all([
            this.prisma.article.count({ where }),
            this.prisma.article.count({ where: Object.assign(Object.assign({}, where), { status: client_1.ArticleStatus.PUBLISHED }) }),
            this.prisma.article.aggregate({
                where,
                _sum: { viewCount: true }
            }),
            this.prisma.article.aggregate({
                where,
                _sum: { likeCount: true }
            }),
            this.getSearchStats(dateFrom, dateTo)
        ]);
        const reportData = {
            type: 'knowledge-base-report',
            period: { from: dateFrom, to: dateTo },
            summary: {
                totalArticles,
                publishedArticles,
                totalViews: totalViews._sum.viewCount || 0,
                totalLikes: totalLikes._sum.likeCount || 0,
                searchStats
            }
        };
        return this.generateReport(reportData, format, "knowledge-base-report", userId);
    }
    async scheduleReport(reportConfig, userId) {
        return {
            id: 'schedule-' + Date.now(),
            reportType: reportConfig.type,
            frequency: reportConfig.frequency,
            nextRun: this.calculateNextRunTime(reportConfig.frequency),
            userId
        };
    }
    async cancelScheduledReport(scheduleId, userId) {
        return { success: true, message: 'Scheduled report cancelled' };
    }
    async downloadReport(reportId, userId) {
        return { downloadUrl: `/reports/download/${reportId}`, expiresAt: new Date(Date.now() + 3600000) };
    }
    async exportDashboardData(format, userId, userRole) {
        const dashboardData = {
            tickets: await this.getTicketSummary({}),
            agents: await this.prisma.user.count({ where: { role: { in: [client_1.UserRole.SUPPORT_AGENT, client_1.UserRole.STAFF_MANAGER] } } }),
            departments: await this.prisma.department.count()
        };
        return this.generateReport(dashboardData, format, "dashboard-export", userId);
    }
    async getTicketSummary(where) {
        const [totalTickets, resolvedTickets, avgResolutionTime, slaCompliance] = await Promise.all([
            this.prisma.ticket.count({ where }),
            this.prisma.ticket.count({ where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED }) }),
            this.calculateAvgResolutionTime(where),
            this.calculateSlaCompliance(where)
        ]);
        return {
            totalTickets,
            resolvedTickets,
            resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
            avgResolutionTime,
            slaCompliance
        };
    }
    getSlaStatus(slaDeadline, resolvedAt, status) {
        if (!slaDeadline)
            return 'NO_SLA';
        if (status !== client_1.TicketStatus.RESOLVED) {
            return Date.now() > slaDeadline.getTime() ? 'BREACHED' : 'WITHIN_SLA';
        }
        return resolvedAt && resolvedAt.getTime() <= slaDeadline.getTime() ? 'MET' : 'BREACHED';
    }
    async calculateAvgResolutionTime(where) {
        const resolvedTickets = await this.prisma.ticket.findMany({
            where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED, resolvedAt: { not: null } }),
            select: { createdAt: true, resolvedAt: true }
        });
        if (resolvedTickets.length === 0)
            return 0;
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
            return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
        }, 0);
        return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60));
    }
    async calculateSlaCompliance(where) {
        const ticketsWithSla = await this.prisma.ticket.count({
            where: Object.assign(Object.assign({}, where), { slaDeadline: { not: null } })
        });
        if (ticketsWithSla === 0)
            return 100;
        const compliantTickets = await this.prisma.ticket.count({
            where: Object.assign(Object.assign({}, where), { slaDeadline: { not: null }, OR: [
                    { status: { not: client_1.TicketStatus.RESOLVED } },
                    { AND: [{ resolvedAt: { not: null } }, { resolvedAt: { lte: new Date() } }] }
                ] })
        });
        return Math.round((compliantTickets / ticketsWithSla) * 100);
    }
    async calculateCustomerRating(agentId, dateFrom, dateTo) {
        return 4.2;
    }
    async getSlaByPriority(where) {
        return {
            HIGH: { total: 10, compliant: 8, compliance: 80 },
            MEDIUM: { total: 20, compliant: 18, compliance: 90 },
            LOW: { total: 15, compliant: 15, compliance: 100 }
        };
    }
    getRatingDistribution(feedbackData) {
        return feedbackData.reduce((acc, item) => {
            acc[item.rating] = item.count;
            return acc;
        }, {});
    }
    async getSearchStats(dateFrom, dateTo) {
        return {
            totalSearches: 150,
            uniqueQueries: 75,
            avgResultsPerSearch: 3.2,
            topQueries: ['password reset', 'account setup', 'billing']
        };
    }
    calculateNextRunTime(frequency) {
        const now = new Date();
        switch (frequency) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'weekly':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            case 'monthly':
                return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }
    async generateReport(data, format, type, userId) {
        const reportId = 'report-' + Date.now();
        return {
            id: reportId,
            type,
            format,
            data,
            generatedAt: new Date(),
            userId,
            downloadUrl: `/reports/download/${reportId}`
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.new.js.map