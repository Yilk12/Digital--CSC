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
exports.FeedbackController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const feedback_service_1 = require("./feedback.service");
const create_feedback_dto_1 = require("./dto/create-feedback.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const roles_guard_1 = require("../auth/guards/roles.guard");
const client_1 = require("@prisma/client");
let FeedbackController = class FeedbackController {
    constructor(service) {
        this.service = service;
    }
    listDepartments() {
        return this.service.listDepartments();
    }
    async create(dto, req) {
        const user = (req === null || req === void 0 ? void 0 : req.user) ? { userId: req.user.userId, role: req.user.role } : null;
        return this.service.createFeedback(dto, user);
    }
    async list(req, departmentId, type, from, to) {
        const query = {
            departmentId,
            type,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
        };
        const requester = {
            userId: req.user.userId,
            role: req.user.role,
            department: req.user.department,
        };
        return this.service.listFeedback(query, requester);
    }
};
exports.FeedbackController = FeedbackController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "List active departments for feedback routing" }),
    (0, common_1.Get)("/departments"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FeedbackController.prototype, "listDepartments", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Submit feedback (role-aware, department-linked)" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_feedback_dto_1.CreateFeedbackDto, Object]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "List feedback (restricted)" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER, client_1.UserRole.GENERAL_DIRECTOR),
    (0, swagger_1.ApiQuery)({ name: "departmentId", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "type", required: false, enum: client_1.FeedbackType }),
    (0, swagger_1.ApiQuery)({ name: "from", required: false, type: String, description: "ISO date" }),
    (0, swagger_1.ApiQuery)({ name: "to", required: false, type: String, description: "ISO date" }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("departmentId")),
    __param(2, (0, common_1.Query)("type")),
    __param(3, (0, common_1.Query)("from")),
    __param(4, (0, common_1.Query)("to")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, String, String]),
    __metadata("design:returntype", Promise)
], FeedbackController.prototype, "list", null);
exports.FeedbackController = FeedbackController = __decorate([
    (0, swagger_1.ApiTags)("Feedback"),
    (0, common_1.Controller)("feedback"),
    __metadata("design:paramtypes", [feedback_service_1.FeedbackService])
], FeedbackController);
//# sourceMappingURL=feedback.controller.js.map