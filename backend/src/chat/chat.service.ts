import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConversationDto, CreateMessageDto } from './dto';
import { UserType } from '@prisma/client';
import { ChatConversation, ChatMessage, ChatUser } from './interfaces/chat.interface';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createConversation(
    userId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<ChatConversation> {
    const { name, type, departmentId, participantIds } = createConversationDto;

    // Add creator to participants if not already included
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

  async getUserConversations(userId: string): Promise<ChatConversation[]> {
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

  async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
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

  async sendMessage(
    userId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<ChatMessage> {
    const { conversationId, content, type, replyToId } = createMessageDto;

    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
        isActive: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
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

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return this.formatMessage(message);
  }

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<{ marked: number }> {
    // verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, isActive: true },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    // find unread messages for this user (exclude user's own messages)
    const unread = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isDeleted: false,
        readReceipts: { none: { userId } },
      },
      select: { id: true },
    });

    if (unread.length === 0) return { marked: 0 };

    await this.prisma.messageReadReceipt.createMany({
      data: unread.map((m) => ({ messageId: m.id, userId })),
    });

    return { marked: unread.length };
  }

  async deleteMessage(
    userId: string,
    messageId: string,
  ): Promise<ChatMessage> {
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
      throw new NotFoundException('Message not found');
    }

    // allow sender OR conversation creator to delete (for GROUP/DEPARTMENT moderation)
    const isModerator =
      message.conversation?.type === 'GROUP' || message.conversation?.type === 'DEPARTMENT'
        ? message.conversation?.createdById === userId
        : false;
    if (message.senderId !== userId && !isModerator) {
      throw new ForbiddenException('Not allowed to delete this message');
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

  async findOrCreatePrivateConversation(
    userId: string,
    otherUserId: string,
  ): Promise<ChatConversation> {
    // Check if private conversation already exists
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

    // Create new private conversation
    return this.createConversation(userId, {
      type: 'PRIVATE',
      participantIds: [otherUserId],
    });
  }

  async getDepartmentUsers(departmentId: string): Promise<ChatUser[]> {
    const users = await this.prisma.user.findMany({
      where: {
        departmentId: departmentId,
        isActive: true,
        userType: UserType.INTERNAL,
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

  async getAvailableUsers(userId: string, userType: UserType): Promise<ChatUser[]> {
    const whereClause = userType === UserType.INTERNAL 
      ? { userType: UserType.INTERNAL, isActive: true }
      : { userType: { in: [UserType.INTERNAL, UserType.EXTERNAL] }, isActive: true };

    const users = await this.prisma.user.findMany({
      where: {
        ...whereClause,
        NOT: { id: userId },
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

  private formatConversation(conversation: any): ChatConversation {
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

  private formatMessage(message: any): ChatMessage {
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

  private formatUser(user: any): ChatUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      department: user.department,
    };
  }
}
