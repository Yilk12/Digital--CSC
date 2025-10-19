import { Injectable } from "@nestjs/common"
import  { PrismaService } from "../prisma/prisma.service"
import { TicketStatus, UserRole, ArticleStatus } from "@prisma/client"

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardOverview(userRole?: UserRole, userId?: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))

    // Build base filters based on user role
    const ticketWhere: any = {}
    const articleWhere: any = {}

    if (userRole === UserRole.END_USER) {
      ticketWhere.createdById = userId
    } else if (userRole === UserRole.SUPPORT_AGENT) {
      ticketWhere.OR = [{ createdById: userId }, { assigneeId: userId }]
      articleWhere.authorId = userId
    }

    const [
      // Ticket metrics
      totalTickets,
      openTickets,
      resolvedTickets,
      overdueTickets,
      ticketsThisMonth,
      ticketsThisWeek,
      avgResolutionTime,

      // Knowledge base metrics
      totalArticles,
      publishedArticles,
      totalViews,
      articlesThisMonth,

      // User metrics
      totalUsers,
      activeUsers,

      // Recent activity
      recentTickets,
      recentArticles,

      // Performance metrics
      agentPerformance,
    ] = await Promise.all([
      // Ticket metrics
      this.prisma.ticket.count({ where: ticketWhere }),
      this.prisma.ticket.count({
        where: { ...ticketWhere, status: TicketStatus.OPEN },
      }),
      this.prisma.ticket.count({
        where: { ...ticketWhere, status: TicketStatus.RESOLVED },
      }),
      this.prisma.ticket.count({
        where: {
          ...ticketWhere,
          slaDeadline: { lt: new Date() },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      }),
      this.prisma.ticket.count({
        where: { ...ticketWhere, createdAt: { gte: startOfMonth } },
      }),
      this.prisma.ticket.count({
        where: { ...ticketWhere, createdAt: { gte: startOfWeek } },
      }),
      this.calculateAvgResolutionTime(ticketWhere),

      // Knowledge base metrics
      this.prisma.article.count({ where: articleWhere }),
      this.prisma.article.count({
        where: { ...articleWhere, status: ArticleStatus.PUBLISHED },
      }),
      this.prisma.article.aggregate({
        where: articleWhere,
        _sum: { viewCount: true },
      }),
      this.prisma.article.count({
        where: { ...articleWhere, createdAt: { gte: startOfMonth } },
      }),

      // User metrics (admin only)
      userRole === UserRole.ADMIN || userRole === UserRole.GENERAL_DIRECTOR ? this.prisma.user.count() : 0,
      userRole === UserRole.ADMIN || userRole === UserRole.GENERAL_DIRECTOR
        ? this.prisma.user.count({ where: { isActive: true } })
        : 0,

      // Recent activity
      this.prisma.ticket.findMany({
        where: ticketWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          creator: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.article.findMany({
        where: articleWhere,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          viewCount: true,
          createdAt: true,
          author: {
            select: { firstName: true, lastName: true },
          },
        },
      }),

      // Agent performance (for managers and admins)
      userRole === UserRole.ADMIN || userRole === UserRole.GENERAL_DIRECTOR || userRole === UserRole.STAFF_MANAGER
        ? this.getAgentPerformanceMetrics()
        : [],
    ])

    return {
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        overdue: overdueTickets,
        thisMonth: ticketsThisMonth,
        thisWeek: ticketsThisWeek,
        avgResolutionTime,
      },
      knowledgeBase: {
        total: totalArticles,
        published: publishedArticles,
        totalViews: totalViews._sum.viewCount || 0,
        thisMonth: articlesThisMonth,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      recentActivity: {
        tickets: recentTickets,
        articles: recentArticles,
      },
      agentPerformance,
    }
  }

  async getTicketAnalytics(startDate?: Date, endDate?: Date, userRole?: UserRole, userId?: string) {
    const where: any = {}

    if (userRole === UserRole.END_USER) {
      where.createdById = userId
    } else if (userRole === UserRole.SUPPORT_AGENT) {
      where.OR = [{ createdById: userId }, { assigneeId: userId }]
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [byStatus, byPriority, byCategory, byDepartment, dailyTrend, resolutionTimes, slaCompliance] =
      await Promise.all([
        this.prisma.ticket.groupBy({
          by: ["status"],
          where,
          _count: { status: true },
        }),
        this.prisma.ticket.groupBy({
          by: ["priority"],
          where,
          _count: { priority: true },
        }),
        this.prisma.ticket.groupBy({
          by: ["category"],
          where,
          _count: { category: true },
        }),
        this.prisma.ticket.groupBy({
          by: ["departmentId"],
          where: { ...where, departmentId: { not: null } },
          _count: { departmentId: true },
        }),
        this.getTicketDailyTrend(where, startDate, endDate),
        this.getResolutionTimeAnalytics(where),
        this.getSlaComplianceMetrics(where),
      ])

    return {
      byStatus: this.formatGroupByResults(byStatus, "status"),
      byPriority: this.formatGroupByResults(byPriority, "priority"),
      byCategory: this.formatGroupByResults(byCategory, "category"),
      byDepartment: this.formatGroupByResults(byDepartment, "departmentId"),
      dailyTrend,
      resolutionTimes,
      slaCompliance,
    }
  }

  async getKnowledgeBaseAnalytics(startDate?: Date, endDate?: Date, userRole?: UserRole, userId?: string) {
    const where: any = {}

    if (userRole === UserRole.SUPPORT_AGENT) {
      where.authorId = userId
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      }
    }

    const [byStatus, byLanguage, byCategory, viewTrends, topArticles, engagementMetrics] = await Promise.all([
      this.prisma.article.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      this.prisma.article.groupBy({
        by: ["language"],
        where,
        _count: { language: true },
      }),
      this.prisma.article.groupBy({
        by: ["categoryId"],
        where: { ...where, categoryId: { not: null } },
        _count: { categoryId: true },
      }),
      this.getArticleViewTrends(where, startDate, endDate),
      this.getTopArticles(where),
      this.getEngagementMetrics(where),
    ])

    return {
      byStatus: this.formatGroupByResults(byStatus, "status"),
      byLanguage: this.formatGroupByResults(byLanguage, "language"),
      byCategory: this.formatGroupByResults(byCategory, "categoryId"),
      viewTrends,
      topArticles,
      engagementMetrics,
    }
  }

  async getUserAnalytics() {
    const [byRole, byUserType, byDepartment, registrationTrend, activityMetrics] = await Promise.all([
      this.prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
      this.prisma.user.groupBy({
        by: ["userType"],
        _count: { userType: true },
      }),
      this.prisma.user.groupBy({
        by: ["department"],
        where: { department: { not: null } },
        _count: { department: true },
      }),
      this.getUserRegistrationTrend(),
      this.getUserActivityMetrics(),
    ])

    return {
      byRole: this.formatGroupByResults(byRole, "role"),
      byUserType: this.formatGroupByResults(byUserType, "userType"),
      byDepartment: this.formatGroupByResults(byDepartment, "department"),
      registrationTrend,
      activityMetrics,
    }
  }

  private async calculateAvgResolutionTime(where: any): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: TicketStatus.RESOLVED,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    })

    if (resolvedTickets.length === 0) return 0

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
      return sum + resolutionTime
    }, 0)

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)) // Convert to hours
  }

  private async getAgentPerformanceMetrics() {
    const agents = await this.prisma.user.findMany({
      where: { role: UserRole.SUPPORT_AGENT, isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedTickets: {
          select: {
            id: true,
            status: true,
            priority: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
      },
    })

    return agents.map((agent) => {
      const tickets = agent.assignedTickets
      const resolved = tickets.filter((t) => t.status === TicketStatus.RESOLVED)
      const avgResolutionTime =
        resolved.length > 0
          ? resolved.reduce((sum, ticket) => {
              if (ticket.resolvedAt) {
                return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime())
              }
              return sum
            }, 0) /
            resolved.length /
            (1000 * 60 * 60) // Convert to hours
          : 0

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        totalTickets: tickets.length,
        resolvedTickets: resolved.length,
        resolutionRate: tickets.length > 0 ? (resolved.length / tickets.length) * 100 : 0,
        avgResolutionTime: Math.round(avgResolutionTime),
      }
    })
  }

  private async getTicketDailyTrend(where: any, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate || new Date()

    const tickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Group by date
    const dailyData: { [key: string]: { created: number; resolved: number } } = {}

    tickets.forEach((ticket) => {
      const date = ticket.createdAt.toISOString().split("T")[0]
      if (!dailyData[date]) {
        dailyData[date] = { created: 0, resolved: 0 }
      }
      dailyData[date].created++
      if (ticket.status === TicketStatus.RESOLVED) {
        dailyData[date].resolved++
      }
    })

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      ...data,
    }))
  }

  private async getResolutionTimeAnalytics(where: any) {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: TicketStatus.RESOLVED,
        resolvedAt: { not: null },
      },
      select: {
        priority: true,
        createdAt: true,
        resolvedAt: true,
      },
    })

    const byPriority: { [key: string]: number[] } = {}

    resolvedTickets.forEach((ticket) => {
      const resolutionTime = (ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60)
      if (!byPriority[ticket.priority]) {
        byPriority[ticket.priority] = []
      }
      byPriority[ticket.priority].push(resolutionTime)
    })

    return Object.entries(byPriority).map(([priority, times]) => ({
      priority,
      avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      count: times.length,
    }))
  }

  private async getSlaComplianceMetrics(where: any) {
    const tickets = await this.prisma.ticket.findMany({
      where,
      select: {
        priority: true,
        createdAt: true,
        resolvedAt: true,
        slaDeadline: true,
        status: true,
      },
    })

    const compliance = {
      total: tickets.length,
      compliant: 0,
      breached: 0,
      byPriority: {} as { [key: string]: { total: number; compliant: number; breached: number } },
    }

    tickets.forEach((ticket) => {
      const isResolved = ticket.status === TicketStatus.RESOLVED && ticket.resolvedAt
      const isCompliant = isResolved ? ticket.resolvedAt! <= ticket.slaDeadline! : new Date() <= ticket.slaDeadline!

      if (isCompliant) {
        compliance.compliant++
      } else {
        compliance.breached++
      }

      if (!compliance.byPriority[ticket.priority]) {
        compliance.byPriority[ticket.priority] = { total: 0, compliant: 0, breached: 0 }
      }

      compliance.byPriority[ticket.priority].total++
      if (isCompliant) {
        compliance.byPriority[ticket.priority].compliant++
      } else {
        compliance.byPriority[ticket.priority].breached++
      }
    })

    return compliance
  }

  private async getArticleViewTrends(where: any, startDate?: Date, endDate?: Date) {
    // This would require view tracking implementation
    // For now, return mock data structure
    return []
  }

  private async getTopArticles(where: any) {
    return this.prisma.article.findMany({
      where,
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        language: true,
        author: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { viewCount: "desc" },
      take: 10,
    })
  }

  private async getEngagementMetrics(where: any) {
    const articles = await this.prisma.article.findMany({
      where,
      select: {
        viewCount: true,
        likeCount: true,
        dislikeCount: true,
        _count: {
          select: { comments: true },
        },
      },
    })

    const totalViews = articles.reduce((sum, a) => sum + a.viewCount, 0)
    const totalLikes = articles.reduce((sum, a) => sum + a.likeCount, 0)
    const totalDislikes = articles.reduce((sum, a) => sum + a.dislikeCount, 0)
    const totalComments = articles.reduce((sum, a) => sum + a._count.comments, 0)

    return {
      totalViews,
      totalLikes,
      totalDislikes,
      totalComments,
      avgViewsPerArticle: articles.length > 0 ? totalViews / articles.length : 0,
      engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0,
    }
  }

  private async getUserRegistrationTrend() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        createdAt: true,
      },
    })

    const dailyData: { [key: string]: number } = {}

    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0]
      dailyData[date] = (dailyData[date] || 0) + 1
    })

    return Object.entries(dailyData).map(([date, count]) => ({
      date,
      count,
    }))
  }

  private async getUserActivityMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [ticketCreators, articleAuthors, commenters] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdById: true },
        distinct: ["createdById"],
      }),
      this.prisma.article.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
      this.prisma.ticketComment.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { authorId: true },
        distinct: ["authorId"],
      }),
    ])

    return {
      activeTicketCreators: ticketCreators.length,
      activeArticleAuthors: articleAuthors.length,
      activeCommenters: commenters.length,
    }
  }

  private formatGroupByResults(results: any[], field: string) {
    return results.reduce((acc, item) => {
      acc[item[field]] = item._count[field]
      return acc
    }, {})
  }
}
