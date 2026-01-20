import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger"
import { FeedbackService } from "./feedback.service"
import { CreateFeedbackDto, FEEDBACK_TYPES } from "./dto/create-feedback.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { RolesGuard } from "../auth/guards/roles.guard"
import { type $Enums, UserRole } from "@prisma/client"

@ApiTags("Feedback")
@Controller("feedback")
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @ApiOperation({ summary: "List active departments for feedback routing" })
  @Get("/departments")
  listDepartments() {
    return this.service.listDepartments()
  }

  @ApiOperation({ summary: "Submit feedback (role-aware, department-linked)" })
  @ApiBearerAuth()
  @Post()
  async create(@Body() dto: CreateFeedbackDto, @Request() req: any) {
    const user = req?.user ? { userId: req.user.userId, role: req.user.role as $Enums.UserRole } : null
    return this.service.createFeedback(dto, user)
  }

  @ApiOperation({ summary: "List feedback (restricted)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.Department_Head, UserRole.Commissioner)
  @ApiQuery({ name: "departmentId", required: false, type: String })
  @ApiQuery({ name: "type", required: false, enum: FEEDBACK_TYPES })
  @ApiQuery({ name: "from", required: false, type: String, description: "ISO date" })
  @ApiQuery({ name: "to", required: false, type: String, description: "ISO date" })
  @Get()
  async list(
    @Request() req: any,
    @Query("departmentId") departmentId?: string,
    @Query("type") type?: typeof FEEDBACK_TYPES[number],
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const query = {
      departmentId,
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    }

    const requester = {
      userId: req.user.userId as string,
      role: req.user.role as $Enums.UserRole,
      department: req.user.department as string | null,
    }
    return this.service.listFeedback(query, requester)
  }
}
