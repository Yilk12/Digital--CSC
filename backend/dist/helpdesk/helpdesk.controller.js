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
exports.HelpdeskController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helpdesk_service_1 = require("./helpdesk.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let HelpdeskController = class HelpdeskController {
    constructor(helpdeskService) {
        this.helpdeskService = helpdeskService;
    }
    getDashboard(req) {
        return this.helpdeskService.getDashboardData(req.user.userId, req.user.role);
    }
    getMetrics(req, period = "month") {
        return this.helpdeskService.getTicketMetrics(req.user.userId, req.user.role, period);
    }
    getSlaPerformance(req, departmentId) {
        return this.helpdeskService.getSlaPerformance(req.user.userId, req.user.role, departmentId);
    }
    getAgentPerformance(req) {
        return this.helpdeskService.getAgentPerformance();
    }
    getTicketTrends(req, period = "3months", groupBy = "week") {
        return this.helpdeskService.getTicketTrends(req.user.userId, req.user.role, period, groupBy);
    }
    getWorkloadDistribution(req) {
        return this.helpdeskService.getWorkloadDistribution();
    }
    getSatisfactionMetrics(req, period = "month") {
        return this.helpdeskService.getSatisfactionMetrics(period);
    }
    getEscalationStats(req) {
        return this.helpdeskService.getEscalationStats(req.user.userId, req.user.role);
    }
    getDepartmentStats(req) {
        return this.helpdeskService.getDepartmentStats(req.user.userId, req.user.role);
    }
    getQueueStatus(req) {
        return this.helpdeskService.getQueueStatus(req.user.userId, req.user.role);
    }
    getOverdueTickets(req, limit = 10) {
        return this.helpdeskService.getOverdueTickets(req.user.userId, req.user.role, limit);
    }
    getRecentActivity(req, limit = 20) {
        return this.helpdeskService.getRecentActivity(req.user.userId, req.user.role, limit);
    }
    exportData(req, format = "csv", type = "tickets") {
        return this.helpdeskService.exportData(format, type, req.user.userId);
    }
};
exports.HelpdeskController = HelpdeskController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get comprehensive dashboard data" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Dashboard data retrieved successfully" }),
    (0, common_1.Get)("dashboard"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getDashboard", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get ticket metrics and KPIs" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String, description: "Time period: day, week, month, year" }),
    (0, common_1.Get)("metrics"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getMetrics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get SLA performance data" }),
    (0, swagger_1.ApiQuery)({ name: "departmentId", required: false, type: String }),
    (0, common_1.Get)("sla-performance"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("departmentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getSlaPerformance", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get agent performance statistics" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("agent-performance"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getAgentPerformance", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get ticket trends over time" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "groupBy", required: false, type: String, description: "Group by: day, week, month" }),
    (0, common_1.Get)("trends"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __param(2, (0, common_1.Query)("groupBy")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getTicketTrends", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get workload distribution" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("workload"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getWorkloadDistribution", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get customer satisfaction metrics" }),
    (0, swagger_1.ApiQuery)({ name: "period", required: false, type: String }),
    (0, common_1.Get)("satisfaction"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getSatisfactionMetrics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get escalation statistics" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER, client_1.UserRole.SUPPORT_AGENT),
    (0, common_1.Get)("escalations"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getEscalationStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get department-wise ticket distribution" }),
    (0, common_1.Get)("departments"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getDepartmentStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get real-time queue status" }),
    (0, common_1.Get)("queue-status"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getQueueStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get overdue tickets" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("overdue"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getOverdueTickets", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get recent activity feed" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("activity"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "getRecentActivity", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Export helpdesk data" }),
    (0, swagger_1.ApiQuery)({ name: "format", required: false, enum: ["csv", "xlsx", "pdf"] }),
    (0, swagger_1.ApiQuery)({ name: "type", required: false, enum: ["tickets", "reports", "analytics"] }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("export"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("format")),
    __param(2, (0, common_1.Query)("type")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], HelpdeskController.prototype, "exportData", null);
exports.HelpdeskController = HelpdeskController = __decorate([
    (0, swagger_1.ApiTags)("Help Desk Dashboard"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("helpdesk"),
    __metadata("design:paramtypes", [helpdesk_service_1.HelpdeskService])
], HelpdeskController);
//# sourceMappingURL=helpdesk.controller.js.map