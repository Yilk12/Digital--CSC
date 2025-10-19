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
exports.TicketsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const tickets_service_1 = require("./tickets.service");
const comments_service_1 = require("./comments.service");
const attachments_service_1 = require("./attachments.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const update_ticket_dto_1 = require("./dto/update-ticket.dto");
const create_comment_dto_1 = require("./dto/create-comment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let TicketsController = class TicketsController {
    constructor(ticketsService, commentsService, attachmentsService) {
        this.ticketsService = ticketsService;
        this.commentsService = commentsService;
        this.attachmentsService = attachmentsService;
    }
    async create(createTicketDto, files, req) {
        const ticket = await this.ticketsService.create(createTicketDto, req.user.userId);
        if (files && files.length > 0) {
            await this.attachmentsService.createMultiple(ticket.id, files);
        }
        return ticket;
    }
    findAll(req, page, limit, status, priority, category, assigneeId, departmentId, search) {
        return this.ticketsService.findAll(page, limit, status, priority, category, assigneeId, departmentId, search, req.user.userId, req.user.role);
    }
    getStats(req) {
        return this.ticketsService.getTicketStats(req.user.userId, req.user.role);
    }
    findOne(id, req) {
        return this.ticketsService.findOne(id, req.user.userId, req.user.role);
    }
    findMy(req, page, limit, status, priority, category, assigneeId, departmentId, search) {
        return this.ticketsService.findAll(page, limit, status, priority, category, assigneeId, departmentId, search, req.user.userId, req.user.role);
    }
    update(id, updateTicketDto, req) {
        return this.ticketsService.update(id, updateTicketDto, req.user.userId, req.user.role);
    }
    remove(id, req) {
        return this.ticketsService.remove(id, req.user.userId, req.user.role);
    }
    addComment(ticketId, createCommentDto, req) {
        return this.commentsService.create(ticketId, createCommentDto, req.user.userId);
    }
    getComments(ticketId) {
        return this.commentsService.findByTicket(ticketId);
    }
    addAttachments(ticketId, files) {
        return this.attachmentsService.createMultiple(ticketId, files);
    }
    getAttachments(ticketId) {
        return this.attachmentsService.findByTicket(ticketId);
    }
};
exports.TicketsController = TicketsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Create a new ticket" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Ticket created successfully" }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)("files", 5)),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_ticket_dto_1.CreateTicketDto, Array, Object]),
    __metadata("design:returntype", Promise)
], TicketsController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get all tickets with pagination and filters" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false, enum: client_1.TicketStatus }),
    (0, swagger_1.ApiQuery)({ name: "priority", required: false, enum: client_1.TicketPriority }),
    (0, swagger_1.ApiQuery)({ name: "category", required: false, enum: client_1.TicketCategory }),
    (0, swagger_1.ApiQuery)({ name: "assigneeId", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "departmentId", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false, type: String }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('priority')),
    __param(5, (0, common_1.Query)('category')),
    __param(6, (0, common_1.Query)('assigneeId')),
    __param(7, (0, common_1.Query)('departmentId')),
    __param(8, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get ticket statistics' }),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get ticket by ID" }),
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List current user tickets' }),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('priority')),
    __param(5, (0, common_1.Query)('category')),
    __param(6, (0, common_1.Query)('assigneeId')),
    __param(7, (0, common_1.Query)('departmentId')),
    __param(8, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "findMy", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Update ticket" }),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_ticket_dto_1.UpdateTicketDto, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Delete ticket" }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.GENERAL_DIRECTOR),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "remove", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Add comment to ticket" }),
    (0, common_1.Post)(":id/comments"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_comment_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "addComment", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get ticket comments' }),
    (0, common_1.Get)(':id/comments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getComments", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Add attachments to ticket" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)("files", 5)),
    (0, common_1.Post)(":id/attachments"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "addAttachments", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get ticket attachments' }),
    (0, common_1.Get)(':id/attachments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TicketsController.prototype, "getAttachments", null);
exports.TicketsController = TicketsController = __decorate([
    (0, swagger_1.ApiTags)("Tickets"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)("tickets"),
    __metadata("design:paramtypes", [tickets_service_1.TicketsService,
        comments_service_1.CommentsService,
        attachments_service_1.AttachmentsService])
], TicketsController);
//# sourceMappingURL=tickets.controller.js.map