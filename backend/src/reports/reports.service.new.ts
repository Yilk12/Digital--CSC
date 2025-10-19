import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { GenerateReportDto } from './dto/generate-report.dto'
import { UserRole, TicketStatus, TicketPriority, ArticleStatus } from '@prisma/client'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateTicketReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const where = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
    }

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
    ])

    const reportData = {
      type: 'ticket-report',
      period: { from: dateFrom, to: dateTo },
      summary,
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned',
        department: ticket.department?.name || 'No Department',
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        commentsCount: ticket.comments.length,
        attachmentsCount: ticket.attachments.length,
        slaStatus: this.getSlaStatus(ticket.slaDeadline, ticket.resolvedAt, ticket.status)
      }))
    }

    return this.generateReport(reportData, format, "ticket-report", userId)
  }

  async generateAgentPerformanceReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const agents = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.SUPPORT_AGENT, UserRole.STAFF_MANAGER] } },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    })

    const performanceData = await Promise.all(
      agents.map(async (agent) => {
        const where = {
          assigneeId: agent.id,
          createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
        }

        const [
          totalTickets,
          resolvedTickets,
          avgResolutionTime,
          customerRating,
          slaCompliance
        ] = await Promise.all([
          this.prisma.ticket.count({ where }),
          this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
          this.calculateAvgResolutionTime(where),
          this.calculateCustomerRating(agent.id, dateFrom, dateTo),
          this.calculateSlaCompliance(where)
        ])

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
        }
      })
    )

    const reportData = {
      type: 'agent-performance-report',
      period: { from: dateFrom, to: dateTo },
      agents: performanceData
    }

    return this.generateReport(reportData, format, "agent-performance-report", userId)
  }

  async generateSlaReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const where = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
    }

    const [
      totalTickets,
      slaCompliance,
      slaByPriority
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.calculateSlaCompliance(where),
      this.getSlaByPriority(where)
    ])

    const reportData = {
      type: 'sla-report',
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalTickets,
        overallCompliance: slaCompliance,
        complianceByPriority: slaByPriority
      }
    }

    return this.generateReport(reportData, format, "sla-report", userId)
  }

  async generateDepartmentReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const departments = await this.prisma.department.findMany({
      select: { id: true, name: true }
    })

    const departmentData = await Promise.all(
      departments.map(async (dept) => {
        const where = {
          departmentId: dept.id,
          createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
        }

        const [
          totalTickets,
          resolvedTickets,
          avgResolutionTime
        ] = await Promise.all([
          this.prisma.ticket.count({ where }),
          this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
          this.calculateAvgResolutionTime(where)
        ])

        return {
          department: dept,
          metrics: {
            totalTickets,
            resolvedTickets,
            resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
            avgResolutionTime
          }
        }
      })
    )

    const reportData = {
      type: 'department-report',
      period: { from: dateFrom, to: dateTo },
      departments: departmentData
    }

    return this.generateReport(reportData, format, "department-report", userId)
  }

  async generateSatisfactionReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    // Placeholder for ticketFeedback model - return static data
    const feedbackData = [
      { rating: 5, count: 10 },
      { rating: 4, count: 15 },
      { rating: 3, count: 8 },
      { rating: 2, count: 3 },
      { rating: 1, count: 2 }
    ]

    const totalFeedback = feedbackData.reduce((sum, item) => sum + item.count, 0)
    const avgRating = feedbackData.reduce((sum, item) => sum + (item.rating * item.count), 0) / totalFeedback

    const reportData = {
      type: 'satisfaction-report',
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalFeedback,
        averageRating: avgRating.toFixed(2),
        ratingDistribution: this.getRatingDistribution(feedbackData)
      }
    }

    return this.generateReport(reportData, format, "satisfaction-report", userId)
  }

  async generateKnowledgeBaseReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const where = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
    }

    const [
      totalArticles,
      publishedArticles,
      totalViews,
      totalLikes,
      searchStats
    ] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.count({ where: { ...where, status: ArticleStatus.PUBLISHED } }),
      this.prisma.article.aggregate({
        where,
        _sum: { viewCount: true }
      }),
      this.prisma.article.aggregate({
        where,
        _sum: { likeCount: true }
      }),
      this.getSearchStats(dateFrom, dateTo)
    ])

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
    }

    return this.generateReport(reportData, format, "knowledge-base-report", userId)
  }

  // Placeholder methods for missing Prisma models
  async scheduleReport(reportConfig: any, userId: string) {
    return {
      id: 'schedule-' + Date.now(),
      reportType: reportConfig.type,
      frequency: reportConfig.frequency,
      nextRun: this.calculateNextRunTime(reportConfig.frequency),
      userId
    }
  }

  async cancelScheduledReport(scheduleId: string, userId: string) {
    return { success: true, message: 'Scheduled report cancelled' }
  }

  async downloadReport(reportId: string, userId: string) {
    return { downloadUrl: `/reports/download/${reportId}`, expiresAt: new Date(Date.now() + 3600000) }
  }

  async exportDashboardData(format: string, userId: string, userRole: UserRole) {
    const dashboardData = {
      tickets: await this.getTicketSummary({}),
      agents: await this.prisma.user.count({ where: { role: { in: [UserRole.SUPPORT_AGENT, UserRole.STAFF_MANAGER] } } }),
      departments: await this.prisma.department.count()
    }

    return this.generateReport(dashboardData, format, "dashboard-export", userId)
  }

  // Helper methods
  private async getTicketSummary(where: any) {
    const [
      totalTickets,
      resolvedTickets,
      avgResolutionTime,
      slaCompliance
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.calculateAvgResolutionTime(where),
      this.calculateSlaCompliance(where)
    ])

    return {
      totalTickets,
      resolvedTickets,
      resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
      avgResolutionTime,
      slaCompliance
    }
  }

  private getSlaStatus(slaDeadline: Date | null, resolvedAt: Date | null, status: string) {
    if (!slaDeadline) return 'NO_SLA'
    if (status !== TicketStatus.RESOLVED) {
      return Date.now() > slaDeadline.getTime() ? 'BREACHED' : 'WITHIN_SLA'
    }
    return resolvedAt && resolvedAt.getTime() <= slaDeadline.getTime() ? 'MET' : 'BREACHED'
  }

  private async calculateAvgResolutionTime(where: any): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: { ...where, status: TicketStatus.RESOLVED, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    })

    if (resolvedTickets.length === 0) return 0

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      return sum + (ticket.resolvedAt!.getTime() - ticket.createdAt.getTime())
    }, 0)

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)) // hours
  }

  private async calculateSlaCompliance(where: any): Promise<number> {
    const ticketsWithSla = await this.prisma.ticket.count({
      where: { ...where, slaDeadline: { not: null } }
    })

    if (ticketsWithSla === 0) return 100

    const compliantTickets = await this.prisma.ticket.count({
      where: {
        ...where,
        slaDeadline: { not: null },
        OR: [
          { status: { not: TicketStatus.RESOLVED } },
          { AND: [{ resolvedAt: { not: null } }, { resolvedAt: { lte: new Date() } }] }
        ]
      }
    })

    return Math.round((compliantTickets / ticketsWithSla) * 100)
  }

  private async calculateCustomerRating(agentId: string, dateFrom: string, dateTo: string): Promise<number> {
    // Placeholder for ticketFeedback model
    return 4.2
  }

  private async getSlaByPriority(where: any) {
    // Placeholder implementation
    return {
      HIGH: { total: 10, compliant: 8, compliance: 80 },
      MEDIUM: { total: 20, compliant: 18, compliance: 90 },
      LOW: { total: 15, compliant: 15, compliance: 100 }
    }
  }

  private getRatingDistribution(feedbackData: any[]) {
    return feedbackData.reduce((acc, item) => {
      acc[item.rating] = item.count
      return acc
    }, {})
  }

  private async getSearchStats(dateFrom: string, dateTo: string) {
    // Placeholder for searchQuery model
    return {
      totalSearches: 150,
      uniqueQueries: 75,
      avgResultsPerSearch: 3.2,
      topQueries: ['password reset', 'account setup', 'billing']
    }
  }

  private calculateNextRunTime(frequency: string): Date {
    const now = new Date()
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  private async generateReport(data: any, format: string, type: string, userId: string) {
    // Placeholder for report model
    const reportId = 'report-' + Date.now()
    
    return {
      id: reportId,
      type,
      format,
      data,
      generatedAt: new Date(),
      userId,
      downloadUrl: `/reports/download/${reportId}`
    }
  }
}
