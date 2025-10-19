import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class DashboardsService {
  constructor(private prisma: PrismaService) {}

  async executive(params: { year?: number; quarter?: number } = {}) {
    const { year, quarter } = params
    const whereScorecard: any = { year: year ?? undefined, quarter: quarter ?? undefined }

    const [scorecards, kpiCount, datapointCount, byPerspective] = await Promise.all([
      this.prisma.scorecard.findMany({ where: whereScorecard, orderBy: { createdAt: 'desc' }, take: 12 }),
      this.prisma.kPI.count(),
      this.prisma.kpiDataPoint.count(),
      this.prisma.objective.groupBy({ by: ['perspective'], _count: { _all: true } as any }),
    ])

    return { scorecards, kpiCount, datapointCount, byPerspective }
  }

  async manager(params: { departmentId?: string } = {}) {
    const { departmentId } = params
    // Basic aggregates; in future join Assignments/Departments
    const kpis = await this.prisma.kPI.findMany({ take: 20, orderBy: { createdAt: 'desc' } })
    const recent = await this.prisma.kpiDataPoint.findMany({ take: 20, orderBy: { periodDate: 'desc' } })
    return { kpis, recent, filter: { departmentId } }
  }

  async employee(params: { userId: string }) {
    const { userId } = params
    // In future, filter via Assignments for user. For now, return last 10 datapoints by submitter
    const recentMine = await this.prisma.kpiDataPoint.findMany({ where: { submittedById: userId }, take: 10, orderBy: { periodDate: 'desc' } })
    return { recentMine }
  }
}
