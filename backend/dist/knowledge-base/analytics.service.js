"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let KnowledgeBaseAnalyticsService = class KnowledgeBaseAnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverviewStats(userId, userRole) {
        const where = this.buildWhereClause(userId, userRole);
        const [totalArticles, publishedArticles, totalViews, totalLikes, totalComments, avgRating] = await Promise.all([
            this.prisma.article.count({ where }),
            this.prisma.article.count({ where: Object.assign(Object.assign({}, where), { status: client_1.ArticleStatus.PUBLISHED }) }),
            this.prisma.article.aggregate({
                where,
                _sum: { viewCount: true }
            }),
            this.prisma.article.aggregate({
                where,
                _sum: { likeCount: true }
            }),
            this.prisma.articleComment.count({
                where: { article: where }
            }),
            this.calculateAverageRating(where)
        ]);
        return {
            summary: {
                totalArticles,
                publishedArticles,
                totalViews: totalViews._sum.viewCount || 0,
                totalLikes: totalLikes._sum.likeCount || 0,
                totalComments,
                totalSearches: 0,
                averageRating: avgRating,
                publishRate: totalArticles > 0 ? ((publishedArticles / totalArticles) * 100).toFixed(2) : 0
            },
            recentActivity: []
        };
    }
    async getArticlePerformance(period, limit, userRole) {
        const dateRange = this.getDateRange(period);
        const where = {
            status: client_1.ArticleStatus.PUBLISHED,
            createdAt: { gte: dateRange.start, lte: dateRange.end }
        };
        const topArticles = await this.prisma.article.findMany({
            where,
            orderBy: [
                { viewCount: "desc" },
                { likeCount: "desc" },
                { createdAt: "desc" }
            ],
            take: limit,
            include: {
                author: { select: { firstName: true, lastName: true } },
                category: { select: { name: true } },
                tags: { include: { tag: { select: { name: true } } } },
                _count: {
                    select: { comments: true, feedback: true }
                }
            }
        });
        const performanceMetrics = await Promise.all(topArticles.map(async (article) => {
            var _a;
            const [viewTrend, engagementRate] = await Promise.all([
                this.calculateViewTrend(article.id, period),
                this.calculateEngagementRate(article.id)
            ]);
            return {
                id: article.id,
                tagCount: 0,
                author: `${article.author.firstName} ${article.author.lastName}`,
                tags: [],
                category: ((_a = article.category) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
                viewCount: true,
                views: article.viewCount,
                likes: article.likeCount,
                comments: article._count.comments,
                feedback: article._count.feedback,
                engagementRate,
                viewTrend,
                createdAt: article.createdAt,
                lastUpdated: article.updatedAt
            };
        }));
        return {
            period,
            articles: performanceMetrics,
            summary: {
                totalViews: topArticles.reduce((sum, article) => sum + article.viewCount, 0),
                totalLikes: topArticles.reduce((sum, article) => sum + article.likeCount, 0),
                avgViewsPerArticle: topArticles.length > 0
                    ? (topArticles.reduce((sum, article) => sum + article.viewCount, 0) / topArticles.length).toFixed(2)
                    : 0
            }
        };
    }
    async getArticleTrends(period, groupBy = 'day') {
        const dateRange = this.getDateRange(period);
        const articles = await this.prisma.article.findMany({
            where: {
                createdAt: { gte: dateRange.start, lte: dateRange.end }
            },
            select: {
                id: true,
                title: true,
                createdAt: true,
                viewCount: true,
                likeCount: true,
                status: true
            },
            orderBy: { createdAt: "asc" }
        });
        const trends = this.groupDataByTime(articles, groupBy, [
            { field: "views", label: "Views" },
            { field: "likes", label: "Likes" },
            { field: "articles", label: "Articles Created" }
        ]);
        return {
            period,
            groupBy,
            trends: [],
            summary: {
                totalArticles: articles.length,
                totalViews: articles.reduce((sum, article) => sum + article.viewCount, 0),
                totalLikes: articles.reduce((sum, article) => sum + article.likeCount, 0)
            },
            articles: articles.map(a => ({ id: a.id, title: a.title, viewCount: a.viewCount, likeCount: a.likeCount }))
        };
    }
    async getCategoryPerformance(userRole) {
        var _a;
        const categories = await this.prisma.category.findMany({
            where: { isActive: true },
            include: {
                articles: {
                    where: { status: client_1.ArticleStatus.PUBLISHED },
                    select: {
                        id: true,
                        title: true,
                        viewCount: true,
                        likeCount: true,
                        _count: {
                            select: { comments: true }
                        }
                    }
                },
                _count: {
                    select: { articles: true }
                }
            }
        });
        const categoryPerformance = categories.map(category => {
            const articles = category.articles;
            const totalViews = articles.reduce((sum, article) => sum + article.viewCount, 0);
            const totalLikes = articles.reduce((sum, article) => sum + article.likeCount, 0);
            const totalComments = articles.reduce((sum, article) => sum + article._count.comments, 0);
            return {
                id: category.id,
                name: category.name,
                slug: category.name.toLowerCase().replace(/\s+/g, '-'),
                articleCount: category._count.articles,
                totalViews,
                totalLikes,
                totalComments,
                avgViewsPerArticle: articles.length > 0 ? (totalViews / articles.length).toFixed(2) : 0,
                engagementScore: this.calculateCategoryEngagement(totalViews, totalLikes, totalComments)
            };
        });
        return {
            categories: categoryPerformance.sort((a, b) => b.engagementScore - a.engagementScore),
            summary: {
                totalCategories: categories.length,
                totalArticles: categoryPerformance.reduce((sum, cat) => sum + cat.articleCount, 0),
                mostPopularCategory: ((_a = categoryPerformance[0]) === null || _a === void 0 ? void 0 : _a.name) || "N/A"
            }
        };
    }
    async getSearchAnalytics(period) {
        const dateRange = this.getDateRange(period);
        const [totalSearches, uniqueQueries, searchAnalytics, popularSearches, searchTrends, clickThroughRates, noResultQueries] = await Promise.all([
            Promise.resolve({ _sum: { searchCount: 0 } }),
            Promise.resolve(0),
            Promise.resolve([]),
            Promise.resolve(0),
            Promise.resolve([]),
            Promise.resolve([]),
            Promise.resolve(0)
        ]);
        return {
            period,
            summary: {
                totalSearches: totalSearches._sum.searchCount || 0,
                uniqueQueries,
                noResultQueries,
                searchSuccessRate: uniqueQueries > 0 ? (((uniqueQueries - noResultQueries) / uniqueQueries) * 100).toFixed(2) : 0
            },
            topQueries: [],
            trends: searchTrends
        };
    }
    async getUserEngagement(period) {
        const dateRange = this.getDateRange(period);
        const [activeUsers, totalSessions, avgSessionDuration, bounceRate, engagementActions] = await Promise.all([
            this.prisma.user.count({
                where: {
                    updatedAt: { gte: dateRange.start, lte: dateRange.end }
                }
            }),
            Promise.resolve(0),
            this.calculateAvgSessionDuration(dateRange),
            this.calculateBounceRate(dateRange),
            this.getEngagementActions(dateRange)
        ]);
        return {
            period,
            metrics: {
                activeUsers,
                totalSessions,
                avgSessionDuration,
                bounceRate,
                engagementActions
            }
        };
    }
    async getContentGapAnalysis() {
        const [frequentSearches, lowPerformingArticles, missingTopics, categoryGaps] = await Promise.all([
            Promise.resolve([]),
            this.prisma.article.findMany({
                where: {
                    status: client_1.ArticleStatus.PUBLISHED,
                    viewCount: { gte: 100 },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
                include: {
                    category: { select: { name: true } }
                }
            }),
            this.identifyMissingTopics(),
            this.analyzeCategoryGaps()
        ]);
        return {
            contentGaps: {
                frequentSearchesWithFewResults: frequentSearches,
                lowPerformingArticles,
                suggestedTopics: missingTopics,
                categoryGaps
            },
            recommendations: this.generateContentRecommendations(frequentSearches, categoryGaps)
        };
    }
    async getAuthorPerformance(period) {
        const dateRange = this.getDateRange(period);
        const authors = await this.prisma.user.findMany({
            where: { role: { in: [client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT_AGENT] } },
            include: {
                createdArticles: {
                    select: { id: true, title: true, viewCount: true, likeCount: true, status: true, _count: { select: { comments: true } } }
                }
            }
        });
        const authorPerformance = authors.map(author => {
            const articles = author.createdArticles;
            const publishedArticles = articles.filter(article => article.status === client_1.ArticleStatus.PUBLISHED);
            const totalViews = publishedArticles.reduce((sum, article) => sum + article.viewCount, 0);
            const totalLikes = publishedArticles.reduce((sum, article) => sum + article.likeCount, 0);
            return {
                author: `${author.firstName} ${author.lastName}`,
                email: author.email,
                articlesCreated: articles.length,
                articlesPublished: publishedArticles.length,
                totalViews,
                totalLikes,
                avgViewsPerArticle: publishedArticles.length > 0 ? (totalViews / publishedArticles.length).toFixed(2) : 0,
                engagementRate: publishedArticles.length > 0 ? ((publishedArticles.reduce((sum, article) => sum + article.likeCount, 0) + publishedArticles.reduce((sum, article) => sum + article._count.comments, 0)) / totalViews * 100).toFixed(2) : '0'
            };
        });
        return {
            period,
            authors: authorPerformance.sort((a, b) => b.totalViews - a.totalViews)
        };
    }
    async getLanguageDistribution(userRole) {
        const languageStats = await this.prisma.article.groupBy({
            by: ["language"],
            where: { status: client_1.ArticleStatus.PUBLISHED },
            _count: { language: true },
            _sum: { viewCount: true, likeCount: true }
        });
        return {
            distribution: languageStats.map(stat => {
                var _a, _b, _c;
                return ({
                    language: stat.language,
                    articleCount: ((_a = stat._count) === null || _a === void 0 ? void 0 : _a.language) || 0,
                    totalViews: ((_b = stat._sum) === null || _b === void 0 ? void 0 : _b.viewCount) || 0,
                    totalLikes: ((_c = stat._sum) === null || _c === void 0 ? void 0 : _c.likeCount) || 0
                });
            }).sort((a, b) => b.articleCount - a.articleCount)
        };
    }
    async getFeedbackAnalytics(period) {
        const dateRange = this.getDateRange(period);
        const feedback = await this.prisma.articleFeedback.findMany({
            where: {
                createdAt: { gte: dateRange.start, lte: dateRange.end }
            },
            include: {
                article: { select: { title: true, author: { select: { firstName: true, lastName: true } } } }
            }
        });
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        feedback.forEach(f => {
            const rating = f.isLike ? 5 : 1;
            ratingDistribution[rating]++;
        });
        const avgRating = feedback.reduce((sum, f) => sum + (f.isLike ? 5 : 1), 0) / feedback.length;
        return {
            period,
            summary: {
                totalFeedback: feedback.length,
                averageRating: avgRating,
                ratingDistribution
            },
            recentFeedback: feedback.slice(0, 10).map(f => ({
                articleTitle: f.article.title,
                author: `${f.article.author.firstName} ${f.article.author.lastName}`,
                rating: f.isLike ? 5 : 1,
                comment: null,
                isHelpful: f.isLike,
                createdAt: f.createdAt
            }))
        };
    }
    async getROIMetrics(period) {
        var _a;
        const dateRange = this.getDateRange(period);
        const [kbViews, ticketReduction, selfServiceRate, costSavings] = await Promise.all([
            this.prisma.article.aggregate({
                where: {
                    createdAt: { gte: dateRange.start, lte: dateRange.end }
                },
                _sum: { viewCount: true }
            }),
            this.calculateTicketReduction(dateRange),
            this.calculateSelfServiceRate(dateRange),
            this.calculateCostSavings(dateRange)
        ]);
        return {
            period,
            roi: {
                totalViews: ((_a = kbViews._sum) === null || _a === void 0 ? void 0 : _a.viewCount) || 0,
                ticketReduction,
                selfServiceRate,
                estimatedCostSavings: costSavings,
                roiPercentage: this.calculateROIPercentage(costSavings)
            }
        };
    }
    async getContentLifecycleAnalytics() {
        const [draftArticles, reviewArticles, publishedArticles, archivedArticles, outdatedArticles] = await Promise.all([
            this.prisma.article.count({ where: { status: client_1.ArticleStatus.DRAFT } }),
            this.prisma.article.count({ where: { status: client_1.ArticleStatus.REVIEW } }),
            this.prisma.article.count({ where: { status: client_1.ArticleStatus.PUBLISHED } }),
            this.prisma.article.count({ where: { status: client_1.ArticleStatus.ARCHIVED } }),
            this.prisma.article.count({
                where: {
                    status: client_1.ArticleStatus.PUBLISHED,
                    updatedAt: { lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
                }
            })
        ]);
        return {
            lifecycle: {
                draft: draftArticles,
                review: reviewArticles,
                published: publishedArticles,
                archived: archivedArticles,
                outdated: outdatedArticles
            },
            recommendations: {
                needsReview: outdatedArticles,
                readyToPublish: reviewArticles
            }
        };
    }
    async getPopularTags(period, limit) {
        const dateRange = this.getDateRange(period);
        const articles = await this.prisma.article.findMany({
            where: {
                createdAt: { gte: dateRange.start, lte: dateRange.end },
                status: client_1.ArticleStatus.PUBLISHED
            },
            select: { tags: true, viewCount: true }
        });
        const tagStats = new Map();
        articles.forEach(article => {
            if (article.tags) {
                article.tags.forEach(tag => {
                    if (!tagStats.has(tag)) {
                        tagStats.set(tag, { count: 0, views: 0 });
                    }
                    const stats = tagStats.get(tag);
                    stats.count++;
                    stats.views += article.viewCount;
                });
            }
        });
        const popularTags = Array.from(tagStats.entries())
            .map(([tag, stats]) => ({
            tag,
            count: stats.count,
            totalViews: stats.views,
            avgViewsPerArticle: (stats.views / stats.count).toFixed(2)
        }))
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, limit);
        return {
            period,
            tags: popularTags
        };
    }
    async getKnowledgeBaseHealthScore() {
        const [totalArticles, publishedArticles, recentlyUpdated, highPerforming, lowPerforming, avgRating] = await Promise.all([
            this.prisma.article.count(),
            this.prisma.article.count({ where: { status: client_1.ArticleStatus.PUBLISHED } }),
            this.prisma.article.count({
                where: {
                    updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                }
            }),
            this.prisma.article.count({
                where: { viewCount: { gte: 100 }, status: client_1.ArticleStatus.PUBLISHED }
            }),
            this.prisma.article.count({
                where: { viewCount: { lt: 10 }, status: client_1.ArticleStatus.PUBLISHED }
            }),
            this.calculateAverageRating({})
        ]);
        const healthMetrics = {
            contentFreshness: totalArticles > 0 ? (recentlyUpdated / totalArticles * 100).toFixed(2) : 0,
            publishRate: totalArticles > 0 ? (publishedArticles / totalArticles * 100).toFixed(2) : 0,
            performanceRate: publishedArticles > 0 ? (highPerforming / publishedArticles * 100).toFixed(2) : 0,
            qualityScore: avgRating * 20,
            overallHealth: 0
        };
        const contentFresh = typeof healthMetrics.contentFreshness === 'number' ? healthMetrics.contentFreshness : parseFloat(healthMetrics.contentFreshness.toString());
        const publishR = typeof healthMetrics.publishRate === 'number' ? healthMetrics.publishRate : parseFloat(healthMetrics.publishRate.toString());
        const performR = typeof healthMetrics.performanceRate === 'number' ? healthMetrics.performanceRate : parseFloat(healthMetrics.performanceRate.toString());
        healthMetrics.overallHealth = parseFloat((contentFresh * 0.25 +
            publishR * 0.25 +
            performR * 0.25 +
            healthMetrics.qualityScore * 0.25).toFixed(2));
        return {
            healthScore: typeof healthMetrics.overallHealth === 'string' ? parseFloat(healthMetrics.overallHealth) : healthMetrics.overallHealth,
            metrics: healthMetrics,
            recommendations: this.generateHealthRecommendations(healthMetrics)
        };
    }
    async getComparativeAnalytics(currentPeriod, previousPeriod) {
        const currentRange = this.getDateRange(currentPeriod);
        const previousRange = this.getDateRange(previousPeriod);
        const [currentStats, previousStats] = await Promise.all([
            this.getBasicStats(currentRange),
            this.getBasicStats(previousRange)
        ]);
        const comparison = {
            articles: this.calculateChange(currentStats.articles, previousStats.articles),
            views: this.calculateChange(currentStats.views, previousStats.views),
            likes: this.calculateChange(currentStats.likes, previousStats.likes),
            searches: this.calculateChange(currentStats.searches, previousStats.searches)
        };
        return {
            current: { period: currentPeriod, stats: currentStats },
            previous: { period: previousPeriod, stats: previousStats },
            comparison
        };
    }
    async getRealtimeActivity(limit, userRole) {
        const activities = await this.prisma.auditLog.findMany({
            where: {
                entity: { in: ["ARTICLE", "CATEGORY"] }
            },
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { firstName: true, lastName: true } }
            }
        });
        return {
            activities: activities.map(activity => ({
                id: activity.id,
                action: activity.action,
                entity: activity.entity,
                entityId: activity.entityId,
                user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown User',
                timestamp: activity.createdAt,
                description: this.formatActivityDescription(activity)
            }))
        };
    }
    async exportAnalyticsData(type, format, period, userId) {
        let data = {};
        switch (type) {
            case "overview":
                data = await this.getOverviewStats(userId, client_1.UserRole.ADMIN);
                break;
            case "articles":
                data = await this.getArticlePerformance(period, 50, client_1.UserRole.ADMIN);
                break;
            case "search":
                data = await this.getSearchAnalytics(period);
                break;
            case "engagement":
                data = await this.getUserEngagement(period);
                break;
        }
        const exportId = `analytics-${type}-${Date.now()}`;
        const filename = `${exportId}.${format}`;
        return {
            exportId,
            filename,
            downloadUrl: `/api/knowledge-base/analytics/download/${exportId}`,
            data: format === "json" ? data : undefined
        };
    }
    buildWhereClause(userId, userRole) {
        const where = {};
        if (userRole === client_1.UserRole.SUPPORT_AGENT) {
            where.authorId = userId;
        }
        return where;
    }
    getDateRange(period) {
        const now = new Date();
        const start = new Date();
        switch (period) {
            case "day":
                start.setDate(now.getDate() - 1);
                break;
            case "week":
                start.setDate(now.getDate() - 7);
                break;
            case "month":
                start.setMonth(now.getMonth() - 1);
                break;
            case "3months":
                start.setMonth(now.getMonth() - 3);
                break;
            case "year":
                start.setFullYear(now.getFullYear() - 1);
                break;
            case "previousMonth":
                start.setMonth(now.getMonth() - 2);
                const end = new Date();
                end.setMonth(now.getMonth() - 1);
                return { start, end };
            default:
                start.setMonth(now.getMonth() - 1);
        }
        return { start, end: now };
    }
    async calculateAverageRating(where) {
        const feedback = await this.prisma.articleFeedback.findMany({
            where: { article: where },
            select: { isLike: true }
        });
        if (feedback.length === 0)
            return 0;
        const totalRating = feedback.reduce((sum, f) => sum + (f.isLike ? 5 : 1), 0);
        return parseFloat((totalRating / feedback.length).toFixed(2));
    }
    async calculateViewTrend(articleId, period) {
        return "up";
    }
    async calculateEngagementRate(articleId) {
        const article = await this.prisma.article.findUnique({
            where: { id: articleId },
            include: {
                _count: { select: { comments: true, feedback: true } }
            }
        });
        if (!article || article.viewCount === 0)
            return "0";
        const engagements = article.likeCount + article._count.comments + article._count.feedback;
        const rate = (engagements / article.viewCount * 100).toFixed(2);
        return rate;
    }
    calculateCategoryEngagement(views, likes, comments) {
        return views * 0.1 + likes * 2 + comments * 3;
    }
    groupDataByTime(data, groupBy, metrics) {
        return [];
    }
    async getSearchTrends(dateRange) {
        return [];
    }
    async calculateAvgSessionDuration(dateRange) {
        return 0;
    }
    async calculateBounceRate(dateRange) {
        return "0";
    }
    async getEngagementActions(dateRange) {
        return {};
    }
    async identifyMissingTopics() {
        return [];
    }
    async analyzeCategoryGaps() {
        return [];
    }
    generateContentRecommendations(searches, gaps) {
        return [];
    }
    async calculateTicketReduction(dateRange) {
        return "0";
    }
    async calculateSelfServiceRate(dateRange) {
        return "0";
    }
    async calculateCostSavings(dateRange) {
        return 0;
    }
    calculateROIPercentage(costSavings) {
        return "0";
    }
    async getBasicStats(dateRange) {
        const [articles, views, likes, searches] = await Promise.all([
            this.prisma.article.count({
                where: { createdAt: { gte: dateRange.start, lte: dateRange.end } }
            }),
            this.prisma.article.aggregate({
                where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
                _sum: { viewCount: true, likeCount: true }
            }),
            this.prisma.article.aggregate({
                where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
                _sum: { likeCount: true }
            }),
            Promise.resolve({ _sum: { searchCount: 0 } })
        ]);
        return {
            articles,
            views: views._sum.viewCount || 0,
            likes: likes._sum.likeCount || 0,
            searches: searches._sum.searchCount || 0
        };
    }
    calculateChange(current, previous) {
        if (previous === 0)
            return { value: current, percentage: "0", trend: "neutral" };
        const change = current - previous;
        const percentage = ((change / previous) * 100).toFixed(2);
        const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral";
        return { value: current, change, percentage, trend };
    }
    generateHealthRecommendations(metrics) {
        const recommendations = [];
        if (parseFloat(metrics.contentFreshness) < 50) {
            recommendations.push("Update older articles to improve content freshness");
        }
        if (parseFloat(metrics.publishRate) < 80) {
            recommendations.push("Review and publish draft articles");
        }
        if (parseFloat(metrics.performanceRate) < 60) {
            recommendations.push("Optimize low-performing articles");
        }
        return recommendations;
    }
    formatActivityDescription(activity) {
        const actions = {
            CREATE: "created",
            UPDATE: "updated",
            DELETE: "deleted",
            PUBLISH: "published"
        };
        return `${actions[activity.action] || activity.action} ${activity.entity.toLowerCase()}`;
    }
};
exports.KnowledgeBaseAnalyticsService = KnowledgeBaseAnalyticsService;
exports.KnowledgeBaseAnalyticsService = KnowledgeBaseAnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], KnowledgeBaseAnalyticsService);
//# sourceMappingURL=analytics.service.js.map