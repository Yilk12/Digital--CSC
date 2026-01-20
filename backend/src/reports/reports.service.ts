import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { GenerateReportDto } from './dto/generate-report.dto'
import { Prisma, UserRole, TicketStatus, TicketPriority, ArticleStatus, ScheduleStatus, ReportFrequency } from '@prisma/client'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateTicketReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format, filters } = generateReportDto
    
    const where: any = {
      createdAt: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    }

    // Apply filters
    if (filters?.status) where.status = filters.status
    if (filters?.priority) where.priority = filters.priority
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.departmentId) where.departmentId = filters.departmentId
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId

    const [tickets, summary] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          creator: { select: { firstName: true, lastName: true, email: true } },
          assignee: { select: { firstName: true, lastName: true, email: true } },
          department: { select: { name: true } },
          comments: { select: { id: true } },
          attachments: { select: { id: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.getTicketSummary(where)
    ])

    const reportData = {
      title: 'Ticket Report',
      period: { from: dateFrom, to: dateTo },
      summary,
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        creator: `${ticket.creator.firstName} ${ticket.creator.lastName}`,
        assignee: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned',
        department: ticket.department?.name || 'N/A',
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        commentsCount: ticket.comments.length,
        attachmentsCount: ticket.attachments.length,
        slaStatus: this.getSlaStatus(ticket.slaDeadline, ticket.resolvedAt, ticket.status)
      }))
    }

    return this.generateReport(reportData, format, 'ticket-report', userId)
  }

  async generateAgentPerformanceReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const agents = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.SUPPORT_AGENT, UserRole.Department_Head] }, isActive: true },
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
          slaCompliance,
          customerRating
        ] = await Promise.all([
          this.prisma.ticket.count({ where }),
          this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
          this.calculateAvgResolutionTime(where),
          this.calculateSlaCompliance(where),
          this.calculateCustomerRating(agent.id, dateFrom, dateTo)
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
            slaCompliance,
            customerRating
          }
        }
      })
    )

    const reportData = {
      title: 'Agent Performance Report',
      period: { from: dateFrom, to: dateTo },
      agents: performanceData
    }

    return this.generateReport(reportData, format, 'agent-performance', userId)
  }

  async generateSlaReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const where = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) },
      slaDeadline: { not: null }
    }

    const [slaBreaches, slaByPriority] = await Promise.all([
      this.prisma.ticket.findMany({
        where: {
          ...where,
          OR: [
            { status: TicketStatus.RESOLVED, resolvedAt: { gt: this.prisma.ticket.fields.slaDeadline } },
            { status: { not: TicketStatus.RESOLVED }, slaDeadline: { lt: new Date() } }
          ]
        },
        include: {
          creator: { select: { firstName: true, lastName: true } },
          assignee: { select: { firstName: true, lastName: true } }
        }
      }),
      this.getSlaByPriority(where)
    ])

    const reportData = {
      title: 'SLA Report',
      period: { from: dateFrom, to: dateTo },
      breaches: slaBreaches.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        priority: ticket.priority,
        creator: `${ticket.creator.firstName} ${ticket.creator.lastName}`,
        assignee: ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned',
        slaDeadline: ticket.slaDeadline,
        status: ticket.status,
        breachTime: ticket.resolvedAt || new Date()
      })),
      byPriority: slaByPriority
    }

    return this.generateReport(reportData, format, 'sla-report', userId)
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
          avgResolutionTime,
          slaCompliance
        ] = await Promise.all([
          this.prisma.ticket.count({ where }),
          this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
          this.calculateAvgResolutionTime(where),
          this.calculateSlaCompliance(where)
        ])

        return {
          department: dept,
          metrics: {
            totalTickets,
            resolvedTickets,
            resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0,
            avgResolutionTime,
            slaCompliance
          }
        }
      })
    )

    const reportData = {
      title: 'Department Report',
      period: { from: dateFrom, to: dateTo },
      departments: departmentData
    }

    return this.generateReport(reportData, format, 'department-report', userId)
  }

  async generateSatisfactionReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    // Using ArticleFeedback as the available feedback model
    const feedbackData = await this.prisma.articleFeedback.findMany({
      where: {
        createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
      },
      include: {
        article: { select: { title: true } },
        user: { select: { firstName: true, lastName: true } }
      }
    })

    const ratingDistribution = this.getRatingDistribution(feedbackData)
    const avgRating = feedbackData.length > 0 
      ? (feedbackData.reduce((sum, f) => sum + (f.isLike ? 5 : 1), 0) / feedbackData.length).toFixed(2)
      : 0

    const reportData = {
      title: 'Customer Satisfaction Report',
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalResponses: feedbackData.length,
        averageRating: avgRating,
        ratingDistribution
      },
      feedback: feedbackData.map(f => ({
        id: f.id,
        rating: f.isLike ? 5 : 1,
        comment: f.isLike ? 'Liked' : 'Disliked',
        article: f.article.title,
        user: `${f.user.firstName} ${f.user.lastName}`,
        createdAt: f.createdAt
      }))
    }

    return this.generateReport(reportData, format, 'satisfaction-report', userId)
  }

  async generateKnowledgeBaseReport(generateReportDto: GenerateReportDto, userId: string) {
    const { dateFrom, dateTo, format } = generateReportDto
    
    const where = {
      createdAt: { gte: new Date(dateFrom), lte: new Date(dateTo) }
    }

    const [articles, searchStats] = await Promise.all([
      this.prisma.article.findMany({
        where,
      }),
      this.getSearchStats(dateFrom, dateTo)
    ])

    const reportData = {
      title: 'Knowledge Base Report',
      period: { from: dateFrom, to: dateTo },
      summary: {
        totalArticles: articles.length,
        totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0),
        totalLikes: articles.reduce((sum, a) => sum + (a.likeCount || 0), 0),
        searchStats
      },
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        status: article.status,
        viewCount: article.viewCount || 0,
        likeCount: article.likeCount || 0,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      }))
    }

    return this.generateReport(reportData, format, 'knowledge-base-report', userId)
  }

  // Helper methods
  private async getTicketSummary(where: any) {
    const [totalTickets, resolvedTickets, avgResolutionTime, slaCompliance] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.count({ where: { ...where, status: TicketStatus.RESOLVED } }),
      this.calculateAvgResolutionTime(where),
      this.calculateSlaCompliance(where)
    ])

    return {
      totalTickets,
      resolvedTickets,
      avgResolutionTime,
      slaCompliance,
      resolutionRate: totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100).toFixed(2) : 0
    }
  }

  private getSlaStatus(slaDeadline: Date | null, resolvedAt: Date | null, status: TicketStatus): string {
    if (!slaDeadline) return 'No SLA'
    if (status === TicketStatus.RESOLVED && resolvedAt) {
      return resolvedAt <= slaDeadline ? 'Met' : 'Breached'
    }
    return new Date() > slaDeadline ? 'At Risk' : 'On Track'
  }

  private async calculateAvgResolutionTime(where: any): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: { ...where, status: TicketStatus.RESOLVED, resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    })

    if (resolvedTickets.length === 0) return 0

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
      return sum + resolutionTime
    }, 0)

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)) // hours
  }

  private async calculateSlaCompliance(where: any): Promise<number> {
    const ticketsWithSla = await this.prisma.ticket.findMany({
      where: { ...where, slaDeadline: { not: null } },
      select: { slaDeadline: true, resolvedAt: true, status: true }
    })

    if (ticketsWithSla.length === 0) return 100

    const compliantTickets = ticketsWithSla.filter(ticket => {
      if (ticket.status === TicketStatus.RESOLVED && ticket.resolvedAt) {
        return ticket.resolvedAt <= ticket.slaDeadline!
      }
      return new Date() <= ticket.slaDeadline!
    })

    return Math.round((compliantTickets.length / ticketsWithSla.length) * 100)
  }

  private async calculateCustomerRating(agentId: string | number, dateFrom: string, dateTo: string): Promise<number> {
    // Placeholder - adapt when a ticket feedback model is available
    // Normalize agentId to string if needed
    const _agentId = String(agentId)
    void _agentId
    return 4.2
  }

  private async getSlaByPriority(where: any) {
    // Placeholder aggregate by priority
    return [
      { priority: TicketPriority.HIGH, compliance: 85, total: 20 },
      { priority: TicketPriority.MEDIUM, compliance: 92, total: 45 },
      { priority: TicketPriority.LOW, compliance: 98, total: 30 },
    ]
  }

  private getRatingDistribution(feedbackData: any[]) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    feedbackData.forEach(f => {
      if (f.isLike !== undefined) {
        const rating = f.isLike ? 5 : 1
        distribution[rating as keyof typeof distribution]++
      }
    })
    return distribution
  }

  private async getSearchStats(dateFrom: string, dateTo: string) {
    // Placeholder implementation
    return {
      uniqueQueries: 0,
      avgResultsPerSearch: 0,
      topQueries: []
    }
  }

  private calculateNextRunTime({ frequency }: { frequency: ReportFrequency }): Date {
    const now = new Date()
    switch (frequency) {
      case ReportFrequency.DAILY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case ReportFrequency.WEEKLY:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case ReportFrequency.MONTHLY:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  private async generateReport(data: any, format: string, type: string, userId: string) {
    const mime = format === 'csv' ? 'text/csv'
      : format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : format === 'pdf' ? 'application/pdf'
      : 'application/json'

    const filename = `${type}-${Date.now()}.${format || 'json'}`

    const created = await this.prisma.report.create({
      data: {
        type,
        format: format || 'json',
        data,
        filename,
        mimeType: mime,
        generatedById: userId,
      },
    })

    return created
  }

  async cancelScheduledReport(scheduleId: string, userId: string) {
    const updated = await this.prisma.reportSchedule.update({
      where: { id: scheduleId },
      data: { status: ScheduleStatus.CANCELLED },
    })
    return updated
  }

  async downloadReport(reportId: string, userId: string, userRole: UserRole) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } })
    if (!report) throw new Error('Report not found')

    const payload = report.data ? Buffer.from(JSON.stringify(report.data, null, 2)) : Buffer.from('')
    return {
      success: true,
      mimeType: report.mimeType || 'application/json',
      filename: report.filename || `report-${report.id}.json`,
      data: payload,
    }
  }

  async exportDashboardData(format: string, userId: string, userRole: UserRole) {
    const [totalTickets, openTickets, resolvedTickets] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: { not: TicketStatus.RESOLVED } } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
    ])

    const dashboardData = {
      summary: {
        totalTickets,
        openTickets,
        resolvedTickets,
      },
      generatedAt: new Date().toISOString(),
    }

    return this.generateReport(dashboardData, format, 'dashboard-export', userId)
  }

  async getReportTemplates(userRole: UserRole) {
    const templates = [
      { id: 'ticket-report', name: 'Ticket Report', description: 'Generate ticket analytics report' },
      { id: 'agent-performance', name: 'Agent Performance', description: 'Agent performance metrics' },
      { id: 'sla-report', name: 'SLA Report', description: 'SLA compliance report' },
      { id: 'department-report', name: 'Department Report', description: 'Department performance report' },
      { id: 'satisfaction-report', name: 'Customer Satisfaction', description: 'Customer satisfaction metrics' },
      { id: 'knowledge-base-report', name: 'Knowledge Base Report', description: 'Knowledge base analytics' }
    ]
    return templates
  }

  async getReportHistory(userId: string, userRole: UserRole, page: number, limit: number) {
    return {
      reports: [],
      total: 0,
      page,
      limit,
      totalPages: 0
    }
  }

  async scheduleReport(reportType: string, config: any, frequency: ReportFrequency, recipients: string[], userId: string) {
    const nextRun = this.calculateNextRunTime({ frequency })
    const created = await this.prisma.reportSchedule.create({
      data: {
        reportType,
        config,
        frequency,
        recipients,
        scheduledById: userId,
        nextRun,
        status: ScheduleStatus.ACTIVE,
      },
    })
    return created
  }

  async getScheduledReports(userId: string, userRole: UserRole) {
    return this.prisma.reportSchedule.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async getReportStatistics(userRole: UserRole) {
    return {
      totalReports: 0,
      reportsThisMonth: 0,
      scheduledReports: 0,
      avgGenerationTime: 0
    }
  }
}