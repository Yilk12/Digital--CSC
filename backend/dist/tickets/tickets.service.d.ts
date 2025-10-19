import { PrismaService } from "../prisma/prisma.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { TicketStatus, TicketPriority, type TicketCategory, UserRole } from "@prisma/client";
import { NotificationService } from "../common/notification.service";
export declare class TicketsService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationService);
    create(createTicketDto: CreateTicketDto, createdById: string): Promise<{
        department: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            nameAm: string | null;
        } | null;
        comments: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            ticketId: string;
        })[];
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        assignee: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        } | null;
        attachments: {
            id: string;
            createdAt: Date;
            ticketId: string;
            filename: string;
            filepath: string;
            mimetype: string;
            size: number;
        }[];
    } & {
        category: import("@prisma/client").$Enums.TicketCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.TicketPriority;
        createdById: string;
        assigneeId: string | null;
        departmentId: string | null;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
    }>;
    findAll(page?: number, limit?: number, status?: TicketStatus, priority?: TicketPriority, category?: TicketCategory, assigneeId?: string, departmentId?: string, search?: string, userId?: string, userRole?: UserRole): Promise<{
        tickets: ({
            department: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                nameAm: string | null;
            } | null;
            _count: {
                comments: number;
                attachments: number;
            };
            creator: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
            assignee: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            } | null;
        } & {
            category: import("@prisma/client").$Enums.TicketCategory;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            title: string;
            status: import("@prisma/client").$Enums.TicketStatus;
            priority: import("@prisma/client").$Enums.TicketPriority;
            createdById: string;
            assigneeId: string | null;
            departmentId: string | null;
            slaDeadline: Date | null;
            resolvedAt: Date | null;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, userId?: string, userRole?: UserRole): Promise<{
        department: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            nameAm: string | null;
        } | null;
        comments: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            ticketId: string;
        })[];
        auditLogs: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            action: string;
            entity: string;
            entityId: string;
            oldValues: import("@prisma/client/runtime/library").JsonValue | null;
            newValues: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            ticketId: string | null;
        })[];
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        assignee: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        } | null;
        attachments: {
            id: string;
            createdAt: Date;
            ticketId: string;
            filename: string;
            filepath: string;
            mimetype: string;
            size: number;
        }[];
    } & {
        category: import("@prisma/client").$Enums.TicketCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.TicketPriority;
        createdById: string;
        assigneeId: string | null;
        departmentId: string | null;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
    }>;
    update(id: string, updateTicketDto: UpdateTicketDto, userId: string, userRole?: UserRole): Promise<{
        department: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            nameAm: string | null;
        } | null;
        creator: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        assignee: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        } | null;
    } & {
        category: import("@prisma/client").$Enums.TicketCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        title: string;
        status: import("@prisma/client").$Enums.TicketStatus;
        priority: import("@prisma/client").$Enums.TicketPriority;
        createdById: string;
        assigneeId: string | null;
        departmentId: string | null;
        slaDeadline: Date | null;
        resolvedAt: Date | null;
    }>;
    remove(id: string, userId: string, userRole?: UserRole): Promise<{
        message: string;
    }>;
    getTicketStats(userId?: string, userRole?: UserRole): Promise<{
        total: number;
        byStatus: {};
        byPriority: {};
        byCategory: {};
        overdueSla: number;
        avgResolutionTime: number;
    }>;
    private calculateSlaDeadline;
    private calculateAvgResolutionTime;
    private createAuditLog;
}
