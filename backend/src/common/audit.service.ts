import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async logAction(action: string, entity: string, entityId: string, userId?: string, oldValues?: any, newValues?: any) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      },
    })
  }

  async getAuditLogs(entityType?: string, entityId?: string, userId?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit
    const where: any = {}

    if (entityType) where.entity = entityType
    if (entityId) where.entityId = entityId
    if (userId) where.userId = userId

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
    ])

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async getEntityHistory(entityType: string, entityId: string) {
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
    })
  }

  async getUserActivity(userId: string, days = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  async getSystemActivity(days = 7) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

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
    ])

    return {
      totalActions,
      actionsByType: actionsByType.reduce((acc, item) => {
        acc[item.action] = item._count.action
        return acc
      }, {}),
      actionsByUser: actionsByUser.reduce((acc, item) => {
        acc[item.userId!] = item._count.userId
        return acc
      }, {}),
      recentActions,
    }
  }
}
