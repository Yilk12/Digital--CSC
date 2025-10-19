import { KnowledgeBaseAnalyticsService } from "./analytics.service";
export declare class KnowledgeBaseAnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: KnowledgeBaseAnalyticsService);
    getOverview(req: any): Promise<{
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
    getArticlePerformance(req: any, period?: string, limit?: number): Promise<{
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
    getArticleTrends(req: any, period?: string, groupBy?: string): Promise<{
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
    getCategoryPerformance(req: any): Promise<{
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
    getSearchAnalytics(period?: string): Promise<{
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
    getUserEngagement(period?: string): Promise<{
        period: string;
        metrics: {
            activeUsers: number;
            totalSessions: number;
            avgSessionDuration: number;
            bounceRate: string;
            engagementActions: {};
        };
    }>;
    getContentGaps(req: any): Promise<{
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
    getAuthorPerformance(period?: string): Promise<{
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
    getLanguageDistribution(req: any): Promise<{
        distribution: {
            language: import("@prisma/client").$Enums.Language;
            articleCount: number;
            totalViews: number;
            totalLikes: number;
        }[];
    }>;
    getFeedbackAnalytics(req: any, period?: string): Promise<{
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
    getROIMetrics(period?: string): Promise<{
        period: string;
        roi: {
            totalViews: number;
            ticketReduction: string;
            selfServiceRate: string;
            estimatedCostSavings: number;
            roiPercentage: string;
        };
    }>;
    getContentLifecycle(req: any): Promise<{
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
    getPopularTags(period?: string, limit?: number): Promise<{
        period: string;
        tags: {
            tag: any;
            count: any;
            totalViews: any;
            avgViewsPerArticle: string;
        }[];
    }>;
    getHealthScore(req: any): Promise<{
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
    getComparativeAnalytics(currentPeriod?: string, previousPeriod?: string): Promise<{
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
    getRealtimeActivity(req: any, limit?: number): Promise<{
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
    exportAnalytics(req: any, type?: string, format?: string, period?: string): Promise<{
        exportId: string;
        filename: string;
        downloadUrl: string;
        data: any;
    }>;
}
