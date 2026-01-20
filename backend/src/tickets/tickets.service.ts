import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { TicketStatus, TicketPriority, TicketCategory, UserRole, ReadStatus, $Enums } from "@prisma/client";
import { NotificationService } from "../common/notification.service";

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService, private notifications: NotificationService) {}

  // -------------------- Create Ticket --------------------
async create(createTicketDto: CreateTicketDto, createdById: string) {
  const { departmentName, ...rest } = createTicketDto;

  let departmentId: string | null = null;

  // 1️⃣ Find department if provided
  if (departmentName) {
    const department = await this.prisma.department.findFirst({
      where: { name: departmentName, isActive: true },
    });

    if (!department) {
      throw new BadRequestException(`Department with name "${departmentName}" not found`);
    }

    departmentId = department.id;
  }

  // 2️⃣ Calculate SLA deadline
  const slaDeadline = this.calculateSlaDeadline(rest.priority);

  // 3️⃣ Create the ticket
  const ticket = await this.prisma.ticket.create({
    data: {
      ...rest,
      createdById,
      departmentId,
      slaDeadline,
      status: TicketStatus.PENDING, // lifecycle status defaults to PENDING
      isRead: ReadStatus.CLOSED, // read state defaults to CLOSED
    },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      department: true,
      comments: true,
      attachments: true,
    },
  });

  // 4️⃣ Create audit log
  await this.createAuditLog("CREATE", ticket.id, createdById, null, ticket);

  // 5️⃣ Determine recipients for notification
  const recipientsSet = new Set<string>();

  console.log('🔍 Starting recipient collection...');

  // Assignee
  if (ticket.assigneeId) {
    console.log(`👤 Adding assignee: ${ticket.assigneeId}`);
    recipientsSet.add(ticket.assigneeId);
  }

  // Department heads
  if (ticket.departmentId) {
    const departmentHeads = await this.prisma.user.findMany({
      where: {
        departmentId: ticket.departmentId,
        role: 'Department_Head',
        isActive: true,
      },
      select: { id: true },
    });
    
    console.log(`🏢 Found ${departmentHeads.length} department heads:`);
    departmentHeads.forEach(user => {
      console.log(`   - ${user.id}`);
      recipientsSet.add(user.id);
    });
  }

  // Admins
  const admins = await this.prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });
  
  console.log(`👑 Found ${admins.length} admins:`);
  admins.forEach(user => {
    console.log(`   - ${user.id}`);
    recipientsSet.add(user.id);
  });

  // Support agents
  const supportAgents = await this.prisma.user.findMany({
    where: { role: 'SUPPORT_AGENT', isActive: true },
    select: { id: true },
  });
  
  console.log(`🎯 Found ${supportAgents.length} support agents:`);
  supportAgents.forEach(user => {
    console.log(`   - ${user.id}`);
    recipientsSet.add(user.id);
  });

  console.log(`📊 Final unique recipients: ${Array.from(recipientsSet).length}`);
  console.log(`📋 Recipient IDs:`, Array.from(recipientsSet));

  // 6️⃣ Insert notifications with a human-friendly sender message - one per recipient (avoid duplicates)
  const creatorName = `${ticket.creator?.firstName || ''} ${ticket.creator?.lastName || ''}`.trim() || 'Someone';
  const baseMessage = `${creatorName}  "${ticket.title}" ስለተቀበሉን እናመሰግናለን`;
  const notificationPromises = Array.from(recipientsSet).map(async (recipientId) => {
    const exists = await this.prisma.allNotification.findFirst({
      where: {
        userId: recipientId,
        ticketId: ticket.id,
        message: baseMessage,
      },
      select: { id: true },
    });
    if (exists) return null;
    return this.prisma.allNotification.create({
      data: {
        message: baseMessage,
        userId: recipientId,
        ticketId: ticket.id,
        departmentId: ticket.departmentId,
      },
    });
  });

  const createdNotifications = (await Promise.all(notificationPromises)).filter(Boolean as any);
  console.log(`✅ Created ${createdNotifications.length} notifications`);

  return ticket;
}

  // -------------------- Find All Tickets --------------------
