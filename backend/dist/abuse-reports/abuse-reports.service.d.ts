import { PrismaService } from '../prisma/prisma.service';
declare const REPORT_STATUS: readonly ["PENDING", "RESOLVED", "REJECTED"];
type ReportStatus = typeof REPORT_STATUS[number];
declare const REPORT_TARGET_TYPES: readonly ["USER", "ARTICLE", "TICKET", "POST", "COMMENT"];
type ReportTargetType = typeof REPORT_TARGET_TYPES[number];
interface CreateParams {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    description?: string;
}
interface ListParams {
    status?: ReportStatus;
    targetType?: ReportTargetType;
    reporterId?: string;
}
export declare class AbuseReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(params: CreateParams): Promise<any>;
    list(params: ListParams): Promise<any>;
    updateStatus(id: string, status: ReportStatus, actorId: string): Promise<any>;
}
export {};
