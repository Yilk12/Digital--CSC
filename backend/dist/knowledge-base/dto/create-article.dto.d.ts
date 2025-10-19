import { ArticleStatus, Language } from "@prisma/client";
export declare class CreateArticleDto {
    title: string;
    titleAm?: string;
    content: string;
    contentAm?: string;
    excerpt?: string;
    status: ArticleStatus;
    language: Language;
    categoryId?: string;
    tags?: string[];
    expiresAt?: string;
}
