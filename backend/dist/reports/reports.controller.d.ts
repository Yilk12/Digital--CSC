import { Response } from "express";
import { ReportsService } from "./reports.service";
import { GenerateReportDto } from "./dto/generate-report.dto";
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    generateTicketReport(generateReportDto: GenerateReportDto, req: any): Promise<any>;
    generateAgentPerformanceReport(generateReportDto: GenerateReportDto, req: any): Promise<any>;
    generateSlaReport(generateReportDto: GenerateReportDto, req: any): Promise<any>;
    generateDepartmentReport(generateReportDto: GenerateReportDto, req: any): Promise<any>;
    generateSatisfactionReport(generateReportDto: GenerateReportDto, req: any): Promise<any>;
    generateKnowledgeBaseReport(generateReportDto: GenerateReportDto, req: any): Promise<any>;
    getReportTemplates(req: any): Promise<{
        id: string;
        name: string;
        description: string;
    }[]>;
    getReportHistory(req: any, page?: number, limit?: number): Promise<{
        reports: never[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    downloadReport(reportId: string, req: any, res: Response): Promise<void>;
    scheduleReport(body: {
        reportType: string;
        parameters: any;
        frequency: "daily" | "weekly" | "monthly";
        recipients: string[];
    }, req: any): Promise<any>;
    getScheduledReports(req: any): Promise<any>;
    cancelScheduledReport(scheduleId: string, req: any): Promise<any>;
    getReportStatistics(req: any): Promise<{
        totalReports: number;
        reportsThisMonth: number;
        scheduledReports: number;
        avgGenerationTime: number;
    }>;
    exportDashboardData(req: any, format?: string): Promise<any>;
}
