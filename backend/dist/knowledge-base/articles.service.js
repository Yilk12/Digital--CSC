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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticlesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ArticlesService = class ArticlesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createArticleDto, authorId, files = []) {
        const { tags } = createArticleDto, articleData = __rest(createArticleDto, ["tags"]);
        const article = await this.prisma.article.create({
            data: Object.assign(Object.assign(Object.assign({}, articleData), { authorId }), (createArticleDto.status === client_1.ArticleStatus.PUBLISHED && {
                publishedAt: new Date(),
            })),
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        if (tags && tags.length > 0) {
            await this.updateArticleTags(article.id, tags);
        }
        if (files && files.length > 0) {
            const data = files.map((file) => ({
                articleId: article.id,
                filename: file.originalname,
                filepath: file.path,
                mimetype: file.mimetype,
                size: file.size,
            }));
            try {
                await this.prisma.articleAttachment.createMany({ data });
            }
            catch (e) {
                console.error('[KB] Failed to persist article attachments', e);
            }
        }
        return this.findOne(article.id);
    }
    async findAll(page = 1, limit = 10, status, language, categoryId, search, authorId, userRole) {
        const skip = (page - 1) * limit;
        const where = {};
        if (userRole === client_1.UserRole.END_USER) {
            where.status = client_1.ArticleStatus.PUBLISHED;
            where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
        }
        if (status)
            where.status = status;
        if (language)
            where.language = language;
        if (categoryId)
            where.categoryId = categoryId;
        if (authorId)
            where.authorId = authorId;
        if (search) {
            where.OR = [
                ...(where.OR || []),
                { title: { contains: search, mode: "insensitive" } },
                { titleAm: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { contentAm: { contains: search, mode: "insensitive" } },
                { excerpt: { contains: search, mode: "insensitive" } },
            ];
        }
        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        },
                    },
                    category: true,
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    _count: {
                        select: {
                            comments: true,
                            feedback: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.article.count({ where }),
        ]);
        return {
            articles,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, incrementView = false) {
        const article = await this.prisma.article.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                category: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                },
                attachments: true,
            },
        });
        if (!article) {
            throw new common_1.NotFoundException("Article not found");
        }
        if (incrementView) {
            await this.prisma.article.update({
                where: { id },
                data: { viewCount: { increment: 1 } },
            });
        }
        return article;
    }
    async update(id, updateArticleDto, userId, userRole) {
        const article = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && article.authorId !== userId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        const { tags } = updateArticleDto, articleData = __rest(updateArticleDto, ["tags"]);
        const updatedArticle = await this.prisma.article.update({
            where: { id },
            data: Object.assign(Object.assign({}, articleData), (updateArticleDto.status === client_1.ArticleStatus.PUBLISHED &&
                article.status !== client_1.ArticleStatus.PUBLISHED && {
                publishedAt: new Date(),
            })),
        });
        if (tags !== undefined) {
            await this.updateArticleTags(id, tags);
        }
        return this.findOne(id);
    }
    async remove(id, userId, userRole) {
        const article = await this.findOne(id);
        if (userRole !== client_1.UserRole.ADMIN && article.authorId !== userId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        await this.prisma.article.delete({
            where: { id },
        });
        return { message: "Article deleted successfully" };
    }
    async addFeedback(articleId, userId, isLike) {
        await this.prisma.articleFeedback.deleteMany({
            where: { articleId, userId },
        });
        const feedback = await this.prisma.articleFeedback.create({
            data: { articleId, userId, isLike },
        });
        const [likeCount, dislikeCount] = await Promise.all([
            this.prisma.articleFeedback.count({
                where: { articleId, isLike: true },
            }),
            this.prisma.articleFeedback.count({
                where: { articleId, isLike: false },
            }),
        ]);
        await this.prisma.article.update({
            where: { id: articleId },
            data: { likeCount, dislikeCount },
        });
        return feedback;
    }
    async addComment(articleId, content, authorId) {
        return this.prisma.articleComment.create({
            data: { articleId, content, authorId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }
    async getArticleStats(authorId) {
        const where = {};
        if (authorId)
            where.authorId = authorId;
        const [total, byStatus, byLanguage, totalViews, totalLikes, mostViewed] = await Promise.all([
            this.prisma.article.count({ where }),
            this.prisma.article.groupBy({
                by: ["status"],
                where,
                _count: { status: true },
            }),
            this.prisma.article.groupBy({
                by: ["language"],
                where,
                _count: { language: true },
            }),
            this.prisma.article.aggregate({
                where,
                _sum: { viewCount: true },
            }),
            this.prisma.article.aggregate({
                where,
                _sum: { likeCount: true },
            }),
            this.prisma.article.findMany({
                where,
                select: {
                    id: true,
                    title: true,
                    viewCount: true,
                },
                orderBy: { viewCount: "desc" },
                take: 5,
            }),
        ]);
        return {
            total,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count.status;
                return acc;
            }, {}),
            byLanguage: byLanguage.reduce((acc, item) => {
                acc[item.language] = item._count.language;
                return acc;
            }, {}),
            totalViews: totalViews._sum.viewCount || 0,
            totalLikes: totalLikes._sum.likeCount || 0,
            mostViewed,
        };
    }
    async getRelatedArticles(articleId, limit = 5) {
        const article = await this.prisma.article.findUnique({
            where: { id: articleId },
            include: {
                tags: {
                    include: { tag: true },
                },
            },
        });
        if (!article)
            return [];
        const tagIds = article.tags.map((at) => at.tagId);
        return this.prisma.article.findMany({
            where: {
                id: { not: articleId },
                status: client_1.ArticleStatus.PUBLISHED,
                OR: [
                    { categoryId: article.categoryId },
                    {
                        tags: {
                            some: {
                                tagId: { in: tagIds },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                title: true,
                titleAm: true,
                excerpt: true,
                language: true,
                viewCount: true,
                createdAt: true,
            },
            take: limit,
            orderBy: { viewCount: "desc" },
        });
    }
    async updateArticleTags(articleId, tagNames) {
        await this.prisma.articleTag.deleteMany({
            where: { articleId },
        });
        if (tagNames.length === 0)
            return;
        const tags = await Promise.all(tagNames.map(async (name) => {
            return this.prisma.tag.upsert({
                where: { name },
                update: {},
                create: { name },
            });
        }));
        await this.prisma.articleTag.createMany({
            data: tags.map((tag) => ({
                articleId,
                tagId: tag.id,
            })),
        });
    }
};
exports.ArticlesService = ArticlesService;
exports.ArticlesService = ArticlesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ArticlesService);
//# sourceMappingURL=articles.service.js.map