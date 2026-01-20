import { Injectable, ForbiddenException } from "@nestjs/common"
import { type $Enums, UserRole } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service"
import { NotificationService } from "../common/notification.service"
import { CreateFeedbackDto, FEEDBACK_TYPES } from "./dto/create-feedback.dto"

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
  ) {}

  async listDepartments() {
    const depts = await this.prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, nameAm: true },
      orderBy: { name: "asc" },
    })
    return depts
  }

  async createFeedback(dto: CreateFeedbackDto, user?: { userId: string; role: $Enums.UserRole } | null) {
    // Determine role and userId
    const role = (user?.role ?? dto.role) as $Enums.UserRole
    if (!role) {
      throw new ForbiddenException("Role is required to submit feedback")
    }
    const userId: string | null = dto.anonymous ? null : user?.userId ?? null

    // Validate department exists
    const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } })
    if (!dept) throw new ForbiddenException("Invalid department")

    // Persist
    const rec = await this.prisma.feedback.create({
      data: {
        role,
        userId,
        departmentId: dto.departmentId,
        type: dto.type,
        rating: dto.rating ?? null,
        helpful: dto.helpful ?? null,
        comments: dto.comments ?? null,
        attachmentPath: dto.attachmentPath ?? null,
        anonymous: !!dto.anonymous,
        articleId: dto.articleId ?? null,
        ticketId: dto.ticketId ?? null,
        experienceClarity: dto.experienceClarity ?? null,
        resolutionOutcome: dto.resolutionOutcome ?? null,
        departmentImpact: dto.departmentImpact ?? null,
        processTrainingImprovements: dto.processTrainingImprovements ?? null,
        strategicImpact: dto.strategicImpact ?? null,
        escalationPriority: dto.escalationPriority ?? null,
      },
    })

    // Notify Department Heads (STAFF_MANAGER) of that department
    try {
      // We only have User.department as a string, so match by name
      const deptName = dept.name
      const heads = await this.prisma.user.findMany({
        where: { role: UserRole.Department_Head, isActive: true, departmentId: deptName },
        select: { id: true },
      })
      for (const h of heads) {
        await this.notifications.createNotification(
          h.id,
          "feedback.new.title",
          `New ${dto.type.toLowerCase()} feedback received for ${deptName}`,
          "FEEDBACK_NEW",
        )
      }

      // If High priority, notify all GENERAL_DIRECTOR
      if (dto.escalationPriority === "HIGH") {
        const gms = await this.prisma.user.findMany({
          where: { role: UserRole.Commissioner, isActive: true },
          select: { id: true },
        })
        for (const gm of gms) {
          await this.notifications.createNotification(
            gm.id,
            "feedback.high_priority.title",
            `High priority feedback submitted for ${deptName}`,
            "FEEDBACK_HIGH_PRIORITY",
          )
        }
      }
    } catch (e) {
      // Best-effort notifications; do not block submission
    }

    return rec
  }

  async listFeedback(
    query: {
      departmentId?: string
      type?: typeof FEEDBACK_TYPES[number]
      from?: Date
      to?: Date
    },
    requester: { userId: string; role: $Enums.UserRole; department?: string | null },
  ) {
    // Only ADMIN, STAFF_MANAGER (Dept Head), GENERAL_DIRECTOR (GM) allowed
    const allowed: $Enums.UserRole[] = [UserRole.ADMIN, UserRole.Department_Head, UserRole.Commissioner]
    if (!allowed.includes(requester.role)) {
      throw new ForbiddenException("Not authorized to view feedback")
    }

    // If Dept Head, limit to their department name; translate to departmentId filter(s)
    const where: any = {}
    if (query.departmentId) where.departmentId = query.departmentId

    if (requester.role === UserRole.Department_Head) {
      if (!requester.department) throw new ForbiddenException("Department not set for manager")
      // Find department ids that match manager's department name
      const departments = await this.prisma.department.findMany({ where: { name: requester.department } })
      const ids = departments.map((d) => d.id)
      where.departmentId = { in: ids }
    }

    if (query.type) where.type = query.type
    if (query.from || query.to) {
      where.createdAt = {}
      if (query.from) where.createdAt.gte = query.from
      if (query.to) where.createdAt.lte = query.to
    }

    const items = await this.prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return items
  }
}
