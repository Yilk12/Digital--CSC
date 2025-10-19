import { type $Enums } from "@prisma/client";
export declare class CreateFeedbackDto {
    type: $Enums.FeedbackType;
    departmentId: string;
    articleId?: string;
    ticketId?: string;
    rating?: number;
    helpful?: boolean;
    comments?: string;
    attachmentPath?: string;
    anonymous?: boolean;
    role?: $Enums.UserRole;
    experienceClarity?: boolean;
    resolutionOutcome?: boolean;
    departmentImpact?: string;
    processTrainingImprovements?: string;
    strategicImpact?: string;
    escalationPriority?: $Enums.EscalationPriority;
}
