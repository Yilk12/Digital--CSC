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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const localization_service_1 = require("./localization.service");
const client_1 = require("@prisma/client");
let NotificationService = class NotificationService {
    constructor(prisma, localizationService) {
        this.prisma = prisma;
        this.localizationService = localizationService;
    }
    async createNotification(userId, title, message, type, language = client_1.Language.EN) {
        return this.prisma.notification.create({
            data: {
                userId,
                title: this.localizationService.translate(title, language),
                message: this.localizationService.translate(message, language),
                type,
            },
        });
    }
    async getNotifications(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);
        return {
            notifications,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async markAsRead(notificationId, userId) {
        return this.prisma.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    async deleteNotification(notificationId, userId) {
        return this.prisma.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    }
    async deleteOldNotifications(daysOld = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        return this.prisma.notification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
                isRead: true,
            },
        });
    }
    async notifyTicketCreated(ticketId, creatorId, assigneeId) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { creator: true },
        });
        if (!ticket)
            return;
        if (assigneeId) {
            await this.createNotification(assigneeId, "ticket.assigned.title", `New ticket "${ticket.title}" has been assigned to you`, "TICKET_ASSIGNED");
        }
        const admins = await this.prisma.user.findMany({
            where: { role: "ADMIN", isActive: true },
            select: { id: true },
        });
        for (const admin of admins) {
            await this.createNotification(admin.id, "ticket.created.title", `New ticket "${ticket.title}" created by ${ticket.creator.firstName} ${ticket.creator.lastName}`, "TICKET_CREATED");
        }
    }
    async notifyTicketStatusChanged(ticketId, oldStatus, newStatus) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: ticketId },
            include: { creator: true, assignee: true },
        });
        if (!ticket)
            return;
        const message = `Ticket "${ticket.title}" status changed from ${oldStatus} to ${newStatus}`;
        await this.createNotification(ticket.createdById, "ticket.status.changed.title", message, "TICKET_STATUS_CHANGED");
        if (ticket.assigneeId && ticket.assigneeId !== ticket.createdById) {
            await this.createNotification(ticket.assigneeId, "ticket.status.changed.title", message, "TICKET_STATUS_CHANGED");
        }
    }
    async notifyArticlePublished(articleId) {
        var _a;
        const article = await this.prisma.article.findUnique({
            where: { id: articleId },
            include: { author: true, category: true },
        });
        if (!article)
            return;
        const users = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true },
        });
        const message = `New article "${article.title}" published in ${((_a = article.category) === null || _a === void 0 ? void 0 : _a.name) || "General"}`;
        for (const user of users) {
            if (user.id !== article.authorId) {
                await this.createNotification(user.id, "article.published.title", message, "ARTICLE_PUBLISHED");
            }
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        localization_service_1.LocalizationService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map