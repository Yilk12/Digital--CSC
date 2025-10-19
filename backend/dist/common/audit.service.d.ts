import { PrismaService } from "../prisma/prisma.service";
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    logAction(action: string, entity: string, entityId: string, userId?: string, oldValues?: any, newValues?: any): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        entity: string;
        entityId: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        ticketId: string | null;
    }>;
    getAuditLogs(entityType?: string, entityId?: string, userId?: string, page?: number, limit?: number): Promise<{
        logs: ({
            user: {
                id: string;
                email: string;
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
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getEntityHistory(entityType: string, entityId: string): Promise<({
        user: {
            id: string;
            email: string;
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
    })[]>;
    getUserActivity(userId: string, days?: number): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        entity: string;
        entityId: string;
        oldValues: import("@prisma/client/runtime/library").JsonValue | null;
        newValues: import("@prisma/client/runtime/library").JsonValue | null;
        userId: string;
        ticketId: string | null;
    }[]>;
    getSystemActivity(days?: number): Promise<{
        totalActions: number;
        actionsByType: {};
        actionsByUser: {};
        recentActions: ({
            user: {
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
    }>;
}
