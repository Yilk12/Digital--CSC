import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async distributePlanAssignments(body: { planId: string; toUsers: string[]; by: string; dueDate?: string; notes?: string }) {
    const { planId, toUsers, by, dueDate, notes } = body
    const due = dueDate ? new Date(dueDate) : undefined
    const created = await this.prisma.$transaction(
      toUsers.map(uid => this.prisma.planAssignment.create({
        data: {
          planId,
          fromUserId: by,
          toUserId: uid,
          level: 'DEPARTMENT',
          notes: notes || undefined,
          dueDate: due,
        }
      }))
    )
    // Optionally write plan history entries
    await this.prisma.planHistory.createMany({
      data: created.map(a => ({ planId, byUserId: by, action: `assign:${a.toUserId}`, comments: notes || undefined })),
    })
    return created
  }
}
