import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger"
import { SearchService } from "./search.service"
import { SearchQueryDto } from "./dto/search-query.dto"
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"
import { UserRole, Language } from "@prisma/client"

@ApiTags("Knowledge Base - Search")
@Controller("knowledge-base/search")
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: "Search articles with advanced filters" })
  @ApiQuery({ name: "q", required: true, type: String, description: "Search query" })
  @ApiQuery({ name: "language", required: false, enum: Language })
  @ApiQuery({ name: "categoryId", required: false, type: String })
  @ApiQuery({ name: "tags", required: false, type: String, description: "Comma-separated tags" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "sortBy", required: false, enum: ["relevance", "date", "views", "rating"] })
  @Get()
  async searchArticles(
    @Query("q") query: string,
    @Query("language") language?: Language,
    @Query("categoryId") categoryId?: string,
    @Query("tags") tags?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Query("sortBy") sortBy = "relevance"
  ) {
    const searchParams = {
      query,
      language,
      categoryId,
      tags: tags?.split(","),
      page,
      limit,
      sortBy
    }
    
    return this.searchService.searchArticles(searchParams)
  }

  @ApiOperation({ summary: "Get search suggestions/autocomplete" })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("suggestions")
  async getSearchSuggestions(
    @Query("q") query: string,
    @Query("limit") limit = 5
  ) {
    return this.searchService.getSearchSuggestions(query, limit)
  }

  @ApiOperation({ summary: "Get popular search terms" })
  @ApiQuery({ name: "period", required: false, type: String, description: "Time period: day, week, month" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @Get("popular")
  async getPopularSearches(
    @Query("period") period = "week",
    @Query("limit") limit = 10
  ) {
    return this.searchService.getPopularSearches(period, limit)
  }

  @ApiOperation({ summary: "Advanced search with filters" })
  @Post("advanced")
  async advancedSearch(@Body() searchQuery: SearchQueryDto) {
    return this.searchService.advancedSearch(searchQuery)
  }

  @ApiOperation({ summary: "Search within specific category" })
  @Get("category/:categoryId")
  async searchInCategory(
    @Query("q") query: string,
    @Query("categoryId") categoryId: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.searchService.searchArticles({ query, categoryId, page, limit })
  }

  @ApiOperation({ summary: "Semantic search using AI" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("semantic")
  async semanticSearch(
    @Body() body: { query: string; context?: string },
    @Request() req
  ) {
    return this.searchService.searchArticles({ query: body.query, userId: req.user.userId, page: 1, limit: 10 })
  }

  @ApiOperation({ summary: "Get search analytics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.Department_Head)
  @Get("analytics")
  async getSearchAnalytics(
    @Query("period") period = "month",
    @Query("limit") limit = 20
  ) {
    return this.searchService.getSearchAnalytics(period)
  }

  @ApiOperation({ summary: "Track search interaction" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("track")
  async trackSearchInteraction(
    @Body() body: { 
      query: string
      articleId?: string
      action: "search" | "click" | "helpful" | "not_helpful"
    },
    @Request() req
  ) {
    return this.searchService.trackSearchInteraction(
      body.query,
      body.action,
      req.user.userId,
      body.articleId
    )
  }

  @ApiOperation({ summary: "Get search history for user" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("history")
  async getSearchHistory(
    @Request() req,
    @Query("limit") limit = 20
  ) {
    return this.searchService.getSearchHistory(req.user.userId, limit)
  }

  @ApiOperation({ summary: "Clear search history" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("history/clear")
  async clearSearchHistory(@Request() req) {
    return this.searchService.clearSearchHistory(req.user.userId)
  }
}
