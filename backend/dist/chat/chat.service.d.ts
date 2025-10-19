import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, CreateMessageDto } from './dto';
import { UserType } from '@prisma/client';
import { ChatConversation, ChatMessage, ChatUser } from './interfaces/chat.interface';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    createConversation(userId: string, createConversationDto: CreateConversationDto): Promise<ChatConversation>;
    getUserConversations(userId: string): Promise<ChatConversation[]>;
    getConversationMessages(conversationId: string, userId: string, page?: number, limit?: number): Promise<ChatMessage[]>;
    sendMessage(userId: string, createMessageDto: CreateMessageDto): Promise<ChatMessage>;
    markConversationAsRead(conversationId: string, userId: string): Promise<{
        marked: number;
    }>;
    deleteMessage(userId: string, messageId: string): Promise<ChatMessage>;
    findOrCreatePrivateConversation(userId: string, otherUserId: string): Promise<ChatConversation>;
    getDepartmentUsers(departmentId: string): Promise<ChatUser[]>;
    getAvailableUsers(userId: string, userType: UserType): Promise<ChatUser[]>;
    private formatConversation;
    private formatMessage;
    private formatUser;
}
