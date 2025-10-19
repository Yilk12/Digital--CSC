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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const search_service_1 = require("./search.service");
const search_query_dto_1 = require("./dto/search-query.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let SearchController = class SearchController {
    constructor(searchService) {
        this.searchService = searchService;
    }
    async searchArticles(query, language, categoryId, tags, page = 1, limit = 10, sortBy = "relevance") {
        const searchParams = {
            query,
            language,
            categoryId,
            tags: tags === null || tags === void 0 ? void 0 : tags.split(","),
            page,
            limit,
            sortBy
        };
        return this.searchService.searchArticles(searchParams);
    }
    async getSearchSuggestions(query, limit = 5) {
        return this.searchService.getSearchSuggestions(query, limit);
    }
    async getPopularSearches(period = "week", limit = 10) {
        return this.searchService.getPopularSearches(period, limit);
    }
    async advancedSearch(searchQuery) {
        return this.searchService.advancedSearch(searchQuery);
    }
    async searchInCategory(query, categoryId, page = 1, limit = 10) {
        return this.searchService.searchArticles({ query, categoryId, page, limit });
    }
    async semanticSearch(body, req) {
        return this.searchService.searchArticles({ query: body.query, userId: req.user.userId, page: 1, limit: 10 });
    }
    async getSearchAnalytics(period = "month", limit = 20) {
        return this.searchService.getSearchAnalytics(period);
    }
    async trackSearchInteraction(body, req) {
        return this.searchService.trackSearchInteraction(body.query, body.action, req.user.userId, body.articleId);
    }
    async getSearchHistory(req, limit = 20) {
        return this.searchService.getSearchHistory(req.user.userId, limit);
    }
    async clearSearchHistory(req) {
        return this.searchService.clearSearchHistory(req.user.userId);
    }
};
exports.SearchController = SearchController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Search articles with advanced filters" }),
    (0, swagger_1.ApiQuery)({ name: "q", required: true, type: String, description: "Search query" }),
    (0, swagger_1.ApiQuery)({ name: "language", required: false, enum: client_1.Language }),
    (0, swagger_1.ApiQuery)({ name: "categoryId", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "tags", required: false, type: String, description: "Comma-separated tags" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "sortBy", required: false, enum: ["relevance", "date", "views", "rating"] }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)("language")),
    __param(2, (0, common_1.Query)("categoryId")),
    __param(3, (0, common_1.Query)("tags")),
    __param(4, (0, common_1.Query)("page")),
    __param(5, (0, common_1.Query)("limit")),
    __param(6, (0, common_1.Query)("sortBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_a = typeof client_1.Language !== "undefined" && client_1.Language) === "function" ? _a : Object, String, String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchArticles", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get search suggestions/autocomplete" }),
    (0, swagger_1.ApiQuery)({ name: "q", required: true, type: String }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("suggestions"),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchSuggestions", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get popular search terms" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String, description: "Time period: day, week, month" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("popular"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getPopularSearches", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Advanced search with filters" }),
    (0, common_1.Post)("advanced"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_query_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "advancedSearch", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Search within specific category" }),
    (0, common_1.Get)("category/:categoryId"),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)("categoryId")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "searchInCategory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Semantic search using AI" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("semantic"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "semanticSearch", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get search analytics" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("analytics"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Track search interaction" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("track"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "trackSearchInteraction", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get search history for user" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("history"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "getSearchHistory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Clear search history" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("history/clear"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchController.prototype, "clearSearchHistory", null);
exports.SearchController = SearchController = __decorate([
    (0, swagger_1.ApiTags)("Knowledge Base - Search"),
    (0, common_1.Controller)("knowledge-base/search"),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchController);
//# sourceMappingURL=search.controller.js.map