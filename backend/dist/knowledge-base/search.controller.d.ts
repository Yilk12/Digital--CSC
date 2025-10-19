import { SearchService } from "./search.service";
import { SearchQueryDto } from "./dto/search-query.dto";
import { Language } from "@prisma/client";
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    searchArticles(query: string, language?: Language, categoryId?: string, tags?: string, page?: number, limit?: number, sortBy?: string): Promise<{
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
    getPopularSearches(period?: string, limit?: number): Promise<any>;
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
    searchInCategory(query: string, categoryId: string, page?: number, limit?: number): Promise<{
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
    semanticSearch(body: {
        query: string;
        context?: string;
    }, req: any): Promise<{
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
    getSearchAnalytics(period?: string, limit?: number): Promise<{
        period: string;
        totalSearches: any;
        uniqueQueries: any;
        topQueries: any;
        avgResultsPerSearch: number;
    }>;
    trackSearchInteraction(body: {
        query: string;
        articleId?: string;
        action: "search" | "click" | "helpful" | "not_helpful";
    }, req: any): Promise<{
        success: boolean;
    }>;
    getSearchHistory(req: any, limit?: number): Promise<any>;
    clearSearchHistory(req: any): Promise<{
        message: string;
    }>;
}
