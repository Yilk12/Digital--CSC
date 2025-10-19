import { PrismaService } from '../prisma/prisma.service';
export declare class WorkflowService {
    private prisma;
    constructor(prisma: PrismaService);
    distributePlanAssignments(body: {
        planId: string;
        toUsers: string[];
        by: string;
        dueDate?: string;
        notes?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        planId: string;
        dueDate: Date | null;
        notes: string | null;
        fromUserId: string;
        toUserId: string;
        level: string;
    }[]>;
}
