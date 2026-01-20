import { Controller, Get, Post, Patch, Delete, Body, Param, Request, Query, UseGuards, UseInterceptors, UploadedFiles } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { TicketsService } from "./tickets.service";
import { CommentsService } from "./comments.service";
import { AttachmentsService } from "./attachments.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { TicketStatus, TicketPriority, TicketCategory, UserRole } from "@prisma/client";
import { Express } from "express";

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

  // -------------------- Create Ticket --------------------
  @ApiOperation({ summary: "Create a new ticket" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Ticket created successfully" })
  @UseInterceptors(FilesInterceptor("files", 5))
  @Post()
  async create(@Body() createTicketDto: CreateTicketDto, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    const ticket = await this.ticketsService.create(createTicketDto, req.user.userId);
    if (files?.length) await this.attachmentsService.createMultiple(ticket.id, files);
    return ticket;
  }

  // -------------------- List Tickets --------------------
 @ApiOperation({ summary: "Get all tickets with pagination and filters" })
@ApiQuery({ name: "page", required: false, type: Number })
@ApiQuery({ name: "limit", required: false, type: Number })
@ApiQuery({ name: "status", required: false, enum: TicketStatus })
@ApiQuery({ name: "priority", required: false, enum: TicketPriority })
@ApiQuery({ name: "category", required: false, enum: TicketCategory })
@ApiQuery({ name: "assigneeId", required: false, type: String })
@ApiQuery({ name: "departmentId", required: false, type: String })
@ApiQuery({ name: "search", required: false, type: String })
@Roles(
  UserRole.ADMIN,
  UserRole.Commissioner,
  UserRole.Department_Head,
  UserRole.SUPPORT_AGENT,
  UserRole.END_USER,
  UserRole.Driver,
  UserRole.Fleet_Manager,
  UserRole.Maintenace_Team,
  UserRole.Team_Leader,
  UserRole.Announcement_Creator,
  UserRole.Finance_Department
)
@Get()
findAll(@Request() req, @Query() query) {
  
  return this.ticketsService.findAll(
    query.page,
    query.limit,
    query.status,
    query.priority,
    query.category,
    query.assigneeId,
    query.departmentId,
    query.search,
    req.user.userId,   // ✅ ID from logged-in user (token)
    req.user.role,     // ✅ Role from logged-in user (token)
  );
}

//-------------Get Notification for the department------------------
 @UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Get notifications for logged-in user' })
@Roles(
  UserRole.ADMIN,
  UserRole.Commissioner,
  UserRole.Department_Head,
  UserRole.SUPPORT_AGENT,
  UserRole.END_USER,
  UserRole.Driver,
  UserRole.Fleet_Manager,
  UserRole.Maintenace_Team,
  UserRole.Team_Leader,
  UserRole.Announcement_Creator,
  UserRole.Finance_Department
)
@Get('all-notification')
async getNotifications(@Request() req) {
  // req.user.userId is from JWT payload
  return this.ticketsService.getUserNotifications(req.user.userId);
}


  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark notification as read' })
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.ticketsService.markAsRead(id);
  }


  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete notification by ID' })
  @Delete('all-notification/:id')
  async deleteNotification(@Param('id') id: string, @Request() req) {
    return this.ticketsService.deleteNotification(id, req.user.userId);
  }


  // -------------------- Get Ticket Stats --------------------
  @ApiOperation({ summary: "Get ticket statistics" })
  @Get("stats")
  getStats(@Request() req) {
    return this.ticketsService.getTicketStats(req.user.userId, req.user.role);
  }

  // -------------------- Get Single Ticket --------------------
  @ApiOperation({ summary: "Get ticket by ID" })
  @Get(":id")
  findOne(@Param("id") id: string, @Request() req) {
    return this.ticketsService.findOne(id, req.user.userId, req.user.role);
  }

  // -------------------- Update Ticket --------------------
  @ApiOperation({ summary: "Update ticket" })
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTicketDto: UpdateTicketDto, @Request() req) {
    return this.ticketsService.update(id, updateTicketDto, req.user.userId, req.user.role);
  }

  // -------------------- Update Ticket Status Only --------------------
  @ApiOperation({ summary: "Update ticket status only" })
  @Patch(":id/status")
  updateStatusOnly(@Param("id") id: string, @Body("status") status: TicketStatus, @Request() req) {
    // Reuse the generic update service but pass only the status field
    return this.ticketsService.update(id, { status } as any, req.user.userId, req.user.role);
  }

  //-----------------------update status to open------------
@ApiOperation({ summary: "Update ticket status to Open" })
@Patch("update/:id")
updateStatus(@Param("id") id: string) {
  return this.ticketsService.updateStatus(id);
}



  // -------------------- Delete Ticket --------------------
  @ApiOperation({ summary: "Delete ticket" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Delete(":id")
  remove(@Param("id") id: string, @Request() req) {
    return this.ticketsService.remove(id, req.user.userId, req.user.role);
  }

  // -------------------- Add Comment --------------------
  @ApiOperation({ summary: "Add comment to ticket" })
  @Post(":id/comments")
  addComment(@Param("id") ticketId: string, @Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(ticketId, createCommentDto, req.user.userId);
  }

  // -------------------- Get Comments --------------------
  @ApiOperation({ summary: "Get ticket comments" })
  @Get(":id/comments")
  getComments(@Param("id") ticketId: string) {
    return this.commentsService.findByTicket(ticketId);
  }

  // -------------------- Add Attachments --------------------
  @ApiOperation({ summary: "Add attachments to ticket" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FilesInterceptor("files", 5))
  @Post(":id/attachments")
  addAttachments(@Param("id") ticketId: string, @UploadedFiles() files: Express.Multer.File[]) {
    return this.attachmentsService.createMultiple(ticketId, files);
  }

  // -------------------- Get Attachments --------------------
  @ApiOperation({ summary: "Get ticket attachments" })
  @Get(":id/attachments")
  getAttachments(@Param("id") ticketId: string) {
    return this.attachmentsService.findByTicket(ticketId);
  }

  // -------------------- Assign Ticket to Vehicle --------------------
  @ApiOperation({ summary: "Assign ticket to a vehicle" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head, UserRole.SUPPORT_AGENT)
  @Post(":ticketId/assign-vehicle")
  assignTicketToVehicle(@Param("ticketId") ticketId: string, @Body("vehicleId") vehicleId: string, @Request() req) {
    return this.ticketsService.assignTicketToVehicle(ticketId, vehicleId, req.user.userId);
  }
}
