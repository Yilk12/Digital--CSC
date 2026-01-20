import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { TicketStatus, UserRole, Prisma } from "@prisma/client"

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateTicketReport(
    startDate: Date,
    endDate: Date,
    format: "json" | "csv" = "json",
    userRole?: UserRole,
    userId?: string,
  ) {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Apply role-based filtering
    if (userRole === UserRole.END_USER) {
      where.createdById = userId
    } else if (userRole === UserRole.SUPPORT_AGENT) {
      where.OR = [{ createdById: userId }, { assigneeId: userId }]
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
    })

    const reportData = tickets.map((ticket) => ({
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
      assigneeEmail: ticket.assignee?.email,
      department: ticket.department?.name,
      commentsCount: ticket._count.comments,
      attachmentsCount: ticket._count.attachments,
      resolutionTime: ticket.resolvedAt
        ? Math.round((ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60))
        : null,
      slaCompliant: ticket.resolvedAt ? ticket.resolvedAt <= ticket.slaDeadline! : new Date() <= ticket.slaDeadline!,
    }))

    if (format === "csv") {
      return this.convertToCSV(reportData)
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
    }
  }

  async generateKnowledgeBaseReport(
    startDate: Date,
    endDate: Date,
    format: "json" | "csv" = "json",
    userRole?: UserRole,
    userId?: string,
  ) {
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: {
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
    })

    const reportData = articles.map((article) => ({
      id: article.id,
      title: article.title,
      titleAm: article.titleAm,
      status: article.status,
      language: article.language,
      createdAt: article.createdAt,
      publishedAt: article.publishedAt,
      expiresAt: article.expiresAt,
      category: article.category?.name,
      tags: article.tags.map((at) => at.tag.name).join(", "),
      viewCount: article.viewCount,
      likeCount: article.likeCount,
      dislikeCount: article.dislikeCount,
      commentsCount: article._count.comments,
      feedbackCount: article._count.feedback,
      engagementRate:
        article.viewCount > 0 ? ((article.likeCount + article._count.comments) / article.viewCount) * 100 : 0,
    }))

    if (format === "csv") {
      return this.convertToCSV(reportData)
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
    }
  }

  async generateUserReport(startDate: Date, endDate: Date, format: "json" | "csv" = "json") {
    const users: Prisma.UserGetPayload<{
      include: {
        _count: {
          select: {
            createdTickets: true
            assignedTickets: true
            comments: true
            articleComments: true
          }
        }
      }
    }>[] = await this.prisma.user.findMany({
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
            comments: true,
            articleComments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })


    const reportData = users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      userType: user.userType,
      department: user.departmentId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      ticketsCreated: user._count.createdTickets,
      ticketsAssigned: user._count.assignedTickets,
      articlesCreated: 0,
      ticketComments: user._count.comments,
      articleComments: user._count.articleComments,
      totalActivity:
        user._count.createdTickets +
        user._count.assignedTickets +
        user._count.comments +
        user._count.articleComments,
    }))

    if (format === "csv") {
      return this.convertToCSV(reportData)
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
    }
  }

  async generatePerformanceReport(startDate: Date, endDate: Date, format: "json" | "csv" = "json") {
    const agents = await this.prisma.user.findMany({
      where: {
        role: UserRole.SUPPORT_AGENT,
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
      },
    })

    const reportData = agents.map((agent) => {
      const tickets = agent.assignedTickets
      const resolvedTickets = tickets.filter((t) => t.status === TicketStatus.RESOLVED)

      const avgResolutionTime =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((sum, ticket) => {
              if (ticket.resolvedAt) {
                return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime())
              }
              return sum
            }, 0) /
            resolvedTickets.length /
            (1000 * 60 * 60)
          : 0

      const slaCompliant = tickets.filter((ticket) => {
        if (ticket.status === TicketStatus.RESOLVED && ticket.resolvedAt) {
          return ticket.resolvedAt <= ticket.slaDeadline!
        }
        return new Date() <= ticket.slaDeadline!
      }).length

      return {
        id: agent.id,
        name: `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        department: agent.departmentId,
        ticketsAssigned: tickets.length,
        ticketsResolved: resolvedTickets.length,
        resolutionRate: tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0,
        avgResolutionTime: Math.round(avgResolutionTime),
        slaCompliance: tickets.length > 0 ? (slaCompliant / tickets.length) * 100 : 0,
        articlesCreated: 0,
        articlesPublished: 0,
        totalArticleViews: 0,
        totalArticleLikes: 0,
        performanceScore: this.calculatePerformanceScore({
          resolutionRate: tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0,
          slaCompliance: tickets.length > 0 ? (slaCompliant / tickets.length) * 100 : 0,
          articlesPublished: 0,
        }),
      }
    })

    if (format === "csv") {
      return this.convertToCSV(reportData)
    }

    return {
      data: reportData,
      summary: {
        totalAgents: agents.length,
        avgResolutionRate: reportData.reduce((sum, a) => sum + a.resolutionRate, 0) / reportData.length,
        avgSlaCompliance: reportData.reduce((sum, a) => sum + a.slaCompliance, 0) / reportData.length,
        topPerformers: reportData.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5),
      },
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ""

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            // Escape commas and quotes in CSV
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          })
          .join(","),
      ),
    ].join("\n")

    return csvContent
  }

  private groupBy(array: any[], field: string) {
    return array.reduce((acc, item) => {
      const key = item[field]
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  }

  private calculateAvgResolutionTime(tickets: any[]): number {
    const resolved = tickets.filter((t) => t.resolvedAt)
    if (resolved.length === 0) return 0

    const totalTime = resolved.reduce((sum, ticket) => {
      return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime())
    }, 0)

    return Math.round(totalTime / resolved.length / (1000 * 60 * 60))
  }

  private calculateSlaCompliance(tickets: any[]): number {
    if (tickets.length === 0) return 0

    const compliant = tickets.filter((ticket) => {
      if (ticket.resolvedAt) {
        return ticket.resolvedAt <= ticket.slaDeadline
      }
      return new Date() <= ticket.slaDeadline
    }).length

    return (compliant / tickets.length) * 100
  }

  private calculatePerformanceScore(metrics: {
    resolutionRate: number
    slaCompliance: number
    articlesPublished: number
  }): number {
    // Weighted performance score
    const resolutionWeight = 0.4
    const slaWeight = 0.4
    const articlesWeight = 0.2

    const normalizedArticles = Math.min(metrics.articlesPublished * 10, 100) // Cap at 100

    return Math.round(
      metrics.resolutionRate * resolutionWeight +
        metrics.slaCompliance * slaWeight +
        normalizedArticles * articlesWeight,
    )
  }
}
