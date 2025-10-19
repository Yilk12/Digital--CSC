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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let KnowledgeBaseAnalyticsController = class KnowledgeBaseAnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getOverview(req) {
        return this.analyticsService.getOverviewStats(req.user.userId, req.user.role);
    }
    getArticlePerformance(req, period = "month", limit = 10) {
        return this.analyticsService.getArticlePerformance(period, limit, req.user.role);
    }
    getArticleTrends(req, period = "3months", groupBy = "week") {
        return this.analyticsService.getArticleTrends(period, groupBy);
    }
    getCategoryPerformance(req) {
        return this.analyticsService.getCategoryPerformance(req.user.role);
    }
    getSearchAnalytics(period = "month") {
        return this.analyticsService.getSearchAnalytics(period);
    }
    getUserEngagement(period = "month") {
        return this.analyticsService.getUserEngagement(period);
    }
    getContentGaps(req) {
        return this.analyticsService.getContentGapAnalysis();
    }
    getAuthorPerformance(period = "month") {
        return this.analyticsService.getAuthorPerformance(period);
    }
    getLanguageDistribution(req) {
        return this.analyticsService.getLanguageDistribution(req.user.role);
    }
    getFeedbackAnalytics(req, period = "month") {
        return this.analyticsService.getFeedbackAnalytics(period);
    }
    getROIMetrics(period = "month") {
        return this.analyticsService.getROIMetrics(period);
    }
    getContentLifecycle(req) {
        return this.analyticsService.getContentLifecycleAnalytics();
    }
    getPopularTags(period = "month", limit = 20) {
        return this.analyticsService.getPopularTags(period, limit);
    }
    getHealthScore(req) {
        return this.analyticsService.getKnowledgeBaseHealthScore();
    }
    getComparativeAnalytics(currentPeriod = "month", previousPeriod = "previousMonth") {
        return this.analyticsService.getComparativeAnalytics(currentPeriod, previousPeriod);
    }
    getRealtimeActivity(req, limit = 20) {
        return this.analyticsService.getRealtimeActivity(limit, req.user.role);
    }
    exportAnalytics(req, type = "overview", format = "xlsx", period = "month") {
        return this.analyticsService.exportAnalyticsData(type, format, period, req.user.userId);
    }
};
exports.KnowledgeBaseAnalyticsController = KnowledgeBaseAnalyticsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get knowledge base overview statistics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Overview statistics retrieved successfully" }),
    (0, common_1.Get)("overview"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get article performance metrics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String, description: "Time period: day, week, month, year" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number, description: "Number of top articles to return" }),
    (0, common_1.Get)("articles/performance"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getArticlePerformance", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get article views trends over time" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "groupBy", required: false, type: String, description: "Group by: day, week, month" }),
    (0, common_1.Get)("articles/trends"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __param(2, (0, common_1.Query)("groupBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getArticleTrends", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get category performance statistics" }),
    (0, common_1.Get)("categories/performance"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getCategoryPerformance", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get search analytics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getSearchAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get user engagement metrics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("engagement"),
    __param(0, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getUserEngagement", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get content gap analysis" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER, client_1.UserRole.SUPPORT_AGENT),
    (0, common_1.Get)("content-gaps"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getContentGaps", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get author performance statistics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("authors/performance"),
    __param(0, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getAuthorPerformance", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get language distribution analytics" }),
    (0, common_1.Get)("languages"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getLanguageDistribution", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get feedback and rating analytics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, common_1.Get)("feedback"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getFeedbackAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get knowledge base ROI metrics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("roi"),
    __param(0, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getROIMetrics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get content lifecycle analytics" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("content-lifecycle"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getContentLifecycle", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get popular tags and topics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("tags/popular"),
    __param(0, (0, common_1.Query)("period")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getPopularTags", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get knowledge base health score" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("health-score"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getHealthScore", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get comparative analytics" }),
    (0, swagger_1.ApiQuery)({ name: "currentPeriod", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "previousPeriod", required: false, type: String }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("comparative"),
    __param(0, (0, common_1.Query)("currentPeriod")),
    __param(1, (0, common_1.Query)("previousPeriod")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getComparativeAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get real-time activity feed" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("activity"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "getRealtimeActivity", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Export analytics data" }),
    (0, swagger_1.ApiQuery)({ name: "type", required: false, enum: ["overview", "articles", "search", "engagement"] }),
    (0, swagger_1.ApiQuery)({ name: "format", required: false, enum: ["csv", "xlsx", "json"] }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("export"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("type")),
    __param(2, (0, common_1.Query)("format")),
    __param(3, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeBaseAnalyticsController.prototype, "exportAnalytics", null);
exports.KnowledgeBaseAnalyticsController = KnowledgeBaseAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("Knowledge Base - Analytics"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("knowledge-base/analytics"),
    __metadata("design:paramtypes", [analytics_service_1.KnowledgeBaseAnalyticsService])
], KnowledgeBaseAnalyticsController);
//# sourceMappingURL=analytics.controller.js.map