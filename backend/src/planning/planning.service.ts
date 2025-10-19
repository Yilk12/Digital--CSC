import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

interface ListParams {
  owner?: string | null
  status?: string | null
  q?: string | null
  page: number
  pageSize: number
  sortBy?: string | null
  sortDir?: 'asc' | 'desc'
  sortMulti?: string | null
}

@Injectable()
export class PlanningService {
  constructor(private prisma: PrismaService) {}

  async list(params: ListParams) {
    const { owner, status, q, page, pageSize, sortBy, sortDir, sortMulti } = params
    const where: any = {}
    if (owner) where.ownerId = owner
    if (status) where.status = status
    if (q) where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { id: { contains: q, mode: 'insensitive' } },
    ]

    let orderBy: any = { createdAt: 'desc' as const }
    if (sortMulti) {
      const fields = String(sortMulti).split(',').map(s => s.trim()).filter(Boolean).map(part => {
        const [k, d] = part.split(':').map(t => t.trim())
        return { [k]: (d?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc' }
      })
      if (fields.length) orderBy = fields
    } else if (sortBy) {
      orderBy = { [sortBy]: sortDir }
    }

    const total = await this.prisma.plan.count({ where })
    const items = await this.prisma.plan.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize })
    return { ok: true, items, page, pageSize, total }
  }

  async create(body: { title: string; description?: string; ownerId: string }) {
    return this.prisma.plan.create({ data: { title: body.title, description: body.description || '', ownerId: body.ownerId } })
  }

  async update(id: string, body: { title?: string; description?: string; status?: string }) {
    return this.prisma.plan.update({ where: { id }, data: body as any })
  }

  async remove(id: string) {
    return this.prisma.plan.delete({ where: { id } })
  }
}
