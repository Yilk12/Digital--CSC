import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "@prisma/client";
export declare class KnowledgeBaseAnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getOverviewStats(userId: string, userRole: UserRole): Promise<{
        summary: {
            totalArticles: number;
            publishedArticles: number;
            totalViews: number;
            totalLikes: number;
            totalComments: number;
            totalSearches: number;
            averageRating: number;
            publishRate: string | number;
        };
        recentActivity: never[];
    }>;
    getArticlePerformance(period: string, limit: number, userRole: UserRole): Promise<{
        period: string;
        articles: {
            id: string;
            tagCount: number;
            author: string;
            tags: never[];
            category: string;
            viewCount: boolean;
            views: number;
            likes: number;
            comments: number;
            feedback: number;
            engagementRate: string;
            viewTrend: string;
            createdAt: Date;
            lastUpdated: Date;
        }[];
        summary: {
            totalViews: number;
            totalLikes: number;
            avgViewsPerArticle: string | number;
        };
    }>;
    getArticleTrends(period: string, groupBy?: string): Promise<{
        period: string;
        groupBy: string;
        trends: never[];
        summary: {
            totalArticles: number;
            totalViews: number;
            totalLikes: number;
        };
        articles: {
            id: string;
            title: string;
            viewCount: number;
            likeCount: number;
        }[];
    }>;
    getCategoryPerformance(userRole: UserRole): Promise<{
        categories: {
            id: string;
            name: string;
            slug: string;
            articleCount: number;
            totalViews: number;
            totalLikes: number;
            totalComments: number;
            avgViewsPerArticle: string | number;
            engagementScore: number;
        }[];
        summary: {
            totalCategories: number;
            totalArticles: number;
            mostPopularCategory: string;
        };
    }>;
    getSearchAnalytics(period: string): Promise<{
        period: string;
        summary: {
            totalSearches: number;
            uniqueQueries: number;
            noResultQueries: number;
            searchSuccessRate: string | number;
        };
        topQueries: never[];
        trends: never[];
    }>;
    getUserEngagement(period: string): Promise<{
        period: string;
        metrics: {
            activeUsers: number;
            totalSessions: number;
            avgSessionDuration: number;
            bounceRate: string;
            engagementActions: {};
        };
    }>;
    getContentGapAnalysis(): Promise<{
        contentGaps: {
            frequentSearchesWithFewResults: never[];
            lowPerformingArticles: ({
                category: {
                    name: string;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                content: string;
                title: string;
                status: import("@prisma/client").$Enums.ArticleStatus;
                titleAm: string | null;
                contentAm: string | null;
                excerpt: string | null;
                language: import("@prisma/client").$Enums.Language;
                viewCount: number;
                likeCount: number;
                dislikeCount: number;
                authorId: string;
                categoryId: string | null;
                publishedAt: Date | null;
                expiresAt: Date | null;
            })[];
            suggestedTopics: never[];
            categoryGaps: never[];
        };
        recommendations: never[];
    }>;
    getAuthorPerformance(period: string): Promise<{
        period: string;
        authors: {
            author: string;
            email: string;
            articlesCreated: number;
            articlesPublished: number;
            totalViews: number;
            totalLikes: number;
            avgViewsPerArticle: string | number;
            engagementRate: string;
        }[];
    }>;
    getLanguageDistribution(userRole: UserRole): Promise<{
        distribution: {
            language: import("@prisma/client").$Enums.Language;
            articleCount: number;
            totalViews: number;
            totalLikes: number;
        }[];
    }>;
    getFeedbackAnalytics(period: string): Promise<{
        period: string;
        summary: {
            totalFeedback: number;
            averageRating: number;
            ratingDistribution: {
                1: number;
                2: number;
                3: number;
                4: number;
                5: number;
            };
        };
        recentFeedback: {
            articleTitle: string;
            author: string;
            rating: number;
            comment: null;
            isHelpful: boolean;
            createdAt: Date;
        }[];
    }>;
    getROIMetrics(period: string): Promise<{
        period: string;
        roi: {
            totalViews: number;
            ticketReduction: string;
            selfServiceRate: string;
            estimatedCostSavings: number;
            roiPercentage: string;
        };
    }>;
    getContentLifecycleAnalytics(): Promise<{
        lifecycle: {
            draft: number;
            review: number;
            published: number;
            archived: number;
            outdated: number;
        };
        recommendations: {
            needsReview: number;
            readyToPublish: number;
        };
    }>;
    getPopularTags(period: string, limit: number): Promise<{
        period: string;
        tags: {
            tag: any;
            count: any;
            totalViews: any;
            avgViewsPerArticle: string;
        }[];
    }>;
    getKnowledgeBaseHealthScore(): Promise<{
        healthScore: number;
        metrics: {
            contentFreshness: string | number;
            publishRate: string | number;
            performanceRate: string | number;
            qualityScore: number;
            overallHealth: number;
        };
        recommendations: never[];
    }>;
    getComparativeAnalytics(currentPeriod: string, previousPeriod: string): Promise<{
        current: {
            period: string;
            stats: {
                articles: number;
                views: number;
                likes: number;
                searches: number;
            };
        };
        previous: {
            period: string;
            stats: {
                articles: number;
                views: number;
                likes: number;
                searches: number;
            };
        };
        comparison: {
            articles: {
                value: number;
                percentage: string;
                trend: string;
                change?: undefined;
            } | {
                value: number;
                change: number;
                percentage: string;
                trend: string;
            };
            views: {
                value: number;
                percentage: string;
                trend: string;
                change?: undefined;
            } | {
                value: number;
                change: number;
                percentage: string;
                trend: string;
            };
            likes: {
                value: number;
                percentage: string;
                trend: string;
                change?: undefined;
            } | {
                value: number;
                change: number;
                percentage: string;
                trend: string;
            };
            searches: {
                value: number;
                percentage: string;
                trend: string;
                change?: undefined;
            } | {
                value: number;
                change: number;
                percentage: string;
                trend: string;
            };
        };
    }>;
    getRealtimeActivity(limit: number, userRole: UserRole): Promise<{
        activities: {
            id: string;
            action: string;
            entity: string;
            entityId: string;
            user: string;
            timestamp: Date;
            description: string;
        }[];
    }>;
    exportAnalyticsData(type: string, format: string, period: string, userId: string): Promise<{
        exportId: string;
        filename: string;
        downloadUrl: string;
        data: any;
    }>;
    private buildWhereClause;
    private getDateRange;
    private calculateAverageRating;
    private calculateViewTrend;
    private calculateEngagementRate;
    private calculateCategoryEngagement;
    private groupDataByTime;
    private getSearchTrends;
    private calculateAvgSessionDuration;
    private calculateBounceRate;
    private getEngagementActions;
    private identifyMissingTopics;
    private analyzeCategoryGaps;
    private generateContentRecommendations;
    private calculateTicketReduction;
    private calculateSelfServiceRate;
    private calculateCostSavings;
    private calculateROIPercentage;
    private getBasicStats;
    private calculateChange;
    private generateHealthRecommendations;
    private formatActivityDescription;
}
