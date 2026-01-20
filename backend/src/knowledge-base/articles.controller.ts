import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  Body,
  ParseUUIDPipe,
} from "@nestjs/common"
import { FilesInterceptor } from "@nestjs/platform-express"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger"
import { ArticlesService } from "./articles.service"
import { CreateArticleDto } from "./dto/create-article.dto"
import { UpdateArticleDto } from "./dto/update-article.dto"
import  { AddFeedbackDto } from "./dto/add-feedback.dto"
import  { AddCommentDto } from "./dto/add-comment.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { ArticleStatus, Language, UserRole } from "@prisma/client"
import  { Express } from "express"

@ApiTags("Knowledge Base - Articles")
@Controller("knowledge-base/articles")
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

@ApiOperation({ summary: "Create a new article" })
@ApiResponse({ status: 201, description: "Article created successfully" })
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
@ApiConsumes("multipart/form-data")
@UseInterceptors(FilesInterceptor("files"))
@Post()
create(
  @Body() createArticleDto: CreateArticleDto,
  @UploadedFiles() files: Express.Multer.File[],
  @Request() req,
) {
  return this.articlesService.create(createArticleDto, req.user.userId, files);
}



  @ApiOperation({ summary: "Get all articles with pagination and filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: ArticleStatus })
  @ApiQuery({ name: "language", required: false, enum: Language })
  @ApiQuery({ name: "categoryId", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "authorId", required: false, type: String })
  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: number | string,
    @Query('limit') limit?: number | string,
    @Query('status') status?: ArticleStatus,
    @Query('language') language?: Language,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,

  ) {
    const p = typeof page === 'string' ? parseInt(page, 10) : page
    const l = typeof limit === 'string' ? parseInt(limit, 10) : limit
    return this.articlesService.findAll(p, l, status, language, categoryId, search)
  }

  @ApiOperation({ summary: "Get article statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("stats")
  getStats(@Request() req, @Query('authorId') authorId?: string) {
    // If not admin, only show own stats
    const targetAuthorId = req.user.role === UserRole.ADMIN ? authorId : req.user.userId
   
  }

  @ApiOperation({ summary: "Get article by ID" })
  @Get(":id")
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Query('incrementView') incrementView?: boolean | string) {
    const incr = typeof incrementView === 'string' ? incrementView === 'true' : Boolean(incrementView)
    return this.articlesService.findOne(id, incr)
  }

  @ApiOperation({ summary: "Get related articles" })
  @Get(":id/related")
  getRelated(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Query('limit') limit?: number | string) {
    const l = typeof limit === 'string' ? parseInt(limit, 10) : limit
    return this.articlesService.getRelatedArticles(id, l)
  }

  @ApiOperation({ summary: "Update article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
  @Patch(":id")
  update(@Param('id') id: string, @Body() updateArticleDto: UpdateArticleDto, @Request() req) {
    return this.articlesService.update(id, updateArticleDto, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Delete article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head)
  @Delete(":id")
  remove(@Param('id') id: string, @Request() req) {
    return this.articlesService.remove(id, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Add feedback to article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(":id/feedback")
  addFeedback(@Param('id') articleId: string, @Body() addFeedbackDto: AddFeedbackDto, @Request() req) {
    return this.articlesService.addFeedback(articleId, req.user.userId, addFeedbackDto.isLike)
  }

  @ApiOperation({ summary: "Add comment to article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(":id/comments")
  addComment(@Param('id') articleId: string, @Body() addCommentDto: AddCommentDto, @Request() req) {
    return this.articlesService.addComment(articleId, addCommentDto.content, req.user.userId)
  }

  @ApiOperation({ summary: "Delete comment from article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(":id/comments/:commentId")
  deleteComment(
    @Param('id') articleId: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.articlesService.deleteComment(articleId, commentId, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Hide comment on article (soft delete)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(":id/comments/:commentId/hide")
  hideComment(
    @Param('id') articleId: string,
    @Param('commentId') commentId: string,
    @Request() req,
  ) {
    return this.articlesService.hideComment(articleId, commentId, req.user.userId, req.user.role)
  }

  //=================REPORT ENDPOINTS===========================

  @ApiOperation({ summary: "Get combined helpdesk overview (Tickets + Articles)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/combined-overview")
  getCombinedOverview() {
    return this.articlesService.getCombinedOverview();
  }

  @ApiOperation({ summary: "Get ticket summary report" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/ticket-summary")
  getTicketSummary() {
    return this.articlesService.getTicketSummary();
  }

  @ApiOperation({ summary: "Get article summary report" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/article-summary")
  getArticleSummary() {
    return this.articlesService.getArticleSummary();
  }

  @ApiOperation({ summary: "Get tickets grouped by priority" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/tickets-by-priority")
  getTicketsByPriority() {
    return this.articlesService.getTicketsByPriority();
  }

  @ApiOperation({ summary: "Get tickets grouped by category" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/tickets-by-category")
  getTicketsByCategory() {
    return this.articlesService.getTicketsByCategory();
  }

  @ApiOperation({ summary: "Get tickets created over time" })
  @ApiQuery({ name: "days", required: false, type: Number, description: "Number of days to look back (default: 30)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/tickets-over-time")
  getTicketsOverTime(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.articlesService.getTicketsOverTime(daysNumber);
  }

  @ApiOperation({ summary: "Get articles grouped by status" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/articles-by-status")
  getArticlesByStatus() {
    return this.articlesService.getArticlesByStatus();
  }

  @ApiOperation({ summary: "Get articles grouped by language" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/articles-by-language")
  getArticlesByLanguage() {
    return this.articlesService.getArticlesByLanguage();
  }

  @ApiOperation({ summary: "Get top performing articles by views" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/top-articles")
  getTopArticles() {
    return this.articlesService.getTopArticles();
  }

  @ApiOperation({ summary: "Get article engagement analytics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/article-engagement")
  getArticleEngagement() {
    return this.articlesService.getArticleEngagement();
  }

  @ApiOperation({ summary: "Get ticket resolution analytics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/ticket-resolution-analytics")
  getTicketResolutionAnalytics() {
    return this.articlesService.getTicketResolutionAnalytics();
  }

  @ApiOperation({ summary: "Get helpdesk performance metrics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("reports/performance-metrics")
  getPerformanceMetrics() {
    return this.articlesService.getPerformanceMetrics();
  }
  }
