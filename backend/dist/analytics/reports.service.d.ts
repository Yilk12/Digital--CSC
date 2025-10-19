import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    generateTicketReport(startDate: Date, endDate: Date, format?: "json" | "csv", userRole?: UserRole, userId?: string): Promise<string | {
        data: {
            id: string;
            title: string;
            status: import("@prisma/client").$Enums.TicketStatus;
            priority: import("@prisma/client").$Enums.TicketPriority;
            category: import("@prisma/client").$Enums.TicketCategory;
            createdAt: Date;
            resolvedAt: Date | null;
            slaDeadline: Date | null;
            creator: string;
            creatorEmail: string;
            creatorDepartment: string | null;
            assignee: string | null;
            assigneeEmail: string | undefined;
            department: string | undefined;
            commentsCount: number;
            attachmentsCount: number;
            resolutionTime: number | null;
            slaCompliant: boolean;
        }[];
        summary: {
            total: number;
            byStatus: any;
            byPriority: any;
            byCategory: any;
            avgResolutionTime: number;
            slaCompliance: number;
        };
    }>;
    generateKnowledgeBaseReport(startDate: Date, endDate: Date, format?: "json" | "csv", userRole?: UserRole, userId?: string): Promise<string | {
        data: {
            id: string;
            title: string;
            titleAm: string | null;
            status: import("@prisma/client").$Enums.ArticleStatus;
            language: import("@prisma/client").$Enums.Language;
            createdAt: Date;
            publishedAt: Date | null;
            expiresAt: Date | null;
            author: string;
            authorEmail: string;
            category: string | undefined;
            tags: string;
            viewCount: number;
            likeCount: number;
            dislikeCount: number;
            commentsCount: number;
            feedbackCount: number;
            engagementRate: number;
        }[];
        summary: {
            total: number;
            byStatus: any;
            byLanguage: any;
            totalViews: number;
            totalLikes: number;
            avgEngagement: number;
        };
    }>;
    generateUserReport(startDate: Date, endDate: Date, format?: "json" | "csv"): Promise<string | {
        data: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            userType: import("@prisma/client").$Enums.UserType;
            department: string | null;
            isActive: boolean;
            createdAt: Date;
            ticketsCreated: any;
            ticketsAssigned: any;
            articlesCreated: any;
            ticketComments: any;
            articleComments: any;
            totalActivity: any;
        }[];
        summary: {
            total: number;
            byRole: any;
            byUserType: any;
            active: number;
            inactive: number;
        };
    }>;
    generatePerformanceReport(startDate: Date, endDate: Date, format?: "json" | "csv"): Promise<string | {
        data: {
            id: string;
            name: string;
            email: string;
            department: string | null;
            ticketsAssigned: number;
            ticketsResolved: number;
            resolutionRate: number;
            avgResolutionTime: number;
            slaCompliance: number;
            articlesCreated: number;
            articlesPublished: number;
            totalArticleViews: number;
            totalArticleLikes: number;
            performanceScore: number;
        }[];
        summary: {
            totalAgents: number;
            avgResolutionRate: number;
            avgSlaCompliance: number;
            topPerformers: {
                id: string;
                name: string;
                email: string;
                department: string | null;
                ticketsAssigned: number;
                ticketsResolved: number;
                resolutionRate: number;
                avgResolutionTime: number;
                slaCompliance: number;
                articlesCreated: number;
                articlesPublished: number;
                totalArticleViews: number;
                totalArticleLikes: number;
                performanceScore: number;
            }[];
        };
    }>;
    private convertToCSV;
    private groupBy;
    private calculateAvgResolutionTime;
    private calculateSlaCompliance;
    private calculatePerformanceScore;
}
