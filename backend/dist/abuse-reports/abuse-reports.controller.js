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
exports.AbuseReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const abuse_reports_service_1 = require("./abuse-reports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const class_validator_1 = require("class-validator");
const REPORT_STATUS = ['PENDING', 'RESOLVED', 'REJECTED'];
const REPORT_TARGET_TYPES = ['USER', 'ARTICLE', 'TICKET', 'POST', 'COMMENT'];
class CreateAbuseReportDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAbuseReportDto.prototype, "reporterId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(REPORT_TARGET_TYPES),
    __metadata("design:type", String)
], CreateAbuseReportDto.prototype, "targetType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAbuseReportDto.prototype, "targetId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", String)
], CreateAbuseReportDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateAbuseReportDto.prototype, "description", void 0);
class UpdateAbuseReportStatusDto {
}
__decorate([
    (0, class_validator_1.IsIn)(REPORT_STATUS),
    __metadata("design:type", String)
], UpdateAbuseReportStatusDto.prototype, "status", void 0);
let AbuseReportsController = class AbuseReportsController {
    constructor(service) {
        this.service = service;
    }
    async create(req, dto) {
        const reporterId = req.user.id || req.user.userId || dto.reporterId;
        return this.service.create(Object.assign(Object.assign({}, dto), { reporterId }));
    }
    async list(status, targetType, reporterId) {
        return this.service.list({ status, targetType, reporterId });
    }
    async updateStatus(id, dto, req) {
        const actorId = req.user.id || req.user.userId;
        return this.service.updateStatus(id, dto.status, actorId);
    }
};
exports.AbuseReportsController = AbuseReportsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new abuse report' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateAbuseReportDto]),
    __metadata("design:returntype", Promise)
], AbuseReportsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List abuse reports (admin/staff_manager only)' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('targetType')),
    __param(2, (0, common_1.Query)('reporterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AbuseReportsController.prototype, "list", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update abuse report status (admin/staff_manager only)' }),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateAbuseReportStatusDto, Object]),
    __metadata("design:returntype", Promise)
], AbuseReportsController.prototype, "updateStatus", null);
exports.AbuseReportsController = AbuseReportsController = __decorate([
    (0, swagger_1.ApiTags)('Abuse Reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('abuse-reports'),
    __metadata("design:paramtypes", [abuse_reports_service_1.AbuseReportsService])
], AbuseReportsController);
//# sourceMappingURL=abuse-reports.controller.js.map