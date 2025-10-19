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
    async generateTicketReport(startDate, endDate, format = "json", userRole, userId) {
        const where = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };
        if (userRole === client_1.UserRole.END_USER) {
            where.createdById = userId;
        }
        else if (userRole === client_1.UserRole.SUPPORT_AGENT) {
            where.OR = [{ createdById: userId }, { assigneeId: userId }];
        }
        const tickets = await this.prisma.ticket.findMany({
            where,
            include: {
                creator: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        department: true,
                    },
                },
                assignee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                department: true,
                _count: {
                    select: {
                        comments: true,
                        attachments: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const reportData = tickets.map((ticket) => {
            var _a, _b;
            return ({
                id: ticket.id,
                title: ticket.title,
                status: ticket.status,
                priority: ticket.priority,
                category: ticket.category,
                createdAt: ticket.createdAt,
                resolvedAt: ticket.resolvedAt,
                slaDeadline: ticket.slaDeadline,
                creator: `${ticket.creator.firstName} ${ticket.creator.lastName}`,
                creatorEmail: ticket.creator.email,
                creatorDepartment: ticket.creator.department,
                assignee: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : null,
                assigneeEmail: (_a = ticket.assignee) === null || _a === void 0 ? void 0 : _a.email,
                department: (_b = ticket.department) === null || _b === void 0 ? void 0 : _b.name,
                commentsCount: ticket._count.comments,
                attachmentsCount: ticket._count.attachments,
                resolutionTime: ticket.resolvedAt
                    ? Math.round((ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60))
                    : null,
                slaCompliant: ticket.resolvedAt ? ticket.resolvedAt <= ticket.slaDeadline : new Date() <= ticket.slaDeadline,
            });
        });
        if (format === "csv") {
            return this.convertToCSV(reportData);
        }
        return {
            data: reportData,
            summary: {
                total: tickets.length,
                byStatus: this.groupBy(tickets, "status"),
                byPriority: this.groupBy(tickets, "priority"),
                byCategory: this.groupBy(tickets, "category"),
                avgResolutionTime: this.calculateAvgResolutionTime(tickets),
                slaCompliance: this.calculateSlaCompliance(tickets),
            },
        };
    }
    async generateKnowledgeBaseReport(startDate, endDate, format = "json", userRole, userId) {
        const where = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };
        if (userRole === client_1.UserRole.SUPPORT_AGENT) {
            where.authorId = userId;
        }
        const articles = await this.prisma.article.findMany({
            where,
            include: {
                author: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        feedback: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const reportData = articles.map((article) => {
            var _a;
            return ({
                id: article.id,
                title: article.title,
                titleAm: article.titleAm,
                status: article.status,
                language: article.language,
                createdAt: article.createdAt,
                publishedAt: article.publishedAt,
                expiresAt: article.expiresAt,
                author: `${article.author.firstName} ${article.author.lastName}`,
                authorEmail: article.author.email,
                category: (_a = article.category) === null || _a === void 0 ? void 0 : _a.name,
                tags: article.tags.map((at) => at.tag.name).join(", "),
                viewCount: article.viewCount,
                likeCount: article.likeCount,
                dislikeCount: article.dislikeCount,
                commentsCount: article._count.comments,
                feedbackCount: article._count.feedback,
                engagementRate: article.viewCount > 0 ? ((article.likeCount + article._count.comments) / article.viewCount) * 100 : 0,
            });
        });
        if (format === "csv") {
            return this.convertToCSV(reportData);
        }
        return {
            data: reportData,
            summary: {
                total: articles.length,
                byStatus: this.groupBy(articles, "status"),
                byLanguage: this.groupBy(articles, "language"),
                totalViews: articles.reduce((sum, a) => sum + a.viewCount, 0),
                totalLikes: articles.reduce((sum, a) => sum + a.likeCount, 0),
                avgEngagement: reportData.reduce((sum, a) => sum + a.engagementRate, 0) / reportData.length,
            },
        };
    }
    async generateUserReport(startDate, endDate, format = "json") {
        const users = await this.prisma.user.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                _count: {
                    select: {
                        createdTickets: true,
                        assignedTickets: true,
                        createdArticles: true,
                        ticketComments: true,
                        articleComments: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        const reportData = users.map((user) => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            userType: user.userType,
            department: user.department,
            isActive: user.isActive,
            createdAt: user.createdAt,
            ticketsCreated: user._count.createdTickets,
            ticketsAssigned: user._count.assignedTickets,
            articlesCreated: user._count.createdArticles,
            ticketComments: user._count.ticketComments,
            articleComments: user._count.articleComments,
            totalActivity: user._count.createdTickets +
                user._count.assignedTickets +
                user._count.createdArticles +
                user._count.ticketComments +
                user._count.articleComments,
        }));
        if (format === "csv") {
            return this.convertToCSV(reportData);
        }
        return {
            data: reportData,
            summary: {
                total: users.length,
                byRole: this.groupBy(users, "role"),
                byUserType: this.groupBy(users, "userType"),
                active: users.filter((u) => u.isActive).length,
                inactive: users.filter((u) => !u.isActive).length,
            },
        };
    }
    async generatePerformanceReport(startDate, endDate, format = "json") {
        const agents = await this.prisma.user.findMany({
            where: {
                role: client_1.UserRole.SUPPORT_AGENT,
                isActive: true,
            },
            include: {
                assignedTickets: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    select: {
                        id: true,
                        status: true,
                        priority: true,
                        createdAt: true,
                        resolvedAt: true,
                        slaDeadline: true,
                    },
                },
                createdArticles: {
                    where: {
                        createdAt: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    select: {
                        id: true,
                        status: true,
                        viewCount: true,
                        likeCount: true,
                    },
                },
            },
        });
        const reportData = agents.map((agent) => {
            const tickets = agent.assignedTickets;
            const articles = agent.createdArticles;
            const resolvedTickets = tickets.filter((t) => t.status === client_1.TicketStatus.RESOLVED);
            const publishedArticles = articles.filter((a) => a.status === client_1.ArticleStatus.PUBLISHED);
            const avgResolutionTime = resolvedTickets.length > 0
                ? resolvedTickets.reduce((sum, ticket) => {
                    if (ticket.resolvedAt) {
                        return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
                    }
                    return sum;
                }, 0) /
                    resolvedTickets.length /
                    (1000 * 60 * 60)
                : 0;
            const slaCompliant = tickets.filter((ticket) => {
                if (ticket.status === client_1.TicketStatus.RESOLVED && ticket.resolvedAt) {
                    return ticket.resolvedAt <= ticket.slaDeadline;
                }
                return new Date() <= ticket.slaDeadline;
            }).length;
            return {
                id: agent.id,
                name: `${agent.firstName} ${agent.lastName}`,
                email: agent.email,
                department: agent.department,
                ticketsAssigned: tickets.length,
                ticketsResolved: resolvedTickets.length,
                resolutionRate: tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0,
                avgResolutionTime: Math.round(avgResolutionTime),
                slaCompliance: tickets.length > 0 ? (slaCompliant / tickets.length) * 100 : 0,
                articlesCreated: articles.length,
                articlesPublished: publishedArticles.length,
                totalArticleViews: articles.reduce((sum, a) => sum + a.viewCount, 0),
                totalArticleLikes: articles.reduce((sum, a) => sum + a.likeCount, 0),
                performanceScore: this.calculatePerformanceScore({
                    resolutionRate: tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0,
                    slaCompliance: tickets.length > 0 ? (slaCompliant / tickets.length) * 100 : 0,
                    articlesPublished: publishedArticles.length,
                }),
            };
        });
        if (format === "csv") {
            return this.convertToCSV(reportData);
        }
        return {
            data: reportData,
            summary: {
                totalAgents: agents.length,
                avgResolutionRate: reportData.reduce((sum, a) => sum + a.resolutionRate, 0) / reportData.length,
                avgSlaCompliance: reportData.reduce((sum, a) => sum + a.slaCompliance, 0) / reportData.length,
                topPerformers: reportData.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5),
            },
        };
    }
    convertToCSV(data) {
        if (data.length === 0)
            return "";
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(","),
            ...data.map((row) => headers
                .map((header) => {
                const value = row[header];
                if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            })
                .join(",")),
        ].join("\n");
        return csvContent;
    }
    groupBy(array, field) {
        return array.reduce((acc, item) => {
            const key = item[field];
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    calculateAvgResolutionTime(tickets) {
        const resolved = tickets.filter((t) => t.resolvedAt);
        if (resolved.length === 0)
            return 0;
        const totalTime = resolved.reduce((sum, ticket) => {
            return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
        }, 0);
        return Math.round(totalTime / resolved.length / (1000 * 60 * 60));
    }
    calculateSlaCompliance(tickets) {
        if (tickets.length === 0)
            return 0;
        const compliant = tickets.filter((ticket) => {
            if (ticket.resolvedAt) {
                return ticket.resolvedAt <= ticket.slaDeadline;
            }
            return new Date() <= ticket.slaDeadline;
        }).length;
        return (compliant / tickets.length) * 100;
    }
    calculatePerformanceScore(metrics) {
        const resolutionWeight = 0.4;
        const slaWeight = 0.4;
        const articlesWeight = 0.2;
        const normalizedArticles = Math.min(metrics.articlesPublished * 10, 100);
        return Math.round(metrics.resolutionRate * resolutionWeight +
            metrics.slaCompliance * slaWeight +
            normalizedArticles * articlesWeight);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map