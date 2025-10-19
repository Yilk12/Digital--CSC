import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    server: Server;
    private onlineUsers;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSendMessage(client: Socket, data: CreateMessageDto): Promise<{
        success: boolean;
        message: import("./interfaces/chat.interface").ChatMessage;
    } | undefined>;
    handleJoinConversation(client: Socket, data: {
        conversationId: string;
    }): Promise<void>;
    handleLeaveConversation(client: Socket, data: {
        conversationId: string;
    }): void;
    handleStartTyping(client: Socket, data: {
        conversationId: string;
    }): void;
    handleStopTyping(client: Socket, data: {
        conversationId: string;
    }): void;
    handleGetOnlineUsers(client: Socket): void;
    notifyUser(userId: string, event: string, data: any): void;
    notifyDepartment(department: string, event: string, data: any): void;
}
