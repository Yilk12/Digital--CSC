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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reports_service_1 = require("./reports.service");
const generate_report_dto_1 = require("./dto/generate-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    generateTicketReport(generateReportDto, req) {
        return this.reportsService.generateTicketReport(generateReportDto, req.user.userId);
    }
    generateAgentPerformanceReport(generateReportDto, req) {
        return this.reportsService.generateAgentPerformanceReport(generateReportDto, req.user.userId);
    }
    generateSlaReport(generateReportDto, req) {
        return this.reportsService.generateSlaReport(generateReportDto, req.user.userId);
    }
    generateDepartmentReport(generateReportDto, req) {
        return this.reportsService.generateDepartmentReport(generateReportDto, req.user.userId);
    }
    generateSatisfactionReport(generateReportDto, req) {
        return this.reportsService.generateSatisfactionReport(generateReportDto, req.user.userId);
    }
    generateKnowledgeBaseReport(generateReportDto, req) {
        return this.reportsService.generateKnowledgeBaseReport(generateReportDto, req.user.userId);
    }
    getReportTemplates(req) {
        return this.reportsService.getReportTemplates(req.user.role);
    }
    getReportHistory(req, page = 1, limit = 10) {
        return this.reportsService.getReportHistory(req.user.userId, req.user.role, page, limit);
    }
    async downloadReport(reportId, req, res) {
        const report = await this.reportsService.downloadReport(reportId, req.user.userId, req.user.role);
        res.setHeader('Content-Type', report.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
        res.send(report.data);
    }
    scheduleReport(body, req) {
        return this.reportsService.scheduleReport(body.reportType, body.parameters, body.frequency, body.recipients, req.user.userId);
    }
    getScheduledReports(req) {
        return this.reportsService.getScheduledReports(req.user.userId, req.user.role);
    }
    cancelScheduledReport(scheduleId, req) {
        return this.reportsService.cancelScheduledReport(scheduleId, req.user.userId);
    }
    getReportStatistics(req) {
        return this.reportsService.getReportStatistics(req.user.role);
    }
    exportDashboardData(req, format = "xlsx") {
        return this.reportsService.exportDashboardData(format, req.user.userId, req.user.role);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate comprehensive ticket report" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Report generated successfully" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("tickets"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "generateTicketReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate agent performance report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("agent-performance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "generateAgentPerformanceReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate SLA compliance report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("sla-compliance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "generateSlaReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate department performance report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("department-performance"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "generateDepartmentReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate customer satisfaction report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("customer-satisfaction"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "generateSatisfactionReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate knowledge base analytics report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("knowledge-base"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_report_dto_1.GenerateReportDto, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "generateKnowledgeBaseReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get available report templates" }),
    (0, common_1.Get)("templates"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getReportTemplates", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get report history" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, common_1.Get)("history"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getReportHistory", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Download report by ID" }),
    (0, common_1.Get)("download/:reportId"),
    __param(0, (0, common_1.Query)("reportId")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "downloadReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Schedule recurring report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("schedule"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "scheduleReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get scheduled reports" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("scheduled"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getScheduledReports", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Cancel scheduled report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)("scheduled/:scheduleId/cancel"),
    __param(0, (0, common_1.Query)("scheduleId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "cancelScheduledReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get report statistics" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("statistics"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "getReportStatistics", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Export dashboard data" }),
    (0, swagger_1.ApiQuery)({ name: "format", required: false, enum: ["csv", "xlsx", "pdf"] }),
    (0, common_1.Get)("export/dashboard"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("format")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ReportsController.prototype, "exportDashboardData", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)("Help Desk Reports"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map