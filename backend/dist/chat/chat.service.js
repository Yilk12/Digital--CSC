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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ChatService = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createConversation(userId, createConversationDto) {
        const { name, type, departmentId, participantIds } = createConversationDto;
        const allParticipantIds = participantIds.includes(userId)
            ? participantIds
            : [...participantIds, userId];
        const conversation = await this.prisma.conversation.create({
            data: {
                name,
                type,
                departmentId,
                createdById: userId,
                participants: {
                    create: allParticipantIds.map((participantId) => ({
                        userId: participantId,
                    })),
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                                department: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                                department: true,
                            },
                        },
                    },
                },
            },
        });
        return this.formatConversation(conversation);
    }
    async getUserConversations(userId) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId,
                        isActive: true,
                    },
                },
                isActive: true,
            },
            include: {
                participants: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                                department: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                                department: true,
                            },
                        },
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return conversations.map(conv => this.formatConversation(conv));
    }
    async getConversationMessages(conversationId, userId, page = 1, limit = 50) {
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId,
                isActive: true,
            },
        });
        if (!participant) {
            throw new common_1.ForbiddenException('You are not a participant in this conversation');
        }
        const messages = await this.prisma.message.findMany({
            where: {
                conversationId,
                isDeleted: false,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userType: true,
                        department: true,
                    },
                },
                readReceipts: { select: { userId: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return messages.reverse().map(msg => this.formatMessage(msg));
    }
    async sendMessage(userId, createMessageDto) {
        const { conversationId, content, type, replyToId } = createMessageDto;
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: {
                conversationId,
                userId,
                isActive: true,
            },
        });
        if (!participant) {
            throw new common_1.ForbiddenException('You are not a participant in this conversation');
        }
        const message = await this.prisma.message.create({
            data: {
                content,
                type,
                conversationId,
                senderId: userId,
                replyToId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userType: true,
                        department: true,
                    },
                },
            },
        });
        await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
        return this.formatMessage(message);
    }
    async markConversationAsRead(conversationId, userId) {
        const participant = await this.prisma.conversationParticipant.findFirst({
            where: { conversationId, userId, isActive: true },
        });
        if (!participant) {
            throw new common_1.ForbiddenException('You are not a participant in this conversation');
        }
        const unread = await this.prisma.message.findMany({
            where: {
                conversationId,
                senderId: { not: userId },
                isDeleted: false,
                readReceipts: { none: { userId } },
            },
            select: { id: true },
        });
        if (unread.length === 0)
            return { marked: 0 };
        await this.prisma.messageReadReceipt.createMany({
            data: unread.map((m) => ({ messageId: m.id, userId })),
        });
        return { marked: unread.length };
    }
    async deleteMessage(userId, messageId) {
        var _a, _b, _c;
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userType: true,
                        department: true,
                    },
                },
                conversation: {
                    select: { id: true, type: true, createdById: true },
                },
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        const isModerator = ((_a = message.conversation) === null || _a === void 0 ? void 0 : _a.type) === 'GROUP' || ((_b = message.conversation) === null || _b === void 0 ? void 0 : _b.type) === 'DEPARTMENT'
            ? ((_c = message.conversation) === null || _c === void 0 ? void 0 : _c.createdById) === userId
            : false;
        if (message.senderId !== userId && !isModerator) {
            throw new common_1.ForbiddenException('Not allowed to delete this message');
        }
        const updated = await this.prisma.message.update({
            where: { id: messageId },
            data: {
                isDeleted: true,
                content: '[deleted]',
                updatedAt: new Date(),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        userType: true,
                        department: true,
                    },
                },
                conversation: {
                    select: { id: true, type: true, createdById: true },
                },
            },
        });
        return this.formatMessage(updated);
    }
    async findOrCreatePrivateConversation(userId, otherUserId) {
        const existingConversation = await this.prisma.conversation.findFirst({
            where: {
                type: 'PRIVATE',
                participants: {
                    every: {
                        userId: { in: [userId, otherUserId] },
                        isActive: true,
                    },
                },
            },
            include: {
                participants: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                                department: true,
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                                department: true,
                            },
                        },
                    },
                },
            },
        });
        if (existingConversation && existingConversation.participants.length === 2) {
            return this.formatConversation(existingConversation);
        }
        return this.createConversation(userId, {
            type: 'PRIVATE',
            participantIds: [otherUserId],
        });
    }
    async getDepartmentUsers(departmentId) {
        const users = await this.prisma.user.findMany({
            where: {
                department: departmentId,
                isActive: true,
                userType: client_1.UserType.INTERNAL,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                userType: true,
                department: true,
            },
        });
        return users.map(user => this.formatUser(user));
    }
    async getAvailableUsers(userId, userType) {
        const whereClause = userType === client_1.UserType.INTERNAL
            ? { userType: client_1.UserType.INTERNAL, isActive: true }
            : { userType: { in: [client_1.UserType.INTERNAL, client_1.UserType.EXTERNAL] }, isActive: true };
        const users = await this.prisma.user.findMany({
            where: Object.assign(Object.assign({}, whereClause), { NOT: { id: userId } }),
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                userType: true,
                department: true,
            },
        });
        return users.map(user => this.formatUser(user));
    }
    formatConversation(conversation) {
        return {
            id: conversation.id,
            name: conversation.name,
            type: conversation.type,
            departmentId: conversation.departmentId,
            participants: conversation.participants.map(p => this.formatUser(p.user)),
            lastMessage: conversation.messages[0] ? this.formatMessage(conversation.messages[0]) : undefined,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
        };
    }
    formatMessage(message) {
        return {
            id: message.id,
            content: message.content,
            type: message.type,
            senderId: message.senderId,
            sender: this.formatUser(message.sender),
            conversationId: message.conversationId,
            replyToId: message.replyToId,
            isEdited: message.isEdited,
            readCount: Array.isArray(message.readReceipts) ? message.readReceipts.length : undefined,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        };
    }
    formatUser(user) {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
            department: user.department,
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map