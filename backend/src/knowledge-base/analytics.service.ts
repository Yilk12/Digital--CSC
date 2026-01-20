import { Injectable } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { UserRole, ArticleStatus, Language } from "@prisma/client"

@Injectable()
export class KnowledgeBaseAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewStats(userId: string, userRole: UserRole) {
    const where = this.buildWhereClause(userId, userRole)
    
    const [
      totalArticles,
      publishedArticles,
      totalViews,
      totalLikes,
      totalComments,
      avgRating
    ] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.count({ where: { ...where, status: ArticleStatus.PUBLISHED } }),
      this.prisma.article.aggregate({
        where,
        _sum: { viewCount: true }
      }),
      this.prisma.article.aggregate({
        where,
        _sum: { likeCount: true }
      }),
      this.prisma.articleComment.count({
        where: { article: where }
      }),
      this.calculateAverageRating(where)
    ])

    return {
      summary: {
        totalArticles,
        publishedArticles,
        totalViews: totalViews._sum.viewCount || 0,
        totalLikes: totalLikes._sum.likeCount || 0,
        totalComments,
        totalSearches: 0, // Placeholder
        averageRating: avgRating,
        publishRate: totalArticles > 0 ? ((publishedArticles / totalArticles) * 100).toFixed(2) : 0
      },
      recentActivity: []
    }
  }

  async getArticlePerformance(period: string, limit: number, userRole: UserRole) {
    const dateRange = this.getDateRange(period)
    const where = {
      status: ArticleStatus.PUBLISHED,
      createdAt: { gte: dateRange.start, lte: dateRange.end }
    }

    const topArticles = await this.prisma.article.findMany({
      where,
      orderBy: [
        { viewCount: "desc" },
        { likeCount: "desc" },
        { createdAt: "desc" }
      ],
      take: limit,
      include: {
        category: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
        _count: {
          select: { comments: true, feedback: true }
        }
      }
    })

    const performanceMetrics = await Promise.all(
      topArticles.map(async (article) => {
        const [viewTrend, engagementRate] = await Promise.all([
          this.calculateViewTrend(article.id, period),
          this.calculateEngagementRate(article.id)
        ])

        return {
          id: article.id,
          tagCount: 0,
          tags: [],
          category: article.category?.name || 'Uncategorized',
          viewCount: true,
          views: article.viewCount,
          likes: article.likeCount,
          comments: article._count.comments,
          feedback: article._count.feedback,
          engagementRate,
          viewTrend,
          createdAt: article.createdAt,
          lastUpdated: article.updatedAt
        }
      })
    )

    return {
      period,
      articles: performanceMetrics,
      summary: {
        totalViews: topArticles.reduce((sum, article) => sum + article.viewCount, 0),
        totalLikes: topArticles.reduce((sum, article) => sum + article.likeCount, 0),
        avgViewsPerArticle: topArticles.length > 0 
          ? (topArticles.reduce((sum, article) => sum + article.viewCount, 0) / topArticles.length).toFixed(2)
          : 0
      }
    }
  }

  async getArticleTrends(period: string, groupBy: string = 'day') {
    const dateRange = this.getDateRange(period)
    
    // Get article creation trends
    const articles = await this.prisma.article.findMany({
      where: {
        createdAt: { gte: dateRange.start, lte: dateRange.end }
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        viewCount: true,
        likeCount: true,
        status: true
      },
      orderBy: { createdAt: "asc" }
    })

    // Get view trends from article view logs (if you have them)
    const trends = this.groupDataByTime(articles, groupBy, [
      { field: "views", label: "Views" },
      { field: "likes", label: "Likes" },
      { field: "articles", label: "Articles Created" }
    ])

    return {
      period,
      groupBy,
      trends: [],
      summary: {
        totalArticles: articles.length,
        totalViews: articles.reduce((sum, article) => sum + article.viewCount, 0),
        totalLikes: articles.reduce((sum, article) => sum + article.likeCount, 0)
      },
      articles: articles.map(a => ({ id: a.id, title: a.title, viewCount: a.viewCount, likeCount: a.likeCount }))
    }
  }

  async getCategoryPerformance(userRole: UserRole) {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        articles: {
          where: { status: ArticleStatus.PUBLISHED },
          select: {
            id: true,
            title: true,
            viewCount: true,
            likeCount: true,
            _count: {
              select: { comments: true }
            }
          }
        },
        _count: {
          select: { articles: true }
        }
      }
    })

    const categoryPerformance = categories.map(category => {
      const articles = category.articles
      const totalViews = articles.reduce((sum, article) => sum + article.viewCount, 0)
      const totalLikes = articles.reduce((sum, article) => sum + article.likeCount, 0)
      const totalComments = articles.reduce((sum, article) => sum + article._count.comments, 0)

      return {
        id: category.id,
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        articleCount: category._count.articles,
        totalViews,
        totalLikes,
        totalComments,
        avgViewsPerArticle: articles.length > 0 ? (totalViews / articles.length).toFixed(2) : 0,
        engagementScore: this.calculateCategoryEngagement(totalViews, totalLikes, totalComments)
      }
    })

    return {
      categories: categoryPerformance.sort((a, b) => b.engagementScore - a.engagementScore),
      summary: {
        totalCategories: categories.length,
        totalArticles: categoryPerformance.reduce((sum, cat) => sum + cat.articleCount, 0),
        mostPopularCategory: categoryPerformance[0]?.name || "N/A"
      }
    }
  }

  async getSearchAnalytics(period: string) {
    const dateRange = this.getDateRange(period)
    
    const [
      totalSearches,
      uniqueQueries,
      searchAnalytics,
      popularSearches,
      searchTrends,
      clickThroughRates,
      noResultQueries
    ] = await Promise.all([
      Promise.resolve({ _sum: { searchCount: 0 } }), // Placeholder for search queries
      Promise.resolve(0), // Placeholder for unique queries
      Promise.resolve([]),
      Promise.resolve(0),
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve(0) // Placeholder for no result queries
    ])

    return {
      period,
      summary: {
        totalSearches: totalSearches._sum.searchCount || 0,
        uniqueQueries,
        noResultQueries,
        searchSuccessRate: uniqueQueries > 0 ? (((uniqueQueries - noResultQueries) / uniqueQueries) * 100).toFixed(2) : 0
      },
      topQueries: [],
      trends: searchTrends
    }
  }

  async getUserEngagement(period: string) {
    const dateRange = this.getDateRange(period)
    
    const [
      activeUsers,
      totalSessions,
      avgSessionDuration,
      bounceRate,
      engagementActions
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          updatedAt: { gte: dateRange.start, lte: dateRange.end }
        }
      }),
      // Placeholder for user sessions
      Promise.resolve(0),
      this.calculateAvgSessionDuration(dateRange),
      this.calculateBounceRate(dateRange),
      this.getEngagementActions(dateRange)
    ])

    return {
      period,
      metrics: {
        activeUsers,
        totalSessions,
        avgSessionDuration,
        bounceRate,
        engagementActions
      }
    }
  }

  async getContentGapAnalysis() {
    const [
      frequentSearches,
      lowPerformingArticles,
      missingTopics,
      categoryGaps
    ] = await Promise.all([
      // Placeholder for search queries
      Promise.resolve([]),
      this.prisma.article.findMany({
        where: {
          status: ArticleStatus.PUBLISHED,
          viewCount: { gte: 100 },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          category: { select: { name: true } }
        }
      }),
      this.identifyMissingTopics(),
      this.analyzeCategoryGaps()
    ])

    return {
      contentGaps: {
        frequentSearchesWithFewResults: frequentSearches,
        lowPerformingArticles,
        suggestedTopics: missingTopics,
        categoryGaps
      },
      recommendations: this.generateContentRecommendations(frequentSearches, categoryGaps)
    }
  }

  

  async getLanguageDistribution(userRole: UserRole) {
    const languageStats = await this.prisma.article.groupBy({
      by: ["language"],
      where: { status: ArticleStatus.PUBLISHED },
      _count: { language: true },
      _sum: { viewCount: true, likeCount: true }
    })

    return {
      distribution: languageStats.map(stat => ({
        language: stat.language,
        articleCount: stat._count?.language || 0,
        totalViews: stat._sum?.viewCount || 0,
        totalLikes: stat._sum?.likeCount || 0
      })).sort((a, b) => b.articleCount - a.articleCount)
    }
  }

  async getFeedbackAnalytics(period: string) {
    const dateRange = this.getDateRange(period)
    
    const feedback = await this.prisma.articleFeedback.findMany({
      where: {
        createdAt: { gte: dateRange.start, lte: dateRange.end }
      },
      include: {
        article: { select: { title: true } }
      }
    })

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    feedback.forEach(f => {
      const rating = f.isLike ? 5 : 1
      ratingDistribution[rating]++
    })

    const avgRating = feedback.reduce((sum, f) => sum + (f.isLike ? 5 : 1), 0) / feedback.length

    return {
      period,
      summary: {
        totalFeedback: feedback.length,
        averageRating: avgRating,
        ratingDistribution
      },
      recentFeedback: feedback.slice(0, 10).map(f => ({
        articleTitle: f.article.title,
        rating: f.isLike ? 5 : 1,
        comment: null, // Not available in current schema
        isHelpful: f.isLike,
        createdAt: f.createdAt
      }))
    }
  }

  async getROIMetrics(period: string) {
    const dateRange = this.getDateRange(period)
    
    // Calculate ROI based on ticket deflection and self-service
    const [
      kbViews,
      ticketReduction,
      selfServiceRate,
      costSavings
    ] = await Promise.all([
      this.prisma.article.aggregate({
        where: {
          createdAt: { gte: dateRange.start, lte: dateRange.end }
        },
        _sum: { viewCount: true }
      }),
      this.calculateTicketReduction(dateRange),
      this.calculateSelfServiceRate(dateRange),
      this.calculateCostSavings(dateRange)
    ])

    return {
      period,
      roi: {
        totalViews: kbViews._sum?.viewCount || 0,
        ticketReduction,
        selfServiceRate,
        estimatedCostSavings: costSavings,
        roiPercentage: this.calculateROIPercentage(costSavings)
      }
    }
  }

  async getContentLifecycleAnalytics() {
    const [
      draftArticles,
      reviewArticles,
      publishedArticles,
      archivedArticles,
      outdatedArticles
    ] = await Promise.all([
      this.prisma.article.count({ where: { status: ArticleStatus.DRAFT } }),
      this.prisma.article.count({ where: { status: ArticleStatus.REVIEW } }),
      this.prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      this.prisma.article.count({ where: { status: ArticleStatus.ARCHIVED } }),
      this.prisma.article.count({
        where: {
          status: ArticleStatus.PUBLISHED,
          updatedAt: { lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) } // 6 months old
        }
      })
    ])

    return {
      lifecycle: {
        draft: draftArticles,
        review: reviewArticles,
        published: publishedArticles,
        archived: archivedArticles,
        outdated: outdatedArticles
      },
      recommendations: {
        needsReview: outdatedArticles,
        readyToPublish: reviewArticles
      }
    }
  }

  async getPopularTags(period: string, limit: number) {
    const dateRange = this.getDateRange(period)
    
    // Get all articles in the period and extract tags
    const articles = await this.prisma.article.findMany({
      where: {
        createdAt: { gte: dateRange.start, lte: dateRange.end },
        status: ArticleStatus.PUBLISHED
      },
      select: { tags: true, viewCount: true }
    })

    // Count tag frequency and views
    const tagStats = new Map()
    articles.forEach(article => {
      if (article.tags) {
        article.tags.forEach(tag => {
          if (!tagStats.has(tag)) {
            tagStats.set(tag, { count: 0, views: 0 })
          }
          const stats = tagStats.get(tag)
          stats.count++
          stats.views += article.viewCount
        })
      }
    })

    const popularTags = Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        count: stats.count,
        totalViews: stats.views,
        avgViewsPerArticle: (stats.views / stats.count).toFixed(2)
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, limit)

    return {
      period,
      tags: popularTags
    }
  }

  async getKnowledgeBaseHealthScore() {
    const [
      totalArticles,
      publishedArticles,
      recentlyUpdated,
      highPerforming,
      lowPerforming,
      avgRating
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.article.count({ where: { status: ArticleStatus.PUBLISHED } }),
      this.prisma.article.count({
        where: {
          updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      }),
      this.prisma.article.count({
        where: { viewCount: { gte: 100 }, status: ArticleStatus.PUBLISHED }
      }),
      this.prisma.article.count({
        where: { viewCount: { lt: 10 }, status: ArticleStatus.PUBLISHED }
      }),
      this.calculateAverageRating({})
    ])

    const healthMetrics = {
      contentFreshness: totalArticles > 0 ? (recentlyUpdated / totalArticles * 100).toFixed(2) : 0,
      publishRate: totalArticles > 0 ? (publishedArticles / totalArticles * 100).toFixed(2) : 0,
      performanceRate: publishedArticles > 0 ? (highPerforming / publishedArticles * 100).toFixed(2) : 0,
      qualityScore: avgRating * 20, // Convert 5-star to 100-point scale
      overallHealth: 0
    }

    // Calculate overall health score
    const contentFresh = typeof healthMetrics.contentFreshness === 'number' ? healthMetrics.contentFreshness : parseFloat(healthMetrics.contentFreshness.toString())
    const publishR = typeof healthMetrics.publishRate === 'number' ? healthMetrics.publishRate : parseFloat(healthMetrics.publishRate.toString())
    const performR = typeof healthMetrics.performanceRate === 'number' ? healthMetrics.performanceRate : parseFloat(healthMetrics.performanceRate.toString())
    
    healthMetrics.overallHealth = parseFloat((
      contentFresh * 0.25 +
      publishR * 0.25 +
      performR * 0.25 +
      healthMetrics.qualityScore * 0.25
    ).toFixed(2))

    return {
      healthScore: typeof healthMetrics.overallHealth === 'string' ? parseFloat(healthMetrics.overallHealth) : healthMetrics.overallHealth,
      metrics: healthMetrics,
      recommendations: this.generateHealthRecommendations(healthMetrics)
    }
  }

  async getComparativeAnalytics(currentPeriod: string, previousPeriod: string) {
    const currentRange = this.getDateRange(currentPeriod)
    const previousRange = this.getDateRange(previousPeriod)

    const [currentStats, previousStats] = await Promise.all([
      this.getBasicStats(currentRange),
      this.getBasicStats(previousRange)
    ])

    const comparison = {
      articles: this.calculateChange(currentStats.articles, previousStats.articles),
      views: this.calculateChange(currentStats.views, previousStats.views),
      likes: this.calculateChange(currentStats.likes, previousStats.likes),
      searches: this.calculateChange(currentStats.searches, previousStats.searches)
    }

    return {
      current: { period: currentPeriod, stats: currentStats },
      previous: { period: previousPeriod, stats: previousStats },
      comparison
    }
  }

  async getRealtimeActivity(limit: number, userRole: UserRole) {
    // Get recent activities from audit logs or activity tracking
    const activities = await this.prisma.auditLog.findMany({
      where: {
        entity: { in: ["ARTICLE", "CATEGORY"] }
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    })

    return {
      activities: activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        entity: activity.entity,
        entityId: activity.entityId,
        user: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown User',
        timestamp: activity.createdAt,
        description: this.formatActivityDescription(activity)
      }))
    }
  }

  async exportAnalyticsData(type: string, format: string, period: string, userId: string) {
    let data: any = {}

    switch (type) {
      case "overview":
        data = await this.getOverviewStats(userId, UserRole.ADMIN)
        break
      case "articles":
        data = await this.getArticlePerformance(period, 50, UserRole.ADMIN)
        break
      case "search":
        data = await this.getSearchAnalytics(period)
        break
      case "engagement":
        data = await this.getUserEngagement(period)
        break
    }

    // Generate export file
    const exportId = `analytics-${type}-${Date.now()}`
    const filename = `${exportId}.${format}`

    // In a real implementation, you would generate actual files
    return {
      exportId,
      filename,
      downloadUrl: `/api/knowledge-base/analytics/download/${exportId}`,
      data: format === "json" ? data : undefined
    }
  }

  // Helper methods
  private buildWhereClause(userId: string, userRole: UserRole) {
    const where: any = {}
    
    // author-based filtering removed
    
    return where
  }

  private getDateRange(period: string) {
    const now = new Date()
    const start = new Date()
    
    switch (period) {
      case "day":
        start.setDate(now.getDate() - 1)
        break
      case "week":
        start.setDate(now.getDate() - 7)
        break
      case "month":
        start.setMonth(now.getMonth() - 1)
        break
      case "3months":
        start.setMonth(now.getMonth() - 3)
        break
      case "year":
        start.setFullYear(now.getFullYear() - 1)
        break
      case "previousMonth":
        start.setMonth(now.getMonth() - 2)
        const end = new Date()
        end.setMonth(now.getMonth() - 1)
        return { start, end }
      default:
        start.setMonth(now.getMonth() - 1)
    }
    
    return { start, end: now }
  }

  private async calculateAverageRating(where: any): Promise<number> {
    const feedback = await this.prisma.articleFeedback.findMany({
      where: { article: where },
      select: { isLike: true }
    })

    if (feedback.length === 0) return 0

    const totalRating = feedback.reduce((sum, f) => sum + (f.isLike ? 5 : 1), 0)
    return parseFloat((totalRating / feedback.length).toFixed(2))
  }

  private async calculateViewTrend(articleId: string, period: string): Promise<string> {
    // Simplified trend calculation - in real implementation, you'd track daily views
    return "up" // Placeholder
  }

  private async calculateEngagementRate(articleId: string): Promise<string> {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        _count: { select: { comments: true, feedback: true } }
      }
    })

    if (!article || article.viewCount === 0) return "0"

    const engagements = article.likeCount + article._count.comments + article._count.feedback
    const rate = (engagements / article.viewCount * 100).toFixed(2)
    return rate
  }

  private calculateCategoryEngagement(views: number, likes: number, comments: number): number {
    // Simple engagement score calculation
    return views * 0.1 + likes * 2 + comments * 3
  }

  private groupDataByTime(data: any[], groupBy: string, metrics: any[]) {
    // Simplified time grouping - in real implementation, you'd properly group by time periods
    return []
  }

  private async getSearchTrends(dateRange: any) {
    // Implementation for search trends over time
    return []
  }

  private async calculateAvgSessionDuration(dateRange: any): Promise<number> {
    // Implementation for session duration calculation
    return 0
  }

  private async calculateBounceRate(dateRange: any): Promise<string> {
    // Implementation for bounce rate calculation
    return "0"
  }

  private async getEngagementActions(dateRange: any) {
    // Implementation for engagement actions tracking
    return {}
  }

  private async identifyMissingTopics() {
    // Implementation for identifying content gaps
    return []
  }

  private async analyzeCategoryGaps() {
    // Implementation for category gap analysis
    return []
  }

  private generateContentRecommendations(searches: any[], gaps: any[]) {
    // Implementation for content recommendations
    return []
  }

  private async calculateTicketReduction(dateRange: any): Promise<string> {
    // Implementation for ticket reduction calculation
    return "0"
  }

  private async calculateSelfServiceRate(dateRange: any): Promise<string> {
    // Implementation for self-service rate calculation
    return "0"
  }

  private async calculateCostSavings(dateRange: any): Promise<number> {
    // Implementation for cost savings calculation
    return 0
  }

  private calculateROIPercentage(costSavings: number): string {
    // Implementation for ROI percentage calculation
    return "0"
  }

  private async getBasicStats(dateRange: any) {
    const [articles, views, likes, searches] = await Promise.all([
      this.prisma.article.count({
        where: { createdAt: { gte: dateRange.start, lte: dateRange.end } }
      }),
      this.prisma.article.aggregate({
        where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
        _sum: { viewCount: true, likeCount: true }
      }),
      this.prisma.article.aggregate({
        where: { createdAt: { gte: dateRange.start, lte: dateRange.end } },
        _sum: { likeCount: true }
      }),
      // Placeholder for search count
      Promise.resolve({ _sum: { searchCount: 0 } })
    ])

    return {
      articles,
      views: views._sum.viewCount || 0,
      likes: likes._sum.likeCount || 0,
      searches: searches._sum.searchCount || 0
    }
  }

  private calculateChange(current: number, previous: number) {
    if (previous === 0) return { value: current, percentage: "0", trend: "neutral" }
    
    const change = current - previous
    const percentage = ((change / previous) * 100).toFixed(2)
    const trend = change > 0 ? "up" : change < 0 ? "down" : "neutral"
    
    return { value: current, change, percentage, trend }
  }

  private generateHealthRecommendations(metrics: any) {
    const recommendations = []
    
    if (parseFloat(metrics.contentFreshness) < 50) {
      recommendations.push("Update older articles to improve content freshness" as never)
    }
    
    if (parseFloat(metrics.publishRate) < 80) {
      recommendations.push("Review and publish draft articles" as never)
    }
    
    if (parseFloat(metrics.performanceRate) < 60) {
      recommendations.push("Optimize low-performing articles" as never)
    }
    
    return recommendations
  }

  private formatActivityDescription(activity: any): string {
    const actions = {
      CREATE: "created",
      UPDATE: "updated",
      DELETE: "deleted",
      PUBLISH: "published"
    }
    
    return `${actions[activity.action] || activity.action} ${activity.entity.toLowerCase()}`
  }
}