async findAll(
  page = 1,
  limit = 10,
  status?: TicketStatus,
  priority?: TicketPriority,
  category?: TicketCategory,
  assigneeId?: string,
  departmentId?: string,
  search?: string,
  userId?: string,       // logged-in user ID
  userRole?: UserRole,   // logged-in user role
) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  // 🧍‍♂️ Get user info
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, departmentId: true },
  });

  if (!user) throw new Error("User not found");

  // 🔐 Role-based filtering
  let roleFilter: any = {};

  if (userRole === UserRole.END_USER || userRole === UserRole.Driver) {
    // End users/drivers should see tickets they created OR tickets assigned to them
    roleFilter = {
      OR: [
        { createdById: user.id },
        { assigneeId: user.id },
      ],
    };
  } else if (
    userRole === UserRole.SUPPORT_AGENT ||
    userRole === UserRole.Department_Head
  ) {
    // Support and department heads: own created, department tickets, and tickets assigned to them
    roleFilter = {
      OR: [
        { createdById: user.id },
        { assigneeId: user.id },
        user.departmentId ? { departmentId: user.departmentId } : {},
      ],
    };
  } else if (
    userRole === UserRole.ADMIN ||
    userRole === UserRole.Commissioner ||
    userRole === UserRole.Fleet_Manager ||
    userRole === UserRole.Maintenace_Team ||
    userRole === UserRole.Team_Leader ||
    userRole === UserRole.Announcement_Creator ||
    userRole === UserRole.Finance_Department
  ) {
    roleFilter = { createdById: user.id };
  } else {
    return {
      tickets: [],
      pagination: { total: 0, page, limit, totalPages: 0 },
      message: "You are not authorized to view tickets.",
    };
  }

  // 🎯 Additional filters
  const additionalFilters: any = {};
  if (status) additionalFilters.status = status;
  if (priority) additionalFilters.priority = priority;
  if (category) additionalFilters.category = category;
  if (assigneeId) additionalFilters.assigneeId = assigneeId;
  if (departmentId) additionalFilters.departmentId = departmentId;

  // 🔍 Search filter
  const searchFilter: any = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  // Combine filters properly
  const where = {
    AND: [roleFilter, additionalFilters, searchFilter],
  };

  // 🧩 Fetch tickets
  const [tickets, total] = await Promise.all([
    this.prisma.ticket.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            department: {
              select: { name: true },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: true,
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    this.prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

//---------get notification-------------------------------
async getUserNotifications(userId: string) {
  // 1️⃣ Get logged-in user info
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
  });

  if (!user || !user.isActive) throw new Error('User not found or inactive');

  // 2️⃣ Fetch notifications targeted to this user
  const notifications = await this.prisma.allNotification.findMany({
    where: {
      userId: user.id,
    },
    include: {
      ticket: true,
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return { notifications };
}

  async markAsRead(notificationId: string) {
    return this.prisma.allNotification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // -------------------- Delete Notification --------------------
  async deleteNotification(notificationId: string, userId: string) {
    const result = await this.prisma.allNotification.deleteMany({
      where: { id: notificationId, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Notification not found");
    }

    return { message: "Notification deleted successfully" };
  }


// ---------------------mark ticket as OPEN (read) ------------------------
async updateStatus(id: string) {
  // 1️⃣ Check if ticket exists
  const existingTicket = await this.prisma.ticket.findUnique({ where: { id } });
  if (!existingTicket) throw new NotFoundException("Ticket not found");

  // 2️⃣ Update read state to OPEN
  const updatedTicket = await this.prisma.ticket.update({
    where: { id },
    data: { isRead: ReadStatus.OPEN }, // mark as opened/read
  });

  return updatedTicket;
}


  // -------------------- Find One Ticket --------------------
  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        department: true,
        comments: { include: { author: { select: { id: true, firstName: true, lastName: true, role: true } } }, orderBy: { createdAt: "asc" } },
        attachments: true,
        auditLogs: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!ticket) throw new NotFoundException("Ticket not found");

    // Permission checks
    if (userRole === UserRole.END_USER && ticket.createdById !== userId) throw new ForbiddenException("Access denied");
    if (userRole === UserRole.Department_Head) {
      const me = await this.prisma.user.findUnique({ where: { id: userId } });
      if (me?.departmentId && ticket.departmentId) {
        const dept = await this.prisma.department.findUnique({ where: { id: ticket.departmentId } });
        if (!dept || dept.name !== me.departmentId) throw new ForbiddenException("Access denied");
      } else throw new ForbiddenException("Access denied");
    }

    return ticket;
  }

  // -------------------- Update Ticket --------------------
  async update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole?: UserRole) {
    const existingTicket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) throw new NotFoundException("Ticket not found");

    const data: any = { ...updateTicketDto };

    if (userRole === UserRole.END_USER) {
      // END_USER cannot change assignment or department
      delete data.assigneeId;
      delete data.departmentId;
      // END_USER can only change status on their own ticket
      if (existingTicket.createdById !== userId) {
        delete data.status;
      }
    }

    if (userRole === UserRole.Department_Head) {
      const me = await this.prisma.user.findUnique({ where: { id: userId } });
      if (data.assigneeId) {
        const target = await this.prisma.user.findUnique({ where: { id: data.assigneeId } });
        if (!target || target.departmentId !== me?.departmentId)
          throw new ForbiddenException("Cannot assign outside your department");
      }
      if (data.departmentId) {
        const dept = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
        if (!dept || dept.name !== me?.departmentId) throw new ForbiddenException("Cannot change department outside your scope");
      }
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: { ...data, ...(data.status === TicketStatus.RESOLVED && { resolvedAt: new Date() }) },
      include: {
        creator: {
          include: {
            department: { select: { name: true } },
          },
        },
        assignee: {
          include: {
            department: { select: { name: true } },
          },
        },
        department: true,
      },
    });

    await this.createAuditLog("UPDATE", id, userId, existingTicket, updatedTicket);

    // Notify on assignment change when Department Head assigns ticket
    if (
      userRole === UserRole.Department_Head &&
      data.assigneeId &&
      data.assigneeId !== existingTicket.assigneeId
    ) {
      try {
        const actor = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        const actorName = actor
          ? `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || "Department head"
          : "Department head";

        // 1) Notification to the newly assigned employee with rich context
        const creatorName = `${updatedTicket.creator?.firstName || ""} ${
          updatedTicket.creator?.lastName || ""
        }`.trim() || "Unknown user";

        const creatorDept =
          updatedTicket.creator?.department?.name ||
          updatedTicket.department?.name ||
          "Unknown department";

        const creatorPhone = updatedTicket.creator?.phone || "N/A";
        const createdAtText = updatedTicket.createdAt
          ? updatedTicket.createdAt.toISOString()
          : new Date().toISOString();

        const assigneeMessage = `${actorName} has assigned ticket "${updatedTicket.title}" created by ${creatorName} from ${creatorDept}, phone ${creatorPhone}, created at ${createdAtText}`;

        await this.prisma.allNotification.create({
          data: {
            userId: data.assigneeId,
            ticketId: updatedTicket.id,
            departmentId: updatedTicket.departmentId ?? null,
            message: assigneeMessage,
          },
        });

        // 2) Notification to the ticket creator in Amharic with assigned employee details
        const assigneeName = `${updatedTicket.assignee?.firstName || ""} ${
          updatedTicket.assignee?.lastName || ""
        }`.trim();
        const assigneeDept =
          updatedTicket.assignee?.department?.name ||
          updatedTicket.department?.name ||
          "ዲፓርትመንት የለም";
        const assigneePhone = updatedTicket.assignee?.phone || "ስልክ ቁጥር አልተመዘገበም";
        const creatorId = updatedTicket.creator?.id;

        if (creatorId && assigneeName) {
          const amharicMessage =
            `ለጠየቁት ድጋፍ \n` +
            `"${updatedTicket.title}"\n` +
            `የተመደበው ባለሙያ: ${assigneeName}\n` +
            `ከ${assigneeDept} የስራ ክፍል : \n` +
            `ስልክ ቁጥር: ${assigneePhone}\n` +
            `መልካም ግዜ ይሁንልዎ`;

          await this.prisma.allNotification.create({
            data: {
              userId: creatorId,
              ticketId: updatedTicket.id,
              departmentId: updatedTicket.departmentId ?? null,
              message: amharicMessage,
            },
          });
        }
      } catch (e) {
        // Non-blocking: log and continue
        console.error("Notification error (assignee change):", e);
      }
    }

    // Notify on status change with actor info via AllNotification model
    if (data.status && existingTicket.status !== data.status) {
      try {
        const actor = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        })
        const actorName = actor ? `${actor.firstName} ${actor.lastName}` : "Someone"
        const statusTextMap: Record<TicketStatus, string> = {
          IN_PROGRESS: "In Progress",
          RESOLVED: "Resolved",
          PENDING: "Pending",
        }
        const newStatusText = statusTextMap[data.status]
        const message = `This request "${updatedTicket.title}" is ${newStatusText} for ${actorName}`

        // Determine recipients: Department_Head and SUPPORT_AGENT, exclude actor, limit to same department if available
        const recipients = await this.prisma.user.findMany({
          where: {
            isActive: true,
            id: { not: userId },
            role: { in: ["Department_Head", "SUPPORT_AGENT"] as any },
            ...(updatedTicket.departmentId ? { departmentId: updatedTicket.departmentId } : {}),
          },
          select: { id: true },
        })

        if (recipients.length) {
          await Promise.all(
            recipients.map(r => this.prisma.allNotification.create({
              data: {
                userId: r.id,
                ticketId: updatedTicket.id,
                departmentId: updatedTicket.departmentId ?? null,
                message,
              },
            }))
          )
        }
      } catch (e) {
        // Non-blocking: log and continue
        console.error("Notification error (status change):", e)
      }
    }

    return updatedTicket;
  }

  // -------------------- Update Ticket Status Only --------------------
  async updateStatusOnly(id: string, status: TicketStatus, userId: string, userRole?: UserRole) {
    return this.update(id, { status } as any, userId, userRole)
  }

  // -------------------- Delete Ticket --------------------
  async remove(id: string, userId: string, userRole?: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException("Ticket not found");
    if (userRole === UserRole.END_USER && ticket.createdById !== userId) throw new ForbiddenException("You can only delete your own tickets");

    await this.prisma.ticket.delete({ where: { id } });
    await this.createAuditLog("DELETE", id, userId, ticket, null);

    return { message: "Ticket deleted successfully" };
  }

  // -------------------- Ticket Stats --------------------
  async getTicketStats(userId?: string, userRole?: UserRole) {
    const where: any = {};
    if (userRole === UserRole.END_USER) where.createdById = userId;
    else if (userRole === UserRole.SUPPORT_AGENT) where.OR = [{ createdById: userId }, { assigneeId: userId }];
    else if (userRole === UserRole.Department_Head) {
      const me = await this.prisma.user.findUnique({ where: { id: userId } });
      if (me?.departmentId) {
        const dept = await this.prisma.department.findFirst({ where: { name: me.departmentId, isActive: true } });
        if (dept) where.departmentId = dept.id;
        else where.departmentId = "__none__";
      } else where.departmentId = "__none__";
    }

    const [total, byStatus, byPriority, byCategory, overdueSla, avgResolutionTime] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.groupBy({ by: ["status"], where, _count: { status: true } }),
      this.prisma.ticket.groupBy({ by: ["priority"], where, _count: { priority: true } }),
      this.prisma.ticket.groupBy({ by: ["category"], where, _count: { category: true } }),
      this.prisma.ticket.count({ where: { ...where, slaDeadline: { lt: new Date() }, status: { notIn: [TicketStatus.RESOLVED] } } }),
      this.calculateAvgResolutionTime(where),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count.status }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count.priority }), {}),
      byCategory: byCategory.reduce((acc, item) => ({ ...acc, [item.category]: item._count.category }), {}),
      overdueSla,
      avgResolutionTime,
    };
  }

  // -------------------- Assign Ticket to Vehicle --------------------
  async assignTicketToVehicle(ticketId: string, vehicleId: string, currentUserId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found");

    // Update vehicleNotification for ticket creator
    await this.prisma.vehicleNotification.updateMany({
      where: { userId: ticket.createdById },
      data: { vehicleId },
    });

    await this.notifications.createNotification(
      ticket.createdById,
      "ticket.vehicle.assigned",
      `Your ticket "${ticket.title}" has been assigned to vehicle ${vehicleId}.`,
      "VEHICLE_ASSIGNED",
    );

    return { message: "Ticket assigned to vehicle and notification updated" };
  }

  // -------------------- Helper Methods --------------------
  private calculateSlaDeadline(priority: TicketPriority): Date {
    const now = new Date();
    const hours = { URGENT: 4, HIGH: 24, MEDIUM: 72, LOW: 168 };
    return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000);
  }

  private async calculateAvgResolutionTime(where: any): Promise<number> {
    const resolvedTickets = await this.prisma.ticket.findMany({ where: { ...where, status: TicketStatus.RESOLVED, resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } });
    if (!resolvedTickets.length) return 0;
    const totalTime = resolvedTickets.reduce((sum, t) => sum + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0);
    return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60));
  }

  private async createAuditLog(action: string, entityId: string, userId: string, oldValues: any, newValues: any) {
    await this.prisma.auditLog.create({
      data: { action, entity: "TICKET", entityId, userId, oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null, newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null },
    });
  }
}
