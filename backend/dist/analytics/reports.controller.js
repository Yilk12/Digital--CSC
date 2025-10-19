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
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async generateTicketReport(startDate, endDate, format = 'json', req, res) {
        const report = await this.reportsService.generateTicketReport(new Date(startDate), new Date(endDate), format, req.user.role, req.user.userId);
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=ticket-report.csv");
            return res.send(report);
        }
        return res.json(report);
    }
    async generateKnowledgeBaseReport(startDate, endDate, format = 'json', req, res) {
        const report = await this.reportsService.generateKnowledgeBaseReport(new Date(startDate), new Date(endDate), format, req.user.role, req.user.userId);
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=knowledge-base-report.csv");
            return res.send(report);
        }
        return res.json(report);
    }
    async generateUserReport(startDate, endDate, format = 'json', res) {
        const report = await this.reportsService.generateUserReport(new Date(startDate), new Date(endDate), format);
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=user-report.csv");
            return res.send(report);
        }
        return res.json(report);
    }
    async generatePerformanceReport(startDate, endDate, format = 'json', res) {
        const report = await this.reportsService.generatePerformanceReport(new Date(startDate), new Date(endDate), format);
        if (format === "csv") {
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=performance-report.csv");
            return res.send(report);
        }
        return res.json(report);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate ticket report" }),
    (0, common_1.Get)("tickets"),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateTicketReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate knowledge base report" }),
    (0, common_1.Get)("knowledge-base"),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Request)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateKnowledgeBaseReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate user report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.GENERAL_DIRECTOR, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("users"),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateUserReport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Generate performance report" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.GENERAL_DIRECTOR, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Get)("performance"),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('format')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generatePerformanceReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)("Reports"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map