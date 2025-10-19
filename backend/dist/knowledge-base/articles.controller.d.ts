import { ArticlesService } from "./articles.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";
import { AddFeedbackDto } from "./dto/add-feedback.dto";
import { AddCommentDto } from "./dto/add-comment.dto";
import { ArticleStatus, Language } from "@prisma/client";
export declare class ArticlesController {
    private readonly articlesService;
    constructor(articlesService: ArticlesService);
    create(createArticleDto: CreateArticleDto, files: Express.Multer.File[], req: any): Promise<{
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            parentId: string | null;
        } | null;
        comments: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            articleId: string;
        })[];
        tags: ({
            tag: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
            };
        } & {
            articleId: string;
            tagId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            filename: string;
            filepath: string;
            mimetype: string;
            size: number;
            articleId: string;
        }[];
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
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
    }>;
    findAll(req: any, page?: number, limit?: number, status?: ArticleStatus, language?: Language, categoryId?: string, search?: string, authorId?: string): Promise<{
        articles: ({
            category: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                parentId: string | null;
            } | null;
            _count: {
                comments: number;
                feedback: number;
            };
            tags: ({
                tag: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                };
            } & {
                articleId: string;
                tagId: string;
            })[];
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
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
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getStats(req: any, authorId?: string): Promise<{
        total: number;
        byStatus: {};
        byLanguage: {};
        totalViews: number;
        totalLikes: number;
        mostViewed: {
            id: string;
            title: string;
            viewCount: number;
        }[];
    }>;
    findOne(id: string, incrementView?: boolean): Promise<{
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            parentId: string | null;
        } | null;
        comments: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            articleId: string;
        })[];
        tags: ({
            tag: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
            };
        } & {
            articleId: string;
            tagId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            filename: string;
            filepath: string;
            mimetype: string;
            size: number;
            articleId: string;
        }[];
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
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
    }>;
    getRelated(id: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        titleAm: string | null;
        excerpt: string | null;
        language: import("@prisma/client").$Enums.Language;
        viewCount: number;
    }[]>;
    update(id: string, updateArticleDto: UpdateArticleDto, req: any): Promise<{
        category: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            parentId: string | null;
        } | null;
        comments: ({
            author: {
                id: string;
                firstName: string;
                lastName: string;
                role: import("@prisma/client").$Enums.UserRole;
            };
        } & {
            id: string;
            createdAt: Date;
            content: string;
            authorId: string;
            articleId: string;
        })[];
        tags: ({
            tag: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
            };
        } & {
            articleId: string;
            tagId: string;
        })[];
        attachments: {
            id: string;
            createdAt: Date;
            filename: string;
            filepath: string;
            mimetype: string;
            size: number;
            articleId: string;
        }[];
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
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
    }>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    addFeedback(articleId: string, addFeedbackDto: AddFeedbackDto, req: any): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        articleId: string;
        isLike: boolean;
    }>;
    addComment(articleId: string, addCommentDto: AddCommentDto, req: any): Promise<{
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        articleId: string;
    }>;
}
