import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { LocalizationService } from "./localization.service"
import { Language } from "@prisma/client"

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private localizationService: LocalizationService,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    language: Language = Language.EN,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        title: this.localizationService.translate(title, language),
        message: this.localizationService.translate(message, language),
        type,
      },
    })
  }

  async getNotifications(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ])

    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    })
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    })
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    })
  }

  async deleteOldNotifications(daysOld = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    return this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    })
  }

  // Notification templates for common events
  async notifyTicketCreated(ticketId: string, creatorId: string, assigneeId?: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { creator: true },
    })

    if (!ticket) return

    // Notify assignee if assigned
    if (assigneeId) {
      await this.createNotification(
        assigneeId,
        "ticket.assigned.title",
        `New ticket "${ticket.title}" has been assigned to you`,
        "TICKET_ASSIGNED",
      )
    }

    // Notify admins about new ticket
    const admins = await this.prisma.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    })

    for (const admin of admins) {
      await this.createNotification(
        admin.id,
        "ticket.created.title",
        `New ticket "${ticket.title}" created by ${ticket.creator.firstName} ${ticket.creator.lastName}`,
        "TICKET_CREATED",
      )
    }
  }

  async notifyTicketStatusChanged(ticketId: string, oldStatus: string, newStatus: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { creator: true, assignee: true },
    })

    if (!ticket) return

    const message = `Ticket "${ticket.title}" status changed from ${oldStatus} to ${newStatus}`

    // Notify creator
    await this.createNotification(ticket.createdById, "ticket.status.changed.title", message, "TICKET_STATUS_CHANGED")

    // Notify assignee if different from creator
    if (ticket.assigneeId && ticket.assigneeId !== ticket.createdById) {
      await this.createNotification(ticket.assigneeId, "ticket.status.changed.title", message, "TICKET_STATUS_CHANGED")
    }
  }

  async notifyArticlePublished(articleId: string) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true, category: true },
    })

    if (!article) return

    // Notify all active users about new published article
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    const message = `New article "${article.title}" published in ${article.category?.name || "General"}`

    for (const user of users) {
      if (user.id !== article.authorId) {
        await this.createNotification(user.id, "article.published.title", message, "ARTICLE_PUBLISHED")
      }
    }
  }
}
