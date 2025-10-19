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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const chat_service_1 = require("./chat.service");
const dto_1 = require("./dto");
const chat_gateway_1 = require("./chat.gateway");
let ChatController = class ChatController {
    constructor(chatService, chatGateway) {
        this.chatService = chatService;
        this.chatGateway = chatGateway;
    }
    async getUserConversations(req) {
        return this.chatService.getUserConversations(req.user.id);
    }
    async createConversation(req, createConversationDto) {
        return this.chatService.createConversation(req.user.id, createConversationDto);
    }
    async getConversationMessages(req, conversationId, page = 1, limit = 50) {
        return this.chatService.getConversationMessages(conversationId, req.user.id, page, limit);
    }
    async sendMessage(req, createMessageDto) {
        return this.chatService.sendMessage(req.user.id, createMessageDto);
    }
    async markConversationAsRead(req, conversationId) {
        const result = await this.chatService.markConversationAsRead(conversationId, req.user.id);
        this.chatGateway.server
            .to(`conversation:${conversationId}`)
            .emit('messagesRead', { conversationId, userId: req.user.id, count: result.marked });
        return result;
    }
    async deleteMessage(req, messageId) {
        const deleted = await this.chatService.deleteMessage(req.user.id, messageId);
        this.chatGateway.server
            .to(`conversation:${deleted.conversationId}`)
            .emit('messageDeleted', { messageId: deleted.id, conversationId: deleted.conversationId });
        return deleted;
    }
    async getAvailableUsers(req) {
        return this.chatService.getAvailableUsers(req.user.id, req.user.userType);
    }
    async getDepartmentUsers(departmentId) {
        return this.chatService.getDepartmentUsers(departmentId);
    }
    async findOrCreatePrivateConversation(req, body) {
        return this.chatService.findOrCreatePrivateConversation(req.user.id, body.otherUserId);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user conversations' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserConversations", null);
__decorate([
    (0, common_1.Post)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new conversation' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get conversation messages' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('conversations/:id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a conversation as read' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markConversationAsRead", null);
__decorate([
    (0, common_1.Post)('messages/:id/delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete (retract) a message by sender' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Get)('users/available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available users for chat' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAvailableUsers", null);
__decorate([
    (0, common_1.Get)('departments/:id/users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get users in a department' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getDepartmentUsers", null);
__decorate([
    (0, common_1.Post)('conversations/private'),
    (0, swagger_1.ApiOperation)({ summary: 'Find or create private conversation' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "findOrCreatePrivateConversation", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_gateway_1.ChatGateway])
], ChatController);
//# sourceMappingURL=chat.controller.js.map