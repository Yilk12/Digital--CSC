import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardOverview(userRole?: UserRole, userId?: string): Promise<{
        tickets: {
            total: number;
            open: number;
            resolved: number;
            overdue: number;
            thisMonth: number;
            thisWeek: number;
            avgResolutionTime: number;
        };
        knowledgeBase: {
            total: number;
            published: number;
            totalViews: number;
            thisMonth: number;
        };
        users: {
            total: number;
            active: number;
        };
        recentActivity: {
            tickets: {
                id: string;
                createdAt: Date;
                title: string;
                status: import("@prisma/client").$Enums.TicketStatus;
                priority: import("@prisma/client").$Enums.TicketPriority;
                creator: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            articles: {
                id: string;
                createdAt: Date;
                title: string;
                status: import("@prisma/client").$Enums.ArticleStatus;
                viewCount: number;
                author: {
                    firstName: string;
                    lastName: string;
                };
            }[];
        };
        agentPerformance: never[] | {
            id: string;
            name: string;
            totalTickets: number;
            resolvedTickets: number;
            resolutionRate: number;
            avgResolutionTime: number;
        }[];
    }>;
    getTicketAnalytics(startDate?: Date, endDate?: Date, userRole?: UserRole, userId?: string): Promise<{
        byStatus: any;
        byPriority: any;
        byCategory: any;
        byDepartment: any;
        dailyTrend: {
            created: number;
            resolved: number;
            date: string;
        }[];
        resolutionTimes: {
            priority: string;
            avgTime: number;
            minTime: number;
            maxTime: number;
            count: number;
        }[];
        slaCompliance: {
            total: number;
            compliant: number;
            breached: number;
            byPriority: {
                [key: string]: {
                    total: number;
                    compliant: number;
                    breached: number;
                };
            };
        };
    }>;
    getKnowledgeBaseAnalytics(startDate?: Date, endDate?: Date, userRole?: UserRole, userId?: string): Promise<{
        byStatus: any;
        byLanguage: any;
        byCategory: any;
        viewTrends: never[];
        topArticles: {
            id: string;
            title: string;
            language: import("@prisma/client").$Enums.Language;
            viewCount: number;
            likeCount: number;
            author: {
                firstName: string;
                lastName: string;
            };
        }[];
        engagementMetrics: {
            totalViews: number;
            totalLikes: number;
            totalDislikes: number;
            totalComments: number;
            avgViewsPerArticle: number;
            engagementRate: number;
        };
    }>;
    getUserAnalytics(): Promise<{
        byRole: any;
        byUserType: any;
        byDepartment: any;
        registrationTrend: {
            date: string;
            count: number;
        }[];
        activityMetrics: {
            activeTicketCreators: number;
            activeArticleAuthors: number;
            activeCommenters: number;
        };
    }>;
    private calculateAvgResolutionTime;
    private getAgentPerformanceMetrics;
    private getTicketDailyTrend;
    private getResolutionTimeAnalytics;
    private getSlaComplianceMetrics;
    private getArticleViewTrends;
    private getTopArticles;
    private getEngagementMetrics;
    private getUserRegistrationTrend;
    private getUserActivityMetrics;
    private formatGroupByResults;
}
