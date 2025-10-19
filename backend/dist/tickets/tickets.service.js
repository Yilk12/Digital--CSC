"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const notification_service_1 = require("../common/notification.service");
let TicketsService = class TicketsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async create(createTicketDto, createdById) {
        const slaDeadline = this.calculateSlaDeadline(createTicketDto.priority);
        let departmentId = createTicketDto.departmentId;
        if (!departmentId) {
            const creator = await this.prisma.user.findUnique({ where: { id: createdById } });
            if (creator === null || creator === void 0 ? void 0 : creator.department) {
                const dept = await this.prisma.department.findFirst({ where: { name: creator.department, isActive: true } });
                if (dept)
                    departmentId = dept.id;
            }
            if (!departmentId) {
                const categoryToDeptName = {
                    IT: "IT Department",
                    HR: "HR Department",
                    FINANCE: "Finance Department",
                    INCIDENT: "IT Department",
                    GENERAL: "Administration",
                };
                const deptName = categoryToDeptName[String(createTicketDto.category)];
                if (deptName) {
                    const dept = await this.prisma.department.findFirst({ where: { name: deptName, isActive: true } });
                    if (dept)
                        departmentId = dept.id;
                }
            }
        }
        const ticket = await this.prisma.ticket.create({
            data: Object.assign(Object.assign(Object.assign({}, createTicketDto), (departmentId ? { departmentId } : {})), { createdById,
                slaDeadline }),
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
        });
        await this.createAuditLog("CREATE", ticket.id, createdById, null, ticket);
        if (ticket.departmentId) {
            const dept = await this.prisma.department.findUnique({ where: { id: ticket.departmentId } });
            if (dept === null || dept === void 0 ? void 0 : dept.name) {
                const heads = await this.prisma.user.findMany({
                    where: { role: client_1.UserRole.STAFF_MANAGER, isActive: true, department: dept.name },
                    select: { id: true },
                });
                for (const h of heads) {
                    await this.notifications.createNotification(h.id, "ticket.created.title", `New ticket "${ticket.title}" submitted to your department (${dept.name}). Please assign an officer to handle it.`, "TICKET_NEW_DEPT");
                }
            }
        }
        return ticket;
    }
    async findAll(page = 1, limit = 10, status, priority, category, assigneeId, departmentId, search, userId, userRole) {
        const skip = (page - 1) * limit;
        const where = {};
        if (userRole === client_1.UserRole.END_USER) {
            where.createdById = userId;
        }
        else if (userRole === client_1.UserRole.SUPPORT_AGENT) {
            where.OR = [{ createdById: userId }, { assigneeId: userId }];
        }
        else if (userRole === client_1.UserRole.STAFF_MANAGER) {
            const me = await this.prisma.user.findUnique({ where: { id: userId } });
            if (me === null || me === void 0 ? void 0 : me.department) {
                const dept = await this.prisma.department.findFirst({ where: { name: me.department, isActive: true } });
                if (dept)
                    where.departmentId = dept.id;
                else
                    where.departmentId = "__none__";
            }
            else {
                where.departmentId = "__none__";
            }
        }
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (category)
            where.category = category;
        if (assigneeId)
            where.assigneeId = assigneeId;
        if (departmentId)
            where.departmentId = departmentId;
        if (search) {
            where.OR = [
                ...(where.OR || []),
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
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
        ]);
        return {
            tickets,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, userId, userRole) {
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
        });
        if (!ticket) {
            throw new common_1.NotFoundException("Ticket not found");
        }
        if (userRole === client_1.UserRole.END_USER && ticket.createdById !== userId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        if (userRole === client_1.UserRole.STAFF_MANAGER) {
            const me = await this.prisma.user.findUnique({ where: { id: userId } });
            if ((me === null || me === void 0 ? void 0 : me.department) && ticket.departmentId) {
                const dept = await this.prisma.department.findUnique({ where: { id: ticket.departmentId } });
                if (!dept || dept.name !== me.department) {
                    throw new common_1.ForbiddenException("Access denied");
                }
            }
            else {
                throw new common_1.ForbiddenException("Access denied");
            }
        }
        return ticket;
    }
    async update(id, updateTicketDto, userId, userRole) {
        const existingTicket = await this.prisma.ticket.findUnique({
            where: { id },
        });
        if (!existingTicket) {
            throw new common_1.NotFoundException("Ticket not found");
        }
        if (userRole === client_1.UserRole.END_USER && existingTicket.createdById !== userId) {
            throw new common_1.ForbiddenException("You can only edit your own tickets");
        }
        const data = Object.assign({}, updateTicketDto);
        if (userRole === client_1.UserRole.END_USER) {
            delete data.status;
            delete data.assigneeId;
            delete data.departmentId;
        }
        if (userRole === client_1.UserRole.STAFF_MANAGER) {
            const me = await this.prisma.user.findUnique({ where: { id: userId } });
            if (data.assigneeId) {
                const target = await this.prisma.user.findUnique({ where: { id: data.assigneeId } });
                if (!target || target.department !== (me === null || me === void 0 ? void 0 : me.department)) {
                    throw new common_1.ForbiddenException("Cannot assign outside your department");
                }
            }
            if (data.departmentId) {
                const dept = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
                if (!dept || dept.name !== (me === null || me === void 0 ? void 0 : me.department)) {
                    throw new common_1.ForbiddenException("Cannot change department outside your scope");
                }
            }
        }
        const updatedTicket = await this.prisma.ticket.update({
            where: { id },
            data: Object.assign(Object.assign({}, data), (data.status === client_1.TicketStatus.RESOLVED && {
                resolvedAt: new Date(),
            })),
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
        });
        if (existingTicket.assigneeId !== updatedTicket.assigneeId) {
            const prevAssignee = existingTicket.assigneeId
                ? await this.prisma.user.findUnique({ where: { id: existingTicket.assigneeId } })
                : null;
            const newAssignee = updatedTicket.assigneeId
                ? await this.prisma.user.findUnique({ where: { id: updatedTicket.assigneeId } })
                : null;
            if (newAssignee) {
                const prevName = prevAssignee ? `${prevAssignee.firstName} ${prevAssignee.lastName}` : "unassigned";
                await this.notifications.createNotification(newAssignee.id, "ticket.assigned.title", `You have been assigned ticket "${updatedTicket.title}" (previously ${prevName}).`, "TICKET_ASSIGNED");
            }
            if (prevAssignee && (!newAssignee || newAssignee.id !== prevAssignee.id)) {
                await this.notifications.createNotification(prevAssignee.id, "ticket.unassigned.title", `You have been unassigned from ticket "${updatedTicket.title}".`, "TICKET_UNASSIGNED");
            }
        }
        await this.createAuditLog("UPDATE", id, userId, existingTicket, updatedTicket);
        return updatedTicket;
    }
    async remove(id, userId, userRole) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket) {
            throw new common_1.NotFoundException("Ticket not found");
        }
        if (userRole === client_1.UserRole.END_USER && ticket.createdById !== userId) {
            throw new common_1.ForbiddenException("You can only delete your own tickets");
        }
        await this.prisma.ticket.delete({ where: { id } });
        await this.createAuditLog("DELETE", id, userId, ticket, null);
        return { message: "Ticket deleted successfully" };
    }
    async getTicketStats(userId, userRole) {
        const where = {};
        if (userRole === client_1.UserRole.END_USER) {
            where.createdById = userId;
        }
        else if (userRole === client_1.UserRole.SUPPORT_AGENT) {
            where.OR = [{ createdById: userId }, { assigneeId: userId }];
        }
        else if (userRole === client_1.UserRole.STAFF_MANAGER) {
            const me = await this.prisma.user.findUnique({ where: { id: userId } });
            if (me === null || me === void 0 ? void 0 : me.department) {
                const dept = await this.prisma.department.findFirst({ where: { name: me.department, isActive: true } });
                if (dept)
                    where.departmentId = dept.id;
                else
                    where.departmentId = "__none__";
            }
            else {
                where.departmentId = "__none__";
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
                where: Object.assign(Object.assign({}, where), { slaDeadline: { lt: new Date() }, status: { notIn: [client_1.TicketStatus.RESOLVED, client_1.TicketStatus.CLOSED] } }),
            }),
            this.calculateAvgResolutionTime(where),
        ]);
        return {
            total,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item.priority] = item._count.priority;
                return acc;
            }, {}),
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = item._count.category;
                return acc;
            }, {}),
            overdueSla,
            avgResolutionTime,
        };
    }
    calculateSlaDeadline(priority) {
        const now = new Date();
        const hours = {
            [client_1.TicketPriority.URGENT]: 4,
            [client_1.TicketPriority.HIGH]: 24,
            [client_1.TicketPriority.MEDIUM]: 72,
            [client_1.TicketPriority.LOW]: 168,
        };
        return new Date(now.getTime() + hours[priority] * 60 * 60 * 1000);
    }
    async calculateAvgResolutionTime(where) {
        const resolvedTickets = await this.prisma.ticket.findMany({
            where: Object.assign(Object.assign({}, where), { status: client_1.TicketStatus.RESOLVED, resolvedAt: { not: null } }),
            select: {
                createdAt: true,
                resolvedAt: true,
            },
        });
        if (resolvedTickets.length === 0)
            return 0;
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
            const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
            return sum + resolutionTime;
        }, 0);
        return Math.round(totalTime / resolvedTickets.length / (1000 * 60 * 60));
    }
    async createAuditLog(action, entityId, userId, oldValues, newValues) {
        await this.prisma.auditLog.create({
            data: {
                action,
                entity: "TICKET",
                entityId,
                userId,
                oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
                newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
            },
        });
    }
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, notification_service_1.NotificationService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map