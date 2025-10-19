import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto, CreateMessageDto } from './dto';
import { UserType } from '@prisma/client';
import { ChatGateway } from './chat.gateway';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  async getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(
    @Request() req,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(req.user.id, createConversationDto);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  async getConversationMessages(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.chatService.getConversationMessages(
      conversationId,
      req.user.id,
      page,
      limit,
    );
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.sendMessage(req.user.id, createMessageDto);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark a conversation as read' })
  async markConversationAsRead(@Request() req, @Param('id') conversationId: string) {
    const result = await this.chatService.markConversationAsRead(conversationId, req.user.id);
    // notify conversation room that this user read messages
    this.chatGateway.server
      .to(`conversation:${conversationId}`)
      .emit('messagesRead', { conversationId, userId: req.user.id, count: result.marked });
    return result;
  }

  @Post('messages/:id/delete')
  @ApiOperation({ summary: 'Delete (retract) a message by sender' })
  async deleteMessage(@Request() req, @Param('id') messageId: string) {
    const deleted = await this.chatService.deleteMessage(req.user.id, messageId);
    // notify participants in the conversation
    this.chatGateway.server
      .to(`conversation:${deleted.conversationId}`)
      .emit('messageDeleted', { messageId: deleted.id, conversationId: deleted.conversationId });
    return deleted;
  }

  @Get('users/available')
  @ApiOperation({ summary: 'Get available users for chat' })
  async getAvailableUsers(@Request() req) {
    return this.chatService.getAvailableUsers(req.user.id, req.user.userType);
  }

  @Get('departments/:id/users')
  @ApiOperation({ summary: 'Get users in a department' })
  async getDepartmentUsers(@Param('id') departmentId: string) {
    return this.chatService.getDepartmentUsers(departmentId);
  }

  @Post('conversations/private')
  @ApiOperation({ summary: 'Find or create private conversation' })
  async findOrCreatePrivateConversation(
    @Request() req,
    @Body() body: { otherUserId: string },
  ) {
    return this.chatService.findOrCreatePrivateConversation(
      req.user.id,
      body.otherUserId,
    );
  }
}
