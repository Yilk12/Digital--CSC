import { PrismaService } from '../prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { UserRole } from '@prisma/client';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateTicketReport(generateReportDto: GenerateReportDto, userId: string): Promise<any>;
    generateAgentPerformanceReport(generateReportDto: GenerateReportDto, userId: string): Promise<any>;
    generateSlaReport(generateReportDto: GenerateReportDto, userId: string): Promise<any>;
    generateDepartmentReport(generateReportDto: GenerateReportDto, userId: string): Promise<any>;
    generateSatisfactionReport(generateReportDto: GenerateReportDto, userId: string): Promise<any>;
    generateKnowledgeBaseReport(generateReportDto: GenerateReportDto, userId: string): Promise<any>;
    private getTicketSummary;
    private getSlaStatus;
    private calculateAvgResolutionTime;
    private calculateSlaCompliance;
    private calculateCustomerRating;
    private getSlaByPriority;
    private getRatingDistribution;
    private getSearchStats;
    private calculateNextRunTime;
    private generateReport;
    cancelScheduledReport(scheduleId: string, userId: string): Promise<any>;
    downloadReport(reportId: string, userId: string, userRole: UserRole): Promise<{
        success: boolean;
        mimeType: any;
        filename: any;
        data: Buffer<ArrayBuffer>;
    }>;
    exportDashboardData(format: string, userId: string, userRole: UserRole): Promise<any>;
    getReportTemplates(userRole: UserRole): Promise<{
        id: string;
        name: string;
        description: string;
    }[]>;
    getReportHistory(userId: string, userRole: UserRole, page: number, limit: number): Promise<{
        reports: never[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    scheduleReport(reportType: string, config: any, frequency: string, recipients: string[], userId: string): Promise<any>;
    getScheduledReports(userId: string, userRole: UserRole): Promise<any>;
    getReportStatistics(userRole: UserRole): Promise<{
        totalReports: number;
        reportsThisMonth: number;
        scheduledReports: number;
        avgGenerationTime: number;
    }>;
}
