import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { SearchQueryDto } from './dto/search-query.dto'
import { Language, ArticleStatus, Prisma } from "@prisma/client"

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchArticles(params: {
    query: string
    language?: Language
    categoryId?: string
    page?: number
    limit?: number
    userId?: string
  }) {
    const { query, language, categoryId, page = 1, limit = 10, userId } = params
    const skip = (page - 1) * limit

    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { excerpt: { contains: query } }
      ]
    }

    if (language) {
      where.language = language
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } }
        },
        orderBy: { viewCount: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.article.count({ where })
    ])

    // Track search if user is provided
    if (userId) {
      await this.trackSearchQuery(query, userId, total)
    }

    return {
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt || article.content.substring(0, 200) + '...',
        category: article.category?.name || 'Uncategorized',
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        createdAt: article.createdAt,
        language: article.language
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getSearchSuggestions(query: string, limit = 5) {
    const [titleSuggestions, popularSearches] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          title: { contains: query }
        },
        select: { title: true },
        take: limit,
        orderBy: { viewCount: 'desc' }
      }),
      this.prisma.searchQuery.findMany({
        where: {
          query: { contains: query }
        },
        select: { query: true },
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ])

    const suggestions = [
      ...titleSuggestions.map(article => article.title),
      ...popularSearches.map(search => search.query)
    ]

    return [...new Set(suggestions)].slice(0, limit)
  }

  async getPopularSearches(period: string, limit: number) {
    const dateRange = this.getDateRange(period)
    
    return this.prisma.searchQuery.findMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      select: {
        query: true,
        results: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  async advancedSearch(searchQuery: SearchQueryDto) {
    const where: Prisma.ArticleWhereInput = {
      status: ArticleStatus.PUBLISHED
    }

    if (searchQuery.title) {
      where.title = { contains: searchQuery.title }
    }

    if (searchQuery.content) {
      where.content = { contains: searchQuery.content }
    }

    

    if (searchQuery.categoryIds && searchQuery.categoryIds.length > 0) {
      where.categoryId = { in: searchQuery.categoryIds }
    }

    if (searchQuery.language) {
      where.language = searchQuery.language
    }

    if (searchQuery.dateFrom || searchQuery.dateTo) {
      where.createdAt = {}
      if (searchQuery.dateFrom) {
        where.createdAt.gte = new Date(searchQuery.dateFrom)
      }
      if (searchQuery.dateTo) {
        where.createdAt.lte = new Date(searchQuery.dateTo)
      }
    }

    if (searchQuery.minViews) {
      where.viewCount = { gte: searchQuery.minViews }
    }

    const page = searchQuery.page || 1
    const limit = searchQuery.limit || 10
    const skip = (page - 1) * limit

    const orderBy: Prisma.ArticleOrderByWithRelationInput = {}
    const sortBy = searchQuery.sortBy || 'createdAt'
    const sortOrder = searchQuery.sortOrder || 'desc'

    if (sortBy === 'views') {
      orderBy.viewCount = sortOrder
    } else if (sortBy === 'likes') {
      orderBy.likeCount = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } }
        },
        orderBy,
        skip,
        take: limit
      }),
      this.prisma.article.count({ where })
    ])

    return {
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt || article.content.substring(0, 200) + '...',
        category: article.category?.name || 'Uncategorized',
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        createdAt: article.createdAt,
        language: article.language
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async getSearchAnalytics(period: string) {
    const dateRange = this.getDateRange(period)
    
    const [totalSearches, uniqueQueries, topQueries] = await Promise.all([
      this.prisma.searchQuery.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      this.prisma.searchQuery.groupBy({
        by: ['query'],
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      this.prisma.searchQuery.findMany({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          query: true,
          results: true
        }
      })
    ])

    return {
      period,
      totalSearches,
      uniqueQueries: uniqueQueries.length,
      topQueries,
      avgResultsPerSearch: totalSearches > 0 ? topQueries.reduce((sum, q) => sum + q.results, 0) / totalSearches : 0
    }
  }

  async trackSearchInteraction(query: string, action: string, userId: string, articleId?: string) {
    // Create search query first
    const searchQuery = await this.prisma.searchQuery.create({
      data: {
        query,
        userId,
        results: 1
      }
    })

    // Create interaction if articleId is provided
    if (articleId) {
      await this.prisma.searchInteraction.create({
        data: {
          searchQueryId: searchQuery.id,
          articleId,
          action
        }
      })
    }

    return { success: true }
  }

  async getSearchHistory(userId: string, limit: number) {
    return this.prisma.searchQuery.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        query: true,
        results: true,
        createdAt: true
      }
    })
  }

  async clearSearchHistory(userId: string) {
    await this.prisma.searchQuery.deleteMany({
      where: { userId }
    })

    return { message: "Search history cleared successfully" }
  }

  // Helper methods
  private async trackSearchQuery(query: string, userId: string, resultCount: number) {
    const existingQuery = await this.prisma.searchQuery.findFirst({
      where: { query, userId }
    })

    if (existingQuery) {
      await this.prisma.searchQuery.update({
        where: { id: existingQuery.id },
        data: {
          results: resultCount,
          createdAt: new Date()
        }
      })
    } else {
      await this.prisma.searchQuery.create({
        data: {
          query,
          userId,
          results: resultCount
        }
      })
    }
  }

  private getDateRange(period: string) {
    const now = new Date()
    const start = new Date()
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        break
      case 'week':
        start.setDate(now.getDate() - 7)
        break
      case 'month':
        start.setMonth(now.getMonth() - 1)
        break
      case 'year':
        start.setFullYear(now.getFullYear() - 1)
        break
      default:
        start.setDate(now.getDate() - 7)
    }
    
    return { start, end: now }
  }
}
