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
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { HelpdeskService } from "./helpdesk.service"
import { CreateHelpdeskDto } from "./dto/create-helpdesk.dto"
import { UpdateHelpdeskDto } from "./dto/update-helpdesk.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole, TicketStatus, TicketPriority } from "@prisma/client"

@ApiTags("Help Desk Dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("helpdesk")
export class HelpdeskController {
  constructor(private readonly helpdeskService: HelpdeskService) {}

  @ApiOperation({ summary: "Get comprehensive dashboard data" })
  @ApiResponse({ status: 200, description: "Dashboard data retrieved successfully" })
  @Get("dashboard")
  getDashboard(@Request() req) {
    return this.helpdeskService.getDashboardData(req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Get ticket metrics and KPIs" })
  @ApiQuery({ name: "period", required: false, type: String, description: "Time period: day, week, month, year" })
  @Get("metrics")
  getMetrics(@Request() req, @Query("period") period = "month") {
    return this.helpdeskService.getTicketMetrics(req.user.userId, req.user.role, period)
  }

  @ApiOperation({ summary: "Get SLA performance data" })
  @ApiQuery({ name: "departmentId", required: false, type: String })
  @Get("sla-performance")
  getSlaPerformance(@Request() req, @Query("departmentId") departmentId?: string) {
    return this.helpdeskService.getSlaPerformance(req.user.userId, req.user.role, departmentId)
  }

  @ApiOperation({ summary: "Get agent performance statistics" })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Get("agent-performance")
  getAgentPerformance(@Request() req) {
    return this.helpdeskService.getAgentPerformance()
  }

  @ApiOperation({ summary: "Get ticket trends over time" })
  @ApiQuery({ name: "period", required: false, type: String })
  @ApiQuery({ name: "groupBy", required: false, type: String, description: "Group by: day, week, month" })
  @Get("trends")
  getTicketTrends(
    @Request() req,
    @Query("period") period = "3months",
    @Query("groupBy") groupBy = "week"
  ) {
    return this.helpdeskService.getTicketTrends(req.user.userId, req.user.role, period, groupBy)
  }

  @ApiOperation({ summary: "Get workload distribution" })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Get("workload")
  getWorkloadDistribution(@Request() req) {
    return this.helpdeskService.getWorkloadDistribution()
  }

  @ApiOperation({ summary: "Get customer satisfaction metrics" })
  @ApiQuery({ name: "period", required: false, type: String })
  @Get("satisfaction")
  getSatisfactionMetrics(@Request() req, @Query("period") period = "month") {
    return this.helpdeskService.getSatisfactionMetrics(period)
  }

  @ApiOperation({ summary: "Get escalation statistics" })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER, UserRole.SUPPORT_AGENT)
  @Get("escalations")
  getEscalationStats(@Request() req) {
    return this.helpdeskService.getEscalationStats(req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Get department-wise ticket distribution" })
  @Get("departments")
  getDepartmentStats(@Request() req) {
    return this.helpdeskService.getDepartmentStats(req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Get real-time queue status" })
  @Get("queue-status")
  getQueueStatus(@Request() req) {
    return this.helpdeskService.getQueueStatus(req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Get overdue tickets" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("overdue")
  getOverdueTickets(@Request() req, @Query("limit") limit = 10) {
    return this.helpdeskService.getOverdueTickets(req.user.userId, req.user.role, limit)
  }

  @ApiOperation({ summary: "Get recent activity feed" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("activity")
  getRecentActivity(@Request() req, @Query("limit") limit = 20) {
    return this.helpdeskService.getRecentActivity(req.user.userId, req.user.role, limit)
  }

  @ApiOperation({ summary: "Export helpdesk data" })
  @ApiQuery({ name: "format", required: false, enum: ["csv", "xlsx", "pdf"] })
  @ApiQuery({ name: "type", required: false, enum: ["tickets", "reports", "analytics"] })
  @Roles(UserRole.ADMIN, UserRole.STAFF_MANAGER)
  @Get("export")
  exportData(
    @Request() req,
    @Query("format") format = "csv",
    @Query("type") type = "tickets"
  ) {
    return this.helpdeskService.exportData(format, type, req.user.userId)
  }
}
