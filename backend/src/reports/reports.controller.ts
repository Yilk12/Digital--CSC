import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { Response } from "express"
import { ReportsService } from "./reports.service"
import { GenerateReportDto } from "./dto/generate-report.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole, ReportFrequency } from "@prisma/client"

@ApiTags("Help Desk Reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: "Generate comprehensive ticket report" })
  @ApiResponse({ status: 200, description: "Report generated successfully" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("tickets")
  generateTicketReport(@Body() generateReportDto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateTicketReport(generateReportDto, req.user.userId)
  }

  @ApiOperation({ summary: "Generate agent performance report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("agent-performance")
  generateAgentPerformanceReport(@Body() generateReportDto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateAgentPerformanceReport(generateReportDto, req.user.userId)
  }

  @ApiOperation({ summary: "Generate SLA compliance report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("sla-compliance")
  generateSlaReport(@Body() generateReportDto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateSlaReport(generateReportDto, req.user.userId)
  }

  @ApiOperation({ summary: "Generate department performance report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("department-performance")
  generateDepartmentReport(@Body() generateReportDto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateDepartmentReport(generateReportDto, req.user.userId)
  }

  @ApiOperation({ summary: "Generate customer satisfaction report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("customer-satisfaction")
  generateSatisfactionReport(@Body() generateReportDto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateSatisfactionReport(generateReportDto, req.user.userId)
  }

  @ApiOperation({ summary: "Generate knowledge base analytics report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("knowledge-base")
  generateKnowledgeBaseReport(@Body() generateReportDto: GenerateReportDto, @Request() req) {
    return this.reportsService.generateKnowledgeBaseReport(generateReportDto, req.user.userId)
  }

  @ApiOperation({ summary: "Get available report templates" })
  @Get("templates")
  getReportTemplates(@Request() req) {
    return this.reportsService.getReportTemplates(req.user.role)
  }

  @ApiOperation({ summary: "Get report history" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("history")
  getReportHistory(
    @Request() req,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.reportsService.getReportHistory(req.user.userId, req.user.role, page, limit)
  }

  @ApiOperation({ summary: "Download report by ID" })
  @Get("download/:reportId")
  async downloadReport(
    @Query("reportId") reportId: string,
    @Request() req,
    @Res() res: Response
  ) {
    const report = await this.reportsService.downloadReport(reportId, req.user.userId, req.user.role)
    
    res.setHeader('Content-Type', report.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`)
    res.send(report.data)
  }

  @ApiOperation({ summary: "Schedule recurring report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("schedule")
  scheduleReport(
    @Body() body: {
      reportType: string
      parameters: any
      frequency: "daily" | "weekly" | "monthly"
      recipients: string[]
    },
    @Request() req
  ) {
    const frequencyMap = {
      daily: ReportFrequency.DAILY,
      weekly: ReportFrequency.WEEKLY,
      monthly: ReportFrequency.MONTHLY,
    } as const
    const frequency = frequencyMap[body.frequency]
    return this.reportsService.scheduleReport(
      body.reportType,
      body.parameters,
      frequency,
      body.recipients,
      req.user.userId
    )
  }

  @ApiOperation({ summary: "Get scheduled reports" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("scheduled")
  getScheduledReports(@Request() req) {
    return this.reportsService.getScheduledReports(req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Cancel scheduled report" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Post("scheduled/:scheduleId/cancel")
  cancelScheduledReport(@Query("scheduleId") scheduleId: string, @Request() req) {
    return this.reportsService.cancelScheduledReport(scheduleId, req.user.userId)
  }

  @ApiOperation({ summary: "Get report statistics" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("statistics")
  getReportStatistics(@Request() req) {
    return this.reportsService.getReportStatistics(req.user.role)
  }

  @ApiOperation({ summary: "Export dashboard data" })
  @ApiQuery({ name: "format", required: false, enum: ["csv", "xlsx", "pdf"] })
  @Get("export/dashboard")
  exportDashboardData(
    @Request() req,
    @Query("format") format = "xlsx"
  ) {
    return this.reportsService.exportDashboardData(format, req.user.userId, req.user.role)
  }
}
