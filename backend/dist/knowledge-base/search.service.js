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
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SearchService = class SearchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async searchArticles(params) {
        const { query, language, categoryId, page = 1, limit = 10, userId } = params;
        const skip = (page - 1) * limit;
        const where = {
            status: client_1.ArticleStatus.PUBLISHED,
            OR: [
                { title: { contains: query } },
                { content: { contains: query } },
                { excerpt: { contains: query } }
            ]
        };
        if (language) {
            where.language = language;
        }
        if (categoryId) {
            where.categoryId = categoryId;
        }
        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                include: {
                    author: { select: { id: true, firstName: true, lastName: true } },
                    category: { select: { id: true, name: true } }
                },
                orderBy: { viewCount: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.article.count({ where })
        ]);
        if (userId) {
            await this.trackSearchQuery(query, userId, total);
        }
        return {
            articles: articles.map(article => {
                var _a;
                return ({
                    id: article.id,
                    title: article.title,
                    excerpt: article.excerpt || article.content.substring(0, 200) + '...',
                    author: `${article.author.firstName} ${article.author.lastName}`,
                    category: ((_a = article.category) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
                    viewCount: article.viewCount,
                    likeCount: article.likeCount,
                    createdAt: article.createdAt,
                    language: article.language
                });
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getSearchSuggestions(query, limit = 5) {
        const [titleSuggestions, popularSearches] = await Promise.all([
            this.prisma.article.findMany({
                where: {
                    status: client_1.ArticleStatus.PUBLISHED,
                    title: { contains: query }
                },
                select: { title: true },
                take: limit,
                orderBy: { viewCount: 'desc' }
            }),
            this.prisma.searchQuery.findMany({
                where: {
                    query: { contains: query }
                },
                select: { query: true },
                take: limit,
                orderBy: { createdAt: 'desc' }
            })
        ]);
        const suggestions = [
            ...titleSuggestions.map(article => article.title),
            ...popularSearches.map(search => search.query)
        ];
        return [...new Set(suggestions)].slice(0, limit);
    }
    async getPopularSearches(period, limit) {
        const dateRange = this.getDateRange(period);
        return this.prisma.searchQuery.findMany({
            where: {
                createdAt: {
                    gte: dateRange.start,
                    lte: dateRange.end
                }
            },
            select: {
                query: true,
                results: true
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    async advancedSearch(searchQuery) {
        const where = {
            status: client_1.ArticleStatus.PUBLISHED
        };
        if (searchQuery.title) {
            where.title = { contains: searchQuery.title };
        }
        if (searchQuery.content) {
            where.content = { contains: searchQuery.content };
        }
        if (searchQuery.authorId) {
            where.authorId = searchQuery.authorId;
        }
        if (searchQuery.categoryIds && searchQuery.categoryIds.length > 0) {
            where.categoryId = { in: searchQuery.categoryIds };
        }
        if (searchQuery.language) {
            where.language = searchQuery.language;
        }
        if (searchQuery.dateFrom || searchQuery.dateTo) {
            where.createdAt = {};
            if (searchQuery.dateFrom) {
                where.createdAt.gte = new Date(searchQuery.dateFrom);
            }
            if (searchQuery.dateTo) {
                where.createdAt.lte = new Date(searchQuery.dateTo);
            }
        }
        if (searchQuery.minViews) {
            where.viewCount = { gte: searchQuery.minViews };
        }
        const page = searchQuery.page || 1;
        const limit = searchQuery.limit || 10;
        const skip = (page - 1) * limit;
        const orderBy = {};
        const sortBy = searchQuery.sortBy || 'createdAt';
        const sortOrder = searchQuery.sortOrder || 'desc';
        if (sortBy === 'views') {
            orderBy.viewCount = sortOrder;
        }
        else if (sortBy === 'likes') {
            orderBy.likeCount = sortOrder;
        }
        else {
            orderBy.createdAt = sortOrder;
        }
        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                include: {
                    author: { select: { id: true, firstName: true, lastName: true } },
                    category: { select: { id: true, name: true } }
                },
                orderBy,
                skip,
                take: limit
            }),
            this.prisma.article.count({ where })
        ]);
        return {
            articles: articles.map(article => {
                var _a;
                return ({
                    id: article.id,
                    title: article.title,
                    excerpt: article.excerpt || article.content.substring(0, 200) + '...',
                    author: `${article.author.firstName} ${article.author.lastName}`,
                    category: ((_a = article.category) === null || _a === void 0 ? void 0 : _a.name) || 'Uncategorized',
                    viewCount: article.viewCount,
                    likeCount: article.likeCount,
                    createdAt: article.createdAt,
                    language: article.language
                });
            }),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getSearchAnalytics(period) {
        const dateRange = this.getDateRange(period);
        const [totalSearches, uniqueQueries, topQueries] = await Promise.all([
            this.prisma.searchQuery.count({
                where: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                }
            }),
            this.prisma.searchQuery.groupBy({
                by: ['query'],
                where: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                }
            }),
            this.prisma.searchQuery.findMany({
                where: {
                    createdAt: {
                        gte: dateRange.start,
                        lte: dateRange.end
                    }
                },
                take: 10,
                select: {
                    query: true,
                    results: true
                }
            })
        ]);
        return {
            period,
            totalSearches,
            uniqueQueries: uniqueQueries.length,
            topQueries,
            avgResultsPerSearch: totalSearches > 0 ? topQueries.reduce((sum, q) => sum + q.results, 0) / totalSearches : 0
        };
    }
    async trackSearchInteraction(query, action, userId, articleId) {
        const searchQuery = await this.prisma.searchQuery.create({
            data: {
                query,
                userId,
                results: 1
            }
        });
        if (articleId) {
            await this.prisma.searchInteraction.create({
                data: {
                    searchQueryId: searchQuery.id,
                    articleId,
                    action
                }
            });
        }
        return { success: true };
    }
    async getSearchHistory(userId, limit) {
        return this.prisma.searchQuery.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: {
                id: true,
                query: true,
                results: true,
                createdAt: true
            }
        });
    }
    async clearSearchHistory(userId) {
        await this.prisma.searchQuery.deleteMany({
            where: { userId }
        });
        return { message: "Search history cleared successfully" };
    }
    async trackSearchQuery(query, userId, resultCount) {
        const existingQuery = await this.prisma.searchQuery.findFirst({
            where: { query, userId }
        });
        if (existingQuery) {
            await this.prisma.searchQuery.update({
                where: { id: existingQuery.id },
                data: {
                    results: resultCount,
                    createdAt: new Date()
                }
            });
        }
        else {
            await this.prisma.searchQuery.create({
                data: {
                    query,
                    userId,
                    results: resultCount
                }
            });
        }
    }
    getDateRange(period) {
        const now = new Date();
        const start = new Date();
        switch (period) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                break;
            case 'month':
                start.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                start.setFullYear(now.getFullYear() - 1);
                break;
            default:
                start.setDate(now.getDate() - 7);
        }
        return { start, end: now };
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map