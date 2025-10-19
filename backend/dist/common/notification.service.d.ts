import { PrismaService } from "../prisma/prisma.service";
import { LocalizationService } from "./localization.service";
import { Language } from "@prisma/client";
export declare class NotificationService {
    private prisma;
    private localizationService;
    constructor(prisma: PrismaService, localizationService: LocalizationService);
    createNotification(userId: string, title: string, message: string, type: string, language?: Language): Promise<any>;
    getNotifications(userId: string, page?: number, limit?: number): Promise<{
        notifications: any;
        pagination: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    markAsRead(notificationId: string, userId: string): Promise<any>;
    markAllAsRead(userId: string): Promise<any>;
    getUnreadCount(userId: string): Promise<number>;
    deleteNotification(notificationId: string, userId: string): Promise<any>;
    deleteOldNotifications(daysOld?: number): Promise<any>;
    notifyTicketCreated(ticketId: string, creatorId: string, assigneeId?: string): Promise<void>;
    notifyTicketStatusChanged(ticketId: string, oldStatus: string, newStatus: string): Promise<void>;
    notifyArticlePublished(articleId: string): Promise<void>;
}
