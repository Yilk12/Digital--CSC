import { HelpdeskService } from "./helpdesk.service";
export declare class HelpdeskController {
    private readonly helpdeskService;
    constructor(helpdeskService: HelpdeskService);
    getDashboard(req: any): Promise<{
        summary: {
            totalTickets: number;
            openTickets: number;
            resolvedTickets: number;
            overdueTickets: number;
            avgResolutionTime: number;
        };
        recentTickets: ({
            creator: {
                firstName: string;
                lastName: string;
            };
            assignee: {
                firstName: string;
                lastName: string;
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
        priorityDistribution: any;
        statusDistribution: any;
    }>;
    getMetrics(req: any, period?: string): Promise<{
        period: string;
        metrics: {
            ticketsCreated: number;
            ticketsResolved: number;
            resolutionRate: string | number;
            avgResolutionTime: number;
            avgFirstResponseTime: number;
            customerSatisfaction: number;
            slaCompliance: number;
        };
    }>;
    getSlaPerformance(req: any, departmentId?: string): Promise<{
        withinSla: number;
        breachedSla: number;
        totalTickets: number;
        slaPerformance: number;
    }>;
    getAgentPerformance(req: any): Promise<{
        agent: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
        metrics: {
            assignedTickets: number;
            resolvedTickets: number;
            resolutionRate: string | number;
            avgResolutionTime: number;
            customerRating: number;
        };
    }[]>;
    getTicketTrends(req: any, period?: string, groupBy?: string): Promise<{
        period: string;
        groupBy: string;
        trends: never[];
    }>;
    getWorkloadDistribution(req: any): Promise<({
        agent: {
            email: string;
            firstName: string;
            lastName: string;
        } | null;
        activeTickets: number;
    } | null)[]>;
    getSatisfactionMetrics(req: any, period?: string): Promise<{
        period: string;
        totalFeedback: number;
        averageRating: number;
        distribution: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.ArticleFeedbackGroupByOutputType, "isLike"[]> & {
            _count: {
                isLike: number;
            };
        })[];
    }>;
    getEscalationStats(req: any): Promise<{
        escalatedTickets: number;
    }>;
    getDepartmentStats(req: any): Promise<{
        department: string;
        ticketCount: number;
    }[]>;
    getQueueStatus(req: any): Promise<{
        unassigned: number;
        inProgress: number;
        pending: number;
        overdue: number;
    }>;
    getOverdueTickets(req: any, limit?: number): Promise<({
        department: {
            name: string;
        } | null;
        creator: {
            firstName: string;
            lastName: string;
        };
        assignee: {
            firstName: string;
            lastName: string;
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
    })[]>;
    getRecentActivity(req: any, limit?: number): Promise<({
        user: {
            firstName: string;
            lastName: string;
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
    exportData(req: any, format?: string, type?: string): Promise<{
        message: string;
        downloadUrl: string;
    }>;
}
