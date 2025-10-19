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
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "Article created successfully" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.STAFF_MANAGER)
  @UseInterceptors(FilesInterceptor("files", 5))
  @Post()
  create(@Body() createArticleDto: CreateArticleDto, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    return this.articlesService.create(createArticleDto, req.user.userId, files)
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
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ArticleStatus,
    @Query('language') language?: Language,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,

  ) {
    return this.articlesService.findAll(page, limit, status, language, categoryId, search, authorId, req?.user?.role)
  }

  @ApiOperation({ summary: "Get article statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("stats")
  getStats(@Request() req, @Query('authorId') authorId?: string) {
    // If not admin, only show own stats
    const targetAuthorId = req.user.role === UserRole.ADMIN ? authorId : req.user.userId
    return this.articlesService.getArticleStats(targetAuthorId)
  }

  @ApiOperation({ summary: "Get article by ID" })
  @Get(":id")
  findOne(@Param('id') id: string, @Query('incrementView') incrementView?: boolean) {
    return this.articlesService.findOne(id, incrementView === true)
  }

  @ApiOperation({ summary: "Get related articles" })
  @Get(":id/related")
  getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.articlesService.getRelatedArticles(id, limit)
  }

  @ApiOperation({ summary: "Update article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.STAFF_MANAGER)
  @Patch(":id")
  update(@Param('id') id: string, updateArticleDto: UpdateArticleDto, @Request() req) {
    return this.articlesService.update(id, updateArticleDto, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Delete article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.STAFF_MANAGER)
  @Delete(":id")
  remove(@Param('id') id: string, @Request() req) {
    return this.articlesService.remove(id, req.user.userId, req.user.role)
  }

  @ApiOperation({ summary: "Add feedback to article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(":id/feedback")
  addFeedback(@Param('id') articleId: string, addFeedbackDto: AddFeedbackDto, @Request() req) {
    return this.articlesService.addFeedback(articleId, req.user.userId, addFeedbackDto.isLike)
  }

  @ApiOperation({ summary: "Add comment to article" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(":id/comments")
  addComment(@Param('id') articleId: string, addCommentDto: AddCommentDto, @Request() req) {
    return this.articlesService.addComment(articleId, addCommentDto.content, req.user.userId)
  }
}
