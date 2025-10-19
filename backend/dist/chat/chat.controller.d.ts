import { ChatService } from './chat.service';
import { CreateConversationDto, CreateMessageDto } from './dto';
import { ChatGateway } from './chat.gateway';
export declare class ChatController {
    private readonly chatService;
    private readonly chatGateway;
    constructor(chatService: ChatService, chatGateway: ChatGateway);
    getUserConversations(req: any): Promise<import("./interfaces/chat.interface").ChatConversation[]>;
    createConversation(req: any, createConversationDto: CreateConversationDto): Promise<import("./interfaces/chat.interface").ChatConversation>;
    getConversationMessages(req: any, conversationId: string, page?: number, limit?: number): Promise<import("./interfaces/chat.interface").ChatMessage[]>;
    sendMessage(req: any, createMessageDto: CreateMessageDto): Promise<import("./interfaces/chat.interface").ChatMessage>;
    markConversationAsRead(req: any, conversationId: string): Promise<{
        marked: number;
    }>;
    deleteMessage(req: any, messageId: string): Promise<import("./interfaces/chat.interface").ChatMessage>;
    getAvailableUsers(req: any): Promise<import("./interfaces/chat.interface").ChatUser[]>;
    getDepartmentUsers(departmentId: string): Promise<import("./interfaces/chat.interface").ChatUser[]>;
    findOrCreatePrivateConversation(req: any, body: {
        otherUserId: string;
    }): Promise<import("./interfaces/chat.interface").ChatConversation>;
}
