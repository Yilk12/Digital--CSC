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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getDashboardOverview(req) {
        return this.analyticsService.getDashboardOverview(req.user.role, req.user.userId);
    }
    getTicketAnalytics(startDate, endDate, req) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getTicketAnalytics(start, end, req.user.role, req.user.userId);
    }
    getKnowledgeBaseAnalytics(startDate, endDate, req) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.analyticsService.getKnowledgeBaseAnalytics(start, end, req.user.role, req.user.userId);
    }
    getUserAnalytics(req) {
        return this.analyticsService.getUserAnalytics();
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard overview metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard metrics retrieved' }),
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDashboardOverview", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get ticket analytics" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "endDate", required: false, type: String }),
    (0, common_1.Get)("tickets"),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTicketAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get knowledge base analytics" }),
    (0, swagger_1.ApiQuery)({ name: "startDate", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "endDate", required: false, type: String }),
    (0, common_1.Get)("knowledge-base"),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getKnowledgeBaseAnalytics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get user analytics' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.GENERAL_DIRECTOR, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getUserAnalytics", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)("Analytics"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("analytics"),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map