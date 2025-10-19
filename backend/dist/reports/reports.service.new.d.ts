import { PrismaService } from '../prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { UserRole } from '@prisma/client';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateTicketReport(generateReportDto: GenerateReportDto, userId: string): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
    generateAgentPerformanceReport(generateReportDto: GenerateReportDto, userId: string): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
    generateSlaReport(generateReportDto: GenerateReportDto, userId: string): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
    generateDepartmentReport(generateReportDto: GenerateReportDto, userId: string): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
    generateSatisfactionReport(generateReportDto: GenerateReportDto, userId: string): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
    generateKnowledgeBaseReport(generateReportDto: GenerateReportDto, userId: string): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
    scheduleReport(reportConfig: any, userId: string): Promise<{
        id: string;
        reportType: any;
        frequency: any;
        nextRun: Date;
        userId: string;
    }>;
    cancelScheduledReport(scheduleId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    downloadReport(reportId: string, userId: string): Promise<{
        downloadUrl: string;
        expiresAt: Date;
    }>;
    exportDashboardData(format: string, userId: string, userRole: UserRole): Promise<{
        id: string;
        type: string;
        format: string;
        data: any;
        generatedAt: Date;
        userId: string;
        downloadUrl: string;
    }>;
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
}
