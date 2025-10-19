import { SubmissionsService, GMActionInput } from './submissions.service';
import { $Enums } from '@prisma/client';
declare class CreateSubmissionDto {
    submitterName?: string;
    submitterDepartment?: string;
    contactEmail?: string;
    contactPhone?: string;
    anonymous?: boolean;
    type: $Enums.SubmissionType;
    subject: string;
    description: string;
}
declare class GMActionDto {
    action: GMActionInput['action'];
    decisionSummary?: string;
    assignedDepartmentId?: string;
    escalatedTo?: string;
}
export declare class SubmissionsController {
    private readonly service;
    constructor(service: SubmissionsService);
    create(req: any, dto: CreateSubmissionDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        type: $Enums.SubmissionType;
        status: $Enums.SubmissionStatus;
        userId: string | null;
        submitterName: string | null;
        submitterDepartment: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        anonymous: boolean;
        subject: string;
        decisionSummary: string | null;
        decisionAt: Date | null;
        escalatedTo: string | null;
        gmReviewerId: string | null;
        assignedDepartmentId: string | null;
    }>;
    list(type?: $Enums.SubmissionType, status?: $Enums.SubmissionStatus): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        type: $Enums.SubmissionType;
        status: $Enums.SubmissionStatus;
        userId: string | null;
        submitterName: string | null;
        submitterDepartment: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        anonymous: boolean;
        subject: string;
        decisionSummary: string | null;
        decisionAt: Date | null;
        escalatedTo: string | null;
        gmReviewerId: string | null;
        assignedDepartmentId: string | null;
    }[]>;
    gmAct(id: string, dto: GMActionDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string;
        type: $Enums.SubmissionType;
        status: $Enums.SubmissionStatus;
        userId: string | null;
        submitterName: string | null;
        submitterDepartment: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        anonymous: boolean;
        subject: string;
        decisionSummary: string | null;
        decisionAt: Date | null;
        escalatedTo: string | null;
        gmReviewerId: string | null;
        assignedDepartmentId: string | null;
    }>;
}
export {};
