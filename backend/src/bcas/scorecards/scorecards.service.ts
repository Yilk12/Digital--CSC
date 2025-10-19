import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ScorecardsService {
  constructor(private prisma: PrismaService) {}

  list(params: { scope?: string; status?: string; year?: number; quarter?: number } = {}) {
    const { scope, status, year, quarter } = params
    return this.prisma.scorecard.findMany({
      where: {
        scope: scope as any || undefined,
        status: status as any || undefined,
        year: year ?? undefined,
        quarter: quarter ?? undefined,
      },
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  get(id: string) {
    return this.prisma.scorecard.findUnique({ where: { id } })
  }

  async create(data: {
    name: string
    description?: string
    scope: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
    ownerId?: string | null
    year?: number | null
    quarter?: number | null
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  }) {
    return this.prisma.scorecard.create({ data: { ...data } as any })
  }

  async update(id: string, data: Partial<{
    name: string
    description?: string
    scope: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
    ownerId?: string | null
    year?: number | null
    quarter?: number | null
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
  }>) {
    const exists = await this.prisma.scorecard.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Scorecard not found')
    return this.prisma.scorecard.update({ where: { id }, data: data as any })
  }

  async remove(id: string) {
    const exists = await this.prisma.scorecard.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Scorecard not found')
    await this.prisma.scorecard.delete({ where: { id } })
    return { ok: true }
  }
}
