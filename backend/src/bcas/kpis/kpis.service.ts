import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class KpisService {
  constructor(private prisma: PrismaService) {}

  list(objectiveId?: string) {
    return this.prisma.kPI.findMany({
      where: { objectiveId: objectiveId || undefined },
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  get(id: string) {
    return this.prisma.kPI.findUnique({ where: { id } })
  }

  create(data: {
    objectiveId: string
    name: string
    unit: string
    direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET'
    calculationNotes?: string | null
    ownerId?: string | null
  }) {
    return this.prisma.kPI.create({ data: data as any })
  }

  async update(id: string, data: Partial<{
    name: string
    unit: string
    direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET'
    calculationNotes?: string | null
    ownerId?: string | null
  }>) {
    const exists = await this.prisma.kPI.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('KPI not found')
    return this.prisma.kPI.update({ where: { id }, data: data as any })
  }

  async remove(id: string) {
    const exists = await this.prisma.kPI.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('KPI not found')
    await this.prisma.kPI.delete({ where: { id } })
    return { ok: true }
  }

  // Targets
  listTargets(kpiId: string) {
    return this.prisma.kpiTarget.findMany({ where: { kpiId }, orderBy: [{ periodStart: 'asc' }] })
  }
  createTarget(kpiId: string, data: { periodStart: Date; periodEnd: Date; targetValue: number; thresholdGreen?: number | null; thresholdYellow?: number | null; deadline?: Date | null }) {
    return this.prisma.kpiTarget.create({ data: { ...data, kpiId } })
  }
  removeTarget(id: string) {
    return this.prisma.kpiTarget.delete({ where: { id } })
  }

  // Data points
  listDataPoints(kpiId: string) {
    return this.prisma.kpiDataPoint.findMany({ where: { kpiId }, orderBy: [{ periodDate: 'asc' }] })
  }
  createDataPoint(kpiId: string, data: { periodDate: Date; actualValue: number; source?: 'MANUAL' | 'IMPORT' | 'API'; submittedById?: string | null }) {
    return this.prisma.kpiDataPoint.create({ data: { ...data, kpiId } as any })
  }
  approveDataPoint(id: string, approverId: string) {
    return this.prisma.kpiDataPoint.update({ where: { id }, data: { status: 'APPROVED' as any, approvedById: approverId, approvedAt: new Date() } })
  }
  removeDataPoint(id: string) {
    return this.prisma.kpiDataPoint.delete({ where: { id } })
  }

  // Bulk datapoints: array of { kpiId, periodDate, actualValue, source?, submittedById? }
  async bulkCreateDataPoints(items: Array<{ kpiId: string; periodDate: Date; actualValue: number; source?: 'MANUAL' | 'IMPORT' | 'API'; submittedById?: string | null }>) {
    if (!Array.isArray(items) || items.length === 0) return { created: 0 }
    const data = items.map((i) => ({ ...i, periodDate: new Date(i.periodDate) })) as any
    // Note: skipDuplicates is not supported on SQLite provider
    const created = await this.prisma.kpiDataPoint.createMany({ data })
    return { created: created.count }
  }
}
