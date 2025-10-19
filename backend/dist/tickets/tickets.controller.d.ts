import { TicketsService } from "./tickets.service";
import { CommentsService } from "./comments.service";
import { AttachmentsService } from "./attachments.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";
export declare class TicketsController {
    private readonly ticketsService;
    private readonly commentsService;
    private readonly attachmentsService;
    constructor(ticketsService: TicketsService, commentsService: CommentsService, attachmentsService: AttachmentsService);
    create(createTicketDto: CreateTicketDto, files: Express.Multer.File[], req: any): Promise<{
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
    findAll(req: any, page?: number, limit?: number, status?: TicketStatus, priority?: TicketPriority, category?: TicketCategory, assigneeId?: string, departmentId?: string, search?: string): Promise<{
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
    getStats(req: any): Promise<{
        total: number;
        byStatus: {};
        byPriority: {};
        byCategory: {};
        overdueSla: number;
        avgResolutionTime: number;
    }>;
    findOne(id: string, req: any): Promise<{
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
    findMy(req: any, page?: number, limit?: number, status?: TicketStatus, priority?: TicketPriority, category?: TicketCategory, assigneeId?: string, departmentId?: string, search?: string): Promise<{
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
    update(id: string, updateTicketDto: UpdateTicketDto, req: any): Promise<{
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
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    addComment(ticketId: string, createCommentDto: CreateCommentDto, req: any): Promise<{
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
    }>;
    getComments(ticketId: string): Promise<({
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
    })[]>;
    addAttachments(ticketId: string, files: Express.Multer.File[]): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getAttachments(ticketId: string): Promise<{
        id: string;
        createdAt: Date;
        ticketId: string;
        filename: string;
        filepath: string;
        mimetype: string;
        size: number;
    }[]>;
}
