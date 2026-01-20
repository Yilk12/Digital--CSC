import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { KnowledgeBaseAnalyticsService } from "./analytics.service"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole, Language } from "@prisma/client"

@ApiTags("Knowledge Base - Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("knowledge-base/analytics")
export class KnowledgeBaseAnalyticsController {
  constructor(private readonly analyticsService: KnowledgeBaseAnalyticsService) {}

  @ApiOperation({ summary: "Get knowledge base overview statistics" })
  @ApiResponse({ status: 200, description: "Overview statistics retrieved successfully" })
  @Get("overview")
  getOverview(@Request() req) {
    return this.analyticsService.getOverviewStats(req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Get article performance metrics" })
  @ApiQuery({ name: "period", required: false, type: String, description: "Time period: day, week, month, year" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Number of top articles to return" })
  @Get("articles/performance")
  getArticlePerformance(
    @Request() req,
    @Query("period") period = "month",
    @Query("limit") limit = 10
  ) {
    return this.analyticsService.getArticlePerformance(period, limit, req.user.role)
  }

  @ApiOperation({ summary: "Get article views trends over time" })
  @ApiQuery({ name: "period", required: false, type: String })
  @ApiQuery({ name: "groupBy", required: false, type: String, description: "Group by: day, week, month" })
  @Get("articles/trends")
  getArticleTrends(
    @Request() req,
    @Query("period") period = "3months",
    @Query("groupBy") groupBy = "week"
  ) {
    return this.analyticsService.getArticleTrends(period, groupBy)
  }

  @ApiOperation({ summary: "Get category performance statistics" })
  @Get("categories/performance")
  getCategoryPerformance(@Request() req) {
    return this.analyticsService.getCategoryPerformance(req.user.role)
  }

  @ApiOperation({ summary: "Get search analytics" })
  @ApiQuery({ name: "period", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("search")
  getSearchAnalytics(
    @Query("period") period = "month"
  ) {
    return this.analyticsService.getSearchAnalytics(period)
  }

  @ApiOperation({ summary: "Get user engagement metrics" })
  @ApiQuery({ name: "period", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("engagement")
  getUserEngagement(
    @Query("period") period = "month"
  ) {
    return this.analyticsService.getUserEngagement(period)
  }

  @ApiOperation({ summary: "Get content gap analysis" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head, UserRole.SUPPORT_AGENT)
  @Get("content-gaps")
  getContentGaps(@Request() req) {
    return this.analyticsService.getContentGapAnalysis()
  }

  

  @ApiOperation({ summary: "Get language distribution analytics" })
  @Get("languages")
  getLanguageDistribution(@Request() req) {
    return this.analyticsService.getLanguageDistribution(req.user.role)
  }

  @ApiOperation({ summary: "Get feedback and rating analytics" })
  @ApiQuery({ name: "period", required: false, type: String })
  @Get("feedback")
  getFeedbackAnalytics(
    @Request() req,
    @Query("period") period = "month"
  ) {
    return this.analyticsService.getFeedbackAnalytics(period)
  }

  @ApiOperation({ summary: "Get knowledge base ROI metrics" })
  @ApiQuery({ name: "period", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("roi")
  getROIMetrics(
    @Query("period") period = "month"
  ) {
    return this.analyticsService.getROIMetrics(period)
  }

  @ApiOperation({ summary: "Get content lifecycle analytics" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("content-lifecycle")
  getContentLifecycle(@Request() req) {
    return this.analyticsService.getContentLifecycleAnalytics()
  }

  @ApiOperation({ summary: "Get popular tags and topics" })
  @ApiQuery({ name: "period", required: false, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("tags/popular")
  getPopularTags(
    @Query("period") period = "month",
    @Query("limit") limit = 20
  ) {
    return this.analyticsService.getPopularTags(period, limit)
  }

  @ApiOperation({ summary: "Get knowledge base health score" })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("health-score")
  getHealthScore(@Request() req) {
    return this.analyticsService.getKnowledgeBaseHealthScore()
  }

  @ApiOperation({ summary: "Get comparative analytics" })
  @ApiQuery({ name: "currentPeriod", required: false, type: String })
  @ApiQuery({ name: "previousPeriod", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("comparative")
  getComparativeAnalytics(
    @Query("currentPeriod") currentPeriod = "month",
    @Query("previousPeriod") previousPeriod = "previousMonth"
  ) {
    return this.analyticsService.getComparativeAnalytics(currentPeriod, previousPeriod)
  }

  @ApiOperation({ summary: "Get real-time activity feed" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("activity")
  getRealtimeActivity(
    @Request() req,
    @Query("limit") limit = 20
  ) {
    return this.analyticsService.getRealtimeActivity(limit, req.user.role)
  }

  @ApiOperation({ summary: "Export analytics data" })
  @ApiQuery({ name: "type", required: false, enum: ["overview", "articles", "search", "engagement"] })
  @ApiQuery({ name: "format", required: false, enum: ["csv", "xlsx", "json"] })
  @ApiQuery({ name: "period", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("export")
  exportAnalytics(
    @Request() req,
    @Query("type") type = "overview",
    @Query("format") format = "xlsx",
    @Query("period") period = "month"
  ) {
    return this.analyticsService.exportAnalyticsData(type, format, period, req.user.userId)
  }

}
