import { Controller, Get, Query, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import  { AnalyticsService } from "./analytics.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole } from "@prisma/client"

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get dashboard overview metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved' })
  @Get('dashboard')
  getDashboardOverview(@Req() req) {
    return this.analyticsService.getDashboardOverview(req.user.role, req.user.userId);
  }

  @ApiOperation({ summary: "Get ticket analytics" })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  @Get("tickets")
  getTicketAnalytics(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Req() req?) {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    return this.analyticsService.getTicketAnalytics(start, end, req.user.role, req.user.userId)
  }

  @ApiOperation({ summary: "Get knowledge base analytics" })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  @Get("knowledge-base")
  getKnowledgeBaseAnalytics(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string, @Req() req?) {
    const start = startDate ? new Date(startDate) : undefined
    const end = endDate ? new Date(endDate) : undefined

    return this.analyticsService.getKnowledgeBaseAnalytics(start, end, req.user.role, req.user.userId)
  }

  @ApiOperation({ summary: 'Get user analytics' })
  @Roles(UserRole.ADMIN, UserRole.Commissioner, UserRole.Department_Head)
  @Get('users')
  getUserAnalytics(@Req() req) {
    return this.analyticsService.getUserAnalytics();
  }
}
