import { AbuseReportsService } from './abuse-reports.service';
declare const REPORT_STATUS: readonly ["PENDING", "RESOLVED", "REJECTED"];
type ReportStatus = typeof REPORT_STATUS[number];
declare const REPORT_TARGET_TYPES: readonly ["USER", "ARTICLE", "TICKET", "POST", "COMMENT"];
type ReportTargetType = typeof REPORT_TARGET_TYPES[number];
declare class CreateAbuseReportDto {
    reporterId?: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    description?: string;
}
declare class UpdateAbuseReportStatusDto {
    status: ReportStatus;
}
export declare class AbuseReportsController {
    private readonly service;
    constructor(service: AbuseReportsService);
    create(req: any, dto: CreateAbuseReportDto): Promise<any>;
    list(status?: ReportStatus, targetType?: ReportTargetType, reporterId?: string): Promise<any>;
    updateStatus(id: string, dto: UpdateAbuseReportStatusDto, req: any): Promise<any>;
}
export {};
