import { Language } from "@prisma/client";
export declare class SearchQueryDto {
    title?: string;
    content?: string;
    authorId?: string;
    categoryIds?: string[];
    tags?: string[];
    language?: Language;
    dateFrom?: string;
    dateTo?: string;
    minViews?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}
