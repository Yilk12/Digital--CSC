import { WorkflowService } from './workflow.service';
export declare class PlanAssignmentsController {
    private readonly workflow;
    constructor(workflow: WorkflowService);
    distribute(body: {
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
