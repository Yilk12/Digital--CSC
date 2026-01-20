import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateHelpdeskDto } from "./dto/create-helpdesk.dto"
import { UpdateHelpdeskDto } from "./dto/update-helpdesk.dto"
import { UserRole, TicketStatus, TicketPriority } from "@prisma/client"

@Injectable()
export class HelpdeskService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string, userRole: UserRole) {
    const where = this.buildWhereClause(userId, userRole)
    
    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      overdueTickets,
      recentTickets,
      priorityDistribution,
      statusDistribution,
      avgResolutionTime
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: { not: TicketStatus.RESOLVED } } }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.prisma.ticket.count({
        where: {
          ...where,
          slaDeadline: { lt: new Date() },
          status: { not: TicketStatus.RESOLVED }
        }
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
    ])

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
    }
  }

  async getTicketMetrics(userId: string, userRole: UserRole, period: string) {
    const where = this.buildWhereClause(userId, userRole)
    const dateRange = this.getDateRange(period)
    
    const metricsWhere = {
      ...where,
      createdAt: { gte: dateRange.start, lte: dateRange.end }
    }

    const [
      createdCount,
      resolvedCount,
      avgResolutionTime,
      firstResponseTime,
      customerSatisfaction,
      slaCompliance
    ] = await Promise.all([
      this.prisma.ticket.count({ where: metricsWhere }),
      this.prisma.ticket.count({ 
        where: { ...metricsWhere, status: TicketStatus.RESOLVED }
      }),
      this.calculateAverageResolutionTime(metricsWhere),
      this.calculateAverageFirstResponseTime(metricsWhere),
      this.calculateCustomerSatisfaction(metricsWhere),
      this.calculateSlaCompliance(metricsWhere)
    ])

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
    }
  }

  async getSlaPerformance(userId: string, userRole: UserRole, departmentId?: string) {
    const where = this.buildWhereClause(userId, userRole)
    if (departmentId) where.departmentId = departmentId

    const [withinSla, breachedSla, totalTickets] = await Promise.all([
      this.prisma.ticket.count({
        where: {
          ...where,
          OR: [
            { status: TicketStatus.RESOLVED, resolvedAt: { lte: this.prisma.ticket.fields.slaDeadline } },
            { status: { notIn: [TicketStatus.RESOLVED, TicketStatus.PENDING] }, slaDeadline: { gte: new Date() } }
          ]
        }
      }),
      this.prisma.ticket.count({
        where: {
          ...where,
          OR: [
            { status: TicketStatus.RESOLVED, resolvedAt: { gt: this.prisma.ticket.fields.slaDeadline } },
            { status: { notIn: [TicketStatus.RESOLVED, TicketStatus.PENDING] }, slaDeadline: { lt: new Date() } }
          ]
        }
      }),
      this.prisma.ticket.count({ where })
    ])

    const slaPerformance = totalTickets > 0 ? (withinSla / totalTickets * 100).toFixed(2) : '0'

    return {
      withinSla,
      breachedSla,
      totalTickets,
      slaPerformance: parseFloat(slaPerformance)
    }
  }

  async getAgentPerformance() {
    const agents = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.SUPPORT_AGENT, UserRole.Department_Head] } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    })

    const performance = await Promise.all(
      agents.map(async (agent) => {
        const [assigned, resolved, avgResolutionTime, customerRating] = await Promise.all([
          this.prisma.ticket.count({ where: { assigneeId: agent.id } }),
          this.prisma.ticket.count({ 
            where: { assigneeId: agent.id, status: TicketStatus.RESOLVED }
          }),
          this.calculateAverageResolutionTime({ assigneeId: agent.id }),
          this.calculateAgentRating(agent.id)
        ])

        return {
          agent,
          metrics: {
            assignedTickets: assigned,
            resolvedTickets: resolved,
            resolutionRate: assigned > 0 ? (resolved / assigned * 100).toFixed(2) : 0,
            avgResolutionTime,
            customerRating
          }
        }
      })
    )

    return performance
  }

  async getTicketTrends(userId: string, userRole: UserRole, period: string, groupBy: string) {
    const where = this.buildWhereClause(userId, userRole)
    const dateRange = this.getDateRange(period)
    
    // This would need more complex SQL for proper time-based grouping
    // For now, returning a simplified version
    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        createdAt: { gte: dateRange.start, lte: dateRange.end }
      },
      select: {
        createdAt: true,
        status: true,
        priority: true
      },
      orderBy: { createdAt: "asc" }
    })

    // Group tickets by the specified time period
    const trends = this.groupTicketsByTime(tickets, groupBy)
    
    return {
      period,
      groupBy,
      trends
    }
  }

  async getWorkloadDistribution() {
    const distribution = await this.prisma.ticket.groupBy({
      by: ["assigneeId"],
      _count: { assigneeId: true },
      where: {
        status: { not: TicketStatus.RESOLVED }
      }
    })

    const workload = await Promise.all(
      distribution.map(async (item) => {
        if (!item.assigneeId) return null
        
        const agent = await this.prisma.user.findUnique({
          where: { id: item.assigneeId },
          select: { firstName: true, lastName: true, email: true }
        })

        return {
          agent,
          activeTickets: item._count.assigneeId
        }
      })
    )

    return workload.filter(Boolean)
  }

  async getSatisfactionMetrics(period: string) {
    const dateRange = this.getDateRange(period)
    
    // Using ArticleFeedback as proxy for satisfaction (isLike boolean)
    const satisfaction = await this.prisma.articleFeedback.groupBy({
      by: ["isLike"],
      _count: { isLike: true },
      where: {
        createdAt: { gte: dateRange.start, lte: dateRange.end }
      }
    })

    const totalFeedback = satisfaction.reduce((sum, item) => sum + (item._count?.isLike || 0), 0)
    const likes = satisfaction.find(item => item.isLike)?._count?.isLike || 0
    const avgRating = totalFeedback > 0 ? (likes / totalFeedback * 100) : 0

    return {
      period,
      totalFeedback,
      averageRating: avgRating || 0,
      distribution: satisfaction
    }
  }

  async getEscalationStats(userId: string, userRole: UserRole) {
    const where = this.buildWhereClause(userId, userRole)
    
    const escalated = await this.prisma.ticket.count({
      where: {
        ...where,
        priority: TicketPriority.URGENT,
        // Add escalation logic based on your business rules
      }
    })

    return {
      escalatedTickets: escalated,
      // Add more escalation metrics as needed
    }
  }

  async getDepartmentStats(userId: string, userRole: UserRole) {
    const where = this.buildWhereClause(userId, userRole)
    
    const departmentStats = await this.prisma.ticket.groupBy({
      by: ["departmentId"],
      where,
      _count: { departmentId: true }
    })

    const stats = await Promise.all(
      departmentStats.map(async (stat) => {
        const department = await this.prisma.department.findUnique({
          where: { id: stat.departmentId || '' },
          select: { name: true }
        })

        return {
          department: department?.name || "Unknown",
          ticketCount: stat._count.departmentId
        }
      })
    )

    return stats
  }

  async getQueueStatus(userId: string, userRole: UserRole) {
    const where = this.buildWhereClause(userId, userRole)
    
    const [unassigned, inProgress, pending, overdue] = await Promise.all([
      this.prisma.ticket.count({
        where: { ...where, assigneeId: null, status: { not: TicketStatus.RESOLVED } }
      }),
      this.prisma.ticket.count({
        where: { ...where, status: TicketStatus.IN_PROGRESS }
      }),
      this.prisma.ticket.count({
        where: { ...where, status: TicketStatus.PENDING }
      }),
      this.prisma.ticket.count({
        where: {
          ...where,
          slaDeadline: { lt: new Date() },
          status: { not: TicketStatus.RESOLVED }
        }
      })
    ])

    return {
      unassigned,
      inProgress,
      pending,
      overdue
    }
  }

  async getOverdueTickets(userId: string, userRole: UserRole, limit: number) {
    const where = this.buildWhereClause(userId, userRole)
    
    return this.prisma.ticket.findMany({
      where: {
        ...where,
        slaDeadline: { lt: new Date() },
        status: { not: TicketStatus.RESOLVED }
      },
      take: limit,
      orderBy: { slaDeadline: "asc" },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        assignee: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } }
      }
    })
  }

  async getRecentActivity(userId: string, userRole: UserRole, limit: number) {
    const where = this.buildWhereClause(userId, userRole)
    
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
    })
  }

  async exportData(format: string, type: string, userId: string) {
    // Implementation for data export
    // This would typically generate CSV, Excel, or PDF files
    return {
      message: `Export initiated for ${type} in ${format} format`,
      downloadUrl: `/api/helpdesk/download/${type}-${Date.now()}.${format}`
    }
  }

  // Helper methods
  private buildWhereClause(userId: string, userRole: UserRole) {
    const where: any = {}
    
    if (userRole === UserRole.END_USER) {
      where.createdById = userId
    } else if (userRole === UserRole.SUPPORT_AGENT) {
      where.OR = [{ createdById: userId }, { assigneeId: userId }]
    }
    
    return where
  }

  private getDateRange(period: string) {
    const now = new Date()
    const start = new Date()
    
    switch (period) {
      case "day":
        start.setDate(now.getDate() - 1)
        break
      case "week":
        start.setDate(now.getDate() - 7)
        break
      case "month":
        start.setMonth(now.getMonth() - 1)
        break
      case "3months":
        start.setMonth(now.getMonth() - 3)
        break
      case "year":
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setMonth(now.getMonth() - 1)
    }
    
    return { start, end: now }
  }

  private formatGroupByResults(results: any[], field: string) {
    return results.reduce((acc, item) => {
      acc[item[field]] = item._count[field]
      return acc
    }, {})
  }

  private async calculateAverageResolutionTime(where: any): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: TicketStatus.RESOLVED,
        resolvedAt: { not: null }
      },
      select: { createdAt: true, resolvedAt: true }
    })

    if (resolvedTickets.length === 0) return 0

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
      return sum + resolutionTime
    }, 0)

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)) // Convert to hours
  }

  private async calculateAverageFirstResponseTime(where: any): Promise<number> {
    // Implementation for first response time calculation
    return 0 // Placeholder
  }

  private async calculateCustomerSatisfaction(where: any): Promise<number> {
    // Implementation for customer satisfaction calculation
    return 0 // Placeholder
  }

  private async calculateSlaCompliance(where: any): Promise<number> {
    // Implementation for SLA compliance calculation
    return 0 // Placeholder
  }

  private async calculateAgentRating(agentId: string): Promise<number> {
    // Implementation for agent rating calculation
    return 0 // Placeholder
  }

  private groupTicketsByTime(tickets: any[], groupBy: string) {
    // Implementation for grouping tickets by time period
    return [] // Placeholder
  }
}
