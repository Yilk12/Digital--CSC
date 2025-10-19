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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const dto_1 = require("./dto");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.onlineUsers = new Map();
    }
    async handleConnection(client) {
        var _a, _b, _c;
        try {
            const userId = (_a = client.handshake.auth) === null || _a === void 0 ? void 0 : _a.userId;
            const userType = (_b = client.handshake.auth) === null || _b === void 0 ? void 0 : _b.userType;
            const department = (_c = client.handshake.auth) === null || _c === void 0 ? void 0 : _c.department;
            if (!userId) {
                client.disconnect();
                return;
            }
            this.onlineUsers.set(client.id, {
                userId,
                socketId: client.id,
                userType,
                department,
            });
            client.join(`user:${userId}`);
            if (userType === 'INTERNAL' && department) {
                client.join(`department:${department}`);
            }
            const conversations = await this.chatService.getUserConversations(userId);
            conversations.forEach(conv => {
                client.join(`conversation:${conv.id}`);
            });
            client.broadcast.emit('userOnline', { userId, userType, department });
            console.log(`User ${userId} connected to chat`);
        }
        catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const onlineUser = this.onlineUsers.get(client.id);
        if (onlineUser) {
            client.broadcast.emit('userOffline', { userId: onlineUser.userId });
            this.onlineUsers.delete(client.id);
            console.log(`User ${onlineUser.userId} disconnected from chat`);
        }
    }
    async handleSendMessage(client, data) {
        try {
            const onlineUser = this.onlineUsers.get(client.id);
            if (!onlineUser) {
                client.emit('error', { message: 'User not authenticated' });
                return;
            }
            const message = await this.chatService.sendMessage(onlineUser.userId, data);
            this.server.to(`conversation:${data.conversationId}`).emit('newMessage', message);
            return { success: true, message };
        }
        catch (error) {
            client.emit('error', { message: error.message });
        }
    }
    async handleJoinConversation(client, data) {
        try {
            const onlineUser = this.onlineUsers.get(client.id);
            if (!onlineUser) {
                client.emit('error', { message: 'User not authenticated' });
                return;
            }
            client.join(`conversation:${data.conversationId}`);
            const messages = await this.chatService.getConversationMessages(data.conversationId, onlineUser.userId);
            client.emit('conversationMessages', { conversationId: data.conversationId, messages });
        }
        catch (error) {
            client.emit('error', { message: error.message });
        }
    }
    handleLeaveConversation(client, data) {
        client.leave(`conversation:${data.conversationId}`);
    }
    handleStartTyping(client, data) {
        const onlineUser = this.onlineUsers.get(client.id);
        if (onlineUser) {
            client.to(`conversation:${data.conversationId}`).emit('userTyping', {
                userId: onlineUser.userId,
                conversationId: data.conversationId,
            });
        }
    }
    handleStopTyping(client, data) {
        const onlineUser = this.onlineUsers.get(client.id);
        if (onlineUser) {
            client.to(`conversation:${data.conversationId}`).emit('userStoppedTyping', {
                userId: onlineUser.userId,
                conversationId: data.conversationId,
            });
        }
    }
    handleGetOnlineUsers(client) {
        const onlineUser = this.onlineUsers.get(client.id);
        if (!onlineUser)
            return;
        const onlineUsersList = Array.from(this.onlineUsers.values())
            .filter(user => {
            if (onlineUser.userType === 'INTERNAL')
                return true;
            return user.userType === 'INTERNAL';
        })
            .map(user => ({
            userId: user.userId,
            userType: user.userType,
            department: user.department,
        }));
        client.emit('onlineUsers', onlineUsersList);
    }
    notifyUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    notifyDepartment(department, event, data) {
        this.server.to(`department:${department}`).emit(event, data);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket,
        dto_1.CreateMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveConversation'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('startTyping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStartTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stopTyping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStopTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getOnlineUsers'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleGetOnlineUsers", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map