import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto';
import { OnlineUser } from './interfaces/chat.interface';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, OnlineUser>();

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      // Extract user info from authentication (you'll need to implement auth middleware)
      const userId = client.handshake.auth?.userId;
      const userType = client.handshake.auth?.userType;
      const department = client.handshake.auth?.department;

      if (!userId) {
        client.disconnect();
        return;
      }

      // Store online user
      this.onlineUsers.set(client.id, {
        userId,
        socketId: client.id,
        userType,
        department,
      });

      // Join user to their personal room
      client.join(`user:${userId}`);

      // Join department room if internal user
      if (userType === 'INTERNAL' && department) {
        client.join(`department:${department}`);
      }

      // Get user's conversations and join their rooms
      const conversations = await this.chatService.getUserConversations(userId);
      conversations.forEach(conv => {
        client.join(`conversation:${conv.id}`);
      });

      // Notify others that user is online
      client.broadcast.emit('userOnline', { userId, userType, department });

      console.log(`User ${userId} connected to chat`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const onlineUser = this.onlineUsers.get(client.id);
    if (onlineUser) {
      // Notify others that user is offline
      client.broadcast.emit('userOffline', { userId: onlineUser.userId });
      this.onlineUsers.delete(client.id);
      console.log(`User ${onlineUser.userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CreateMessageDto,
  ) {
    try {
      const onlineUser = this.onlineUsers.get(client.id);
      if (!onlineUser) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const message = await this.chatService.sendMessage(onlineUser.userId, data);

      // Emit to all participants in the conversation
      this.server.to(`conversation:${data.conversationId}`).emit('newMessage', message);

      return { success: true, message };
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      const onlineUser = this.onlineUsers.get(client.id);
      if (!onlineUser) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      client.join(`conversation:${data.conversationId}`);
      
      // Get conversation messages
      const messages = await this.chatService.getConversationMessages(
        data.conversationId,
        onlineUser.userId,
      );

      client.emit('conversationMessages', { conversationId: data.conversationId, messages });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const onlineUser = this.onlineUsers.get(client.id);
    if (onlineUser) {
      client.to(`conversation:${data.conversationId}`).emit('userTyping', {
        userId: onlineUser.userId,
        conversationId: data.conversationId,
      });
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const onlineUser = this.onlineUsers.get(client.id);
    if (onlineUser) {
      client.to(`conversation:${data.conversationId}`).emit('userStoppedTyping', {
        userId: onlineUser.userId,
        conversationId: data.conversationId,
      });
    }
  }

  @SubscribeMessage('getOnlineUsers')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineUser = this.onlineUsers.get(client.id);
    if (!onlineUser) return;

    const onlineUsersList = Array.from(this.onlineUsers.values())
      .filter(user => {
        // Internal users can see all online users
        if (onlineUser.userType === 'INTERNAL') return true;
        // External users can only see internal users
        return user.userType === 'INTERNAL';
      })
      .map(user => ({
        userId: user.userId,
        userType: user.userType,
        department: user.department,
      }));

    client.emit('onlineUsers', onlineUsersList);
  }

  // Method to notify specific users
  notifyUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Method to notify department
  notifyDepartment(department: string, event: string, data: any) {
    this.server.to(`department:${department}`).emit(event, data);
  }
}
