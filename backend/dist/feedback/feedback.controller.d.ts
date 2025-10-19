import { FeedbackService } from "./feedback.service";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { type $Enums } from "@prisma/client";
export declare class FeedbackController {
    private readonly service;
    constructor(service: FeedbackService);
    listDepartments(): Promise<{
        id: string;
        name: string;
        nameAm: string | null;
    }[]>;
    create(dto: CreateFeedbackDto, req: any): Promise<any>;
    list(req: any, departmentId?: string, type?: $Enums.FeedbackType, from?: string, to?: string): Promise<any>;
}
