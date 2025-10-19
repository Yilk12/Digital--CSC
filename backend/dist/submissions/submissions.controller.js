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
exports.SubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const submissions_service_1 = require("./submissions.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class CreateSubmissionDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "submitterName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "submitterDepartment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "contactEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "contactPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSubmissionDto.prototype, "anonymous", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.$Enums.SubmissionType),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateSubmissionDto.prototype, "description", void 0);
class GMActionDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(['ACCEPT', 'REJECT', 'ESCALATE', 'MORE_INFO_REQUEST', 'CLOSE']),
    __metadata("design:type", Object)
], GMActionDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], GMActionDto.prototype, "decisionSummary", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GMActionDto.prototype, "assignedDepartmentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GMActionDto.prototype, "escalatedTo", void 0);
let SubmissionsController = class SubmissionsController {
    constructor(service) {
        this.service = service;
    }
    async create(req, dto) {
        var _a, _b;
        const maybeUserId = ((_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id) || ((_b = req === null || req === void 0 ? void 0 : req.user) === null || _b === void 0 ? void 0 : _b.userId) || null;
        const input = {
            userId: dto.anonymous ? null : maybeUserId,
            submitterName: dto.submitterName,
            submitterDepartment: dto.submitterDepartment,
            contactEmail: dto.contactEmail,
            contactPhone: dto.contactPhone,
            anonymous: Boolean(dto.anonymous),
            type: dto.type,
            subject: dto.subject,
            description: dto.description,
        };
        return this.service.create(input);
    }
    async list(type, status) {
        return this.service.list({ type, status });
    }
    async gmAct(id, dto, req) {
        const gmReviewerId = req.user.id || req.user.userId;
        const input = {
            action: dto.action,
            decisionSummary: dto.decisionSummary,
            assignedDepartmentId: dto.assignedDepartmentId,
            escalatedTo: dto.escalatedTo,
            gmReviewerId,
        };
        return this.service.gmAct(id, input);
    }
};
exports.SubmissionsController = SubmissionsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a complaint/suggestion (anonymous or authenticated)' }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateSubmissionDto]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List submissions (GM/Admin only)' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('GENERAL_DIRECTOR', 'ADMIN'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "list", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'GM/Admin action on a submission' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('GENERAL_DIRECTOR', 'ADMIN'),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, GMActionDto, Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "gmAct", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, swagger_1.ApiTags)('Submissions'),
    (0, common_1.Controller)('submissions'),
    __metadata("design:paramtypes", [submissions_service_1.SubmissionsService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map