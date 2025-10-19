import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateTicketDto } from "./dto/create-ticket.dto"
import { UpdateTicketDto } from "./dto/update-ticket.dto"
import { TicketStatus, TicketPriority, type TicketCategory, UserRole } from "@prisma/client"
import { NotificationService } from "../common/notification.service"

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService, private notifications: NotificationService) {}

  async create(createTicketDto: CreateTicketDto, createdById: string) {
    // Calculate SLA deadline based on priority
    const slaDeadline = this.calculateSlaDeadline(createTicketDto.priority)

    // Attempt automatic department routing if not provided
    let departmentId = createTicketDto.departmentId
    if (!departmentId) {
      // Derive from creator's department string or from category mapping
      const creator = await this.prisma.user.findUnique({ where: { id: createdById } })
      if (creator?.department) {
        const dept = await this.prisma.department.findFirst({ where: { name: creator.department, isActive: true } })
        if (dept) departmentId = dept.id
      }
      // Fallback mapping based on category name to department name
      if (!departmentId) {
        const categoryToDeptName: Record<string, string> = {
          IT: "IT Department",
          HR: "HR Department",
          FINANCE: "Finance Department",
          INCIDENT: "IT Department",
          GENERAL: "Administration",
        }
        const deptName = categoryToDeptName[String((createTicketDto as any).category)]
        if (deptName) {
          const dept = await this.prisma.department.findFirst({ where: { name: deptName, isActive: true } })
          if (dept) departmentId = dept.id
        }
      }
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        ...(departmentId ? { departmentId } : {}),
        createdById,
        slaDeadline,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        department: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
    })

    // Create audit log
    await this.createAuditLog("CREATE", ticket.id, createdById, null, ticket)

    // Notify department head(s) directly for new ticket in their department
    if (ticket.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: ticket.departmentId } })
      if (dept?.name) {
        const heads = await this.prisma.user.findMany({
          where: { role: UserRole.STAFF_MANAGER, isActive: true, department: dept.name },
          select: { id: true },
        })
        for (const h of heads) {
          await this.notifications.createNotification(
            h.id,
            "ticket.created.title",
            `New ticket "${ticket.title}" submitted to your department (${dept.name}). Please assign an officer to handle it.`,
            "TICKET_NEW_DEPT",
          )
        }
      }
    }

    return ticket
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: TicketStatus,
    priority?: TicketPriority,
    category?: TicketCategory,
    assigneeId?: string,
    departmentId?: string,
    search?: string,
    userId?: string,
    userRole?: UserRole,
  ) {
    const skip = (page - 1) * limit

    // Build where clause based on user role and permissions
    const where: any = {}

    // Role-based filtering
    if (userRole === UserRole.END_USER) {
      where.createdById = userId
    } else if (userRole === UserRole.SUPPORT_AGENT) {
      where.OR = [{ createdById: userId }, { assigneeId: userId }]
    } else if (userRole === UserRole.STAFF_MANAGER) {
      // Department Head: limit to their department
      const me = await this.prisma.user.findUnique({ where: { id: userId } })
      if (me?.department) {
        const dept = await this.prisma.department.findFirst({ where: { name: me.department, isActive: true } })
        if (dept) where.departmentId = dept.id
        else where.departmentId = "__none__" // ensure empty if not found
      } else {
        where.departmentId = "__none__"
      }
    }

    // Additional filters
    if (status) where.status = status
    if (priority) where.priority = priority
    if (category) where.category = category
    if (assigneeId) where.assigneeId = assigneeId
    if (departmentId) where.departmentId = departmentId

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
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
      }),
      this.prisma.ticket.count({ where }),
    ])

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        department: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: true,
        auditLogs: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!ticket) {
      throw new NotFoundException("Ticket not found")
    }

    // Check permissions
    if (userRole === UserRole.END_USER && ticket.createdById !== userId) {
      throw new ForbiddenException("Access denied")
    }
    // Department Head can access tickets in their department
    if (userRole === UserRole.STAFF_MANAGER) {
      const me = await this.prisma.user.findUnique({ where: { id: userId } })
      if (me?.department && ticket.departmentId) {
        const dept = await this.prisma.department.findUnique({ where: { id: ticket.departmentId } })
        if (!dept || dept.name !== me.department) {
          throw new ForbiddenException("Access denied")
        }
      } else {
        throw new ForbiddenException("Access denied")
      }
    }
    return ticket
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole?: UserRole) {
    const existingTicket = await this.prisma.ticket.findUnique({
      where: { id },
    })

    if (!existingTicket) {
      throw new NotFoundException("Ticket not found")
    }

    // Ownership/role check: END_USER can only edit their own ticket
    if (userRole === UserRole.END_USER && existingTicket.createdById !== userId) {
      throw new ForbiddenException("You can only edit your own tickets")
    }

    // Optional: restrict editable fields for END_USER
    const data = { ...updateTicketDto } as any
    if (userRole === UserRole.END_USER) {
      // Prevent changing status/assignee/department by end users
      delete data.status
      delete data.assigneeId
      delete data.departmentId
    }
    // Department Head constraints: can assign/reassign only within their department
    if (userRole === UserRole.STAFF_MANAGER) {
      const me = await this.prisma.user.findUnique({ where: { id: userId } })
      if (data.assigneeId) {
        const target = await this.prisma.user.findUnique({ where: { id: data.assigneeId } })
        if (!target || target.department !== me?.department) {
          throw new ForbiddenException("Cannot assign outside your department")
        }
      }
      if (data.departmentId) {
        // Prevent moving ticket to another department by head
        const dept = await this.prisma.department.findUnique({ where: { id: data.departmentId } })
        if (!dept || dept.name !== me?.department) {
          throw new ForbiddenException("Cannot change department outside your scope")
        }
      }
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === TicketStatus.RESOLVED && {
          resolvedAt: new Date(),
        }),
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
        department: true,
      },
    })

    // Notify reassignment/unassignment details
    if (existingTicket.assigneeId !== updatedTicket.assigneeId) {
      const prevAssignee = existingTicket.assigneeId
        ? await this.prisma.user.findUnique({ where: { id: existingTicket.assigneeId } })
        : null
      const newAssignee = updatedTicket.assigneeId
        ? await this.prisma.user.findUnique({ where: { id: updatedTicket.assigneeId } })
        : null

      // Notify new assignee
      if (newAssignee) {
        const prevName = prevAssignee ? `${prevAssignee.firstName} ${prevAssignee.lastName}` : "unassigned"
        await this.notifications.createNotification(
          newAssignee.id,
          "ticket.assigned.title",
          `You have been assigned ticket "${updatedTicket.title}" (previously ${prevName}).`,
          "TICKET_ASSIGNED",
        )
      }

      // Notify previous assignee that they were unassigned
      if (prevAssignee && (!newAssignee || newAssignee.id !== prevAssignee.id)) {
        await this.notifications.createNotification(
          prevAssignee.id,
          "ticket.unassigned.title",
          `You have been unassigned from ticket "${updatedTicket.title}".`,
          "TICKET_UNASSIGNED",
        )
      }
    }

    // Create audit log
    await this.createAuditLog("UPDATE", id, userId, existingTicket, updatedTicket)

    return updatedTicket
  }

  async remove(id: string, userId: string, userRole?: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } })
    if (!ticket) {
      throw new NotFoundException("Ticket not found")
    }

    // Ownership/role check: END_USER can only delete their own ticket
    if (userRole === UserRole.END_USER && ticket.createdById !== userId) {
      throw new ForbiddenException("You can only delete your own tickets")
    }

    await this.prisma.ticket.delete({ where: { id } })

    // Create audit log
    await this.createAuditLog("DELETE", id, userId, ticket, null)

    return { message: "Ticket deleted successfully" }
  }

  async getTicketStats(userId?: string, userRole?: UserRole) {
    const where: any = {}

    // Role-based filtering for stats
    if (userRole === UserRole.END_USER) {
      where.createdById = userId
    } else if (userRole === UserRole.SUPPORT_AGENT) {
      where.OR = [{ createdById: userId }, { assigneeId: userId }]
    } else if (userRole === UserRole.STAFF_MANAGER) {
      const me = await this.prisma.user.findUnique({ where: { id: userId! } })
      if (me?.department) {
        const dept = await this.prisma.department.findFirst({ where: { name: me.department, isActive: true } })
        if (dept) where.departmentId = dept.id
        else where.departmentId = "__none__"
      } else {
        where.departmentId = "__none__"
      }
    }

    const [total, byStatus, byPriority, byCategory, overdueSla, avgResolutionTime] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      this.prisma.ticket.groupBy({
        by: ["priority"],
        where,
        _count: { priority: true },
      }),
      this.prisma.ticket.groupBy({
        by: ["category"],
        where,
        _count: { category: true },
      }),
      this.prisma.ticket.count({
        where: {
          ...where,
          slaDeadline: { lt: new Date() },
          status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
        },
      }),
      this.calculateAvgResolutionTime(where),
    ])

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority
        return acc
      }, {}),
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = item._count.category
        return acc
      }, {}),
      overdueSla,
      avgResolutionTime,
    }
  }

  private calculateSlaDeadline(priority: TicketPriority): Date {
    const now = new Date()
    const hours = {
      [TicketPriority.URGENT]: 4,
      [TicketPriority.HIGH]: 24,
      [TicketPriority.MEDIUM]: 72,
      [TicketPriority.LOW]: 168,
    }

    return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000)
  }

  private async calculateAvgResolutionTime(where: any): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: TicketStatus.RESOLVED,
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    })

    if (resolvedTickets.length === 0) return 0

    const totalTime = resolvedTickets.reduce((sum, ticket) => {
      const resolutionTime = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()
      return sum + resolutionTime
    }, 0)

    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60)) // Convert to hours
  }

  private async createAuditLog(action: string, entityId: string, userId: string, oldValues: any, newValues: any) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity: "TICKET",
        entityId,
        userId,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      },
    })
  }
}
