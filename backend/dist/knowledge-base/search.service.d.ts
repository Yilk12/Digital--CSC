import { PrismaService } from "../prisma/prisma.service";
import { SearchQueryDto } from './dto/search-query.dto';
import { Language } from "@prisma/client";
export declare class SearchService {
    private prisma;
    constructor(prisma: PrismaService);
    searchArticles(params: {
        query: string;
        language?: Language;
        categoryId?: string;
        page?: number;
        limit?: number;
        userId?: string;
    }): Promise<{
        articles: {
            id: string;
            title: string;
            excerpt: string;
            author: string;
            category: string;
            viewCount: number;
            likeCount: number;
            createdAt: Date;
            language: import("@prisma/client").$Enums.Language;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSearchSuggestions(query: string, limit?: number): Promise<any[]>;
    getPopularSearches(period: string, limit: number): Promise<any>;
    advancedSearch(searchQuery: SearchQueryDto): Promise<{
        articles: {
            id: string;
            title: string;
            excerpt: string;
            author: string;
            category: string;
            viewCount: number;
            likeCount: number;
            createdAt: Date;
            language: import("@prisma/client").$Enums.Language;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getSearchAnalytics(period: string): Promise<{
        period: string;
        totalSearches: any;
        uniqueQueries: any;
        topQueries: any;
        avgResultsPerSearch: number;
    }>;
    trackSearchInteraction(query: string, action: string, userId: string, articleId?: string): Promise<{
        success: boolean;
    }>;
    getSearchHistory(userId: string, limit: number): Promise<any>;
    clearSearchHistory(userId: string): Promise<{
        message: string;
    }>;
    private trackSearchQuery;
    private getDateRange;
}
