import { type $Enums } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationService } from "../common/notification.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
export declare class FeedbackService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationService);
    listDepartments(): Promise<{
        id: string;
        name: string;
        nameAm: string | null;
    }[]>;
    createFeedback(dto: CreateFeedbackDto, user?: {
        userId: string;
        role: $Enums.UserRole;
    } | null): Promise<any>;
    listFeedback(query: {
        departmentId?: string;
        type?: $Enums.FeedbackType;
        from?: Date;
        to?: Date;
    }, requester: {
        userId: string;
        role: $Enums.UserRole;
        department?: string | null;
    }): Promise<any>;
}
