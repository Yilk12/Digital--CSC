import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ObjectivesService {
  constructor(private prisma: PrismaService) {}

  list(scorecardId?: string) {
    return this.prisma.objective.findMany({
      where: { scorecardId: scorecardId || undefined },
      orderBy: [{ createdAt: 'desc' }],
    })
  }

  get(id: string) {
    return this.prisma.objective.findUnique({ where: { id } })
  }

  create(data: {
    scorecardId: string
    title: string
    description?: string
    perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL' | 'LEARNING_GROWTH'
    parentObjectiveId?: string | null
    weight?: number | null
    ownerId?: string | null
  }) {
    return this.prisma.objective.create({ data: data as any })
  }

  async update(id: string, data: Partial<{
    title: string
    description?: string
    perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL' | 'LEARNING_GROWTH'
    parentObjectiveId?: string | null
    weight?: number | null
    ownerId?: string | null
  }>) {
    const exists = await this.prisma.objective.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Objective not found')
    return this.prisma.objective.update({ where: { id }, data: data as any })
  }

  async remove(id: string) {
    const exists = await this.prisma.objective.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Objective not found')
    await this.prisma.objective.delete({ where: { id } })
    return { ok: true }
  }
}
