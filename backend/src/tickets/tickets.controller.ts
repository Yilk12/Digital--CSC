import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common"
import { FilesInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger"
import { TicketsService } from "./tickets.service"
import { CommentsService } from "./comments.service"
import  { AttachmentsService } from "./attachments.service"
import  { CreateTicketDto } from "./dto/create-ticket.dto"
import { UpdateTicketDto } from "./dto/update-ticket.dto"
import { CreateCommentDto } from "./dto/create-comment.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { TicketStatus, TicketPriority, TicketCategory, UserRole } from "@prisma/client"
import { Express } from "express"

@ApiTags("Tickets")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("tickets")
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly commentsService: CommentsService,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  @ApiOperation({ summary: "Create a new ticket" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Ticket created successfully" })
  @UseInterceptors(FilesInterceptor("files", 5))
  @Post()
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const ticket = await this.ticketsService.create(createTicketDto, req.user.userId)

    if (files && files.length > 0) {
      await this.attachmentsService.createMultiple(ticket.id, files)
    }

    return ticket
  }

  @ApiOperation({ summary: "Get all tickets with pagination and filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: TicketStatus })
  @ApiQuery({ name: "priority", required: false, enum: TicketPriority })
  @ApiQuery({ name: "category", required: false, enum: TicketCategory })
  @ApiQuery({ name: "assigneeId", required: false, type: String })
  @ApiQuery({ name: "departmentId", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('category') category?: TicketCategory,
    @Query('assigneeId') assigneeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    
  ) {
    return this.ticketsService.findAll(
      page,
      limit,
      status,
      priority,
      category,
      assigneeId,
      departmentId,
      search,
      req.user.userId,
      req.user.role,
    )
  }

  @ApiOperation({ summary: 'Get ticket statistics' })
  @Get('stats')
  getStats(@Request() req) {
    return this.ticketsService.getTicketStats(req.user.userId, req.user.role);
  }

  @ApiOperation({ summary: "Get ticket by ID" })
  @Get(":id")
  findOne(@Param('id') id: string, @Request() req) {
    return this.ticketsService.findOne(id, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: 'List current user tickets' })
  @Get('my')
  findMy(@Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: TicketStatus,
    @Query('priority') priority?: TicketPriority,
    @Query('category') category?: TicketCategory,
    @Query('assigneeId') assigneeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
  ) {
    // Force filter to current user regardless of role
    return this.ticketsService.findAll(
      page,
      limit,
      status,
      priority,
      category,
      assigneeId,
      departmentId,
      search,
      req.user.userId,
      req.user.role,
    )
  }

  @ApiOperation({ summary: "Update ticket" })
  @Patch(":id")
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto, @Request() req) {
    return this.ticketsService.update(id, updateTicketDto, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Delete ticket" })
  @Roles(UserRole.ADMIN, UserRole.GENERAL_DIRECTOR)
  @Delete(":id")
  remove(@Param('id') id: string, @Request() req) {
    return this.ticketsService.remove(id, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Add comment to ticket" })
  @Post(":id/comments")
  addComment(@Param('id') ticketId: string, @Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(ticketId, createCommentDto, req.user.userId)
  }

  @ApiOperation({ summary: 'Get ticket comments' })
  @Get(':id/comments')
  getComments(@Param('id') ticketId: string) {
    return this.commentsService.findByTicket(ticketId);
  }

  @ApiOperation({ summary: "Add attachments to ticket" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("files", 5))
  @Post(":id/attachments")
  addAttachments(@Param('id') ticketId: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.attachmentsService.createMultiple(ticketId, files)
  }

  @ApiOperation({ summary: 'Get ticket attachments' })
  @Get(':id/attachments')
  getAttachments(@Param('id') ticketId: string) {
    return this.attachmentsService.findByTicket(ticketId);
  }
}
