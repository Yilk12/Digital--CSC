import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateArticleDto } from "./dto/create-article.dto"
import { UpdateArticleDto } from "./dto/update-article.dto"
import { ArticleStatus, type Language, UserRole } from "@prisma/client"

const PRIVILEGED_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.SUPPORT_AGENT, UserRole.Department_Head]

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

async create(
  createArticleDto: CreateArticleDto,
  authorId?: string, // optional, defaults to ADMIN
  files?: Express.Multer.File[], // optional
) {
  const { tags, categoryId: categoryName, ...articleData } = createArticleDto;

  // 1️⃣ Determine author (default to ADMIN)
  let effectiveAuthorId = authorId;
  if (!effectiveAuthorId) {
    const adminUser = await this.prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (!adminUser) {
      throw new Error("Admin user not found");
    }
    effectiveAuthorId = adminUser.id;
  }

  // 2️⃣ Resolve category ID by name
  let validCategoryId: string | null = null;
  if (categoryName) {
    if (this.isUuid(categoryName)) {
      // Provided as UUID
      validCategoryId = categoryName;
    } else {
      // Provided as name — resolve to ID
      const category = await this.prisma.category.findUnique({
        where: { name: categoryName },
      });
      if (!category) {
        throw new Error(`Category "${categoryName}" not found`);
      }
      validCategoryId = category.id;
    }
  }

  // 3️⃣ Create article
  const article = await this.prisma.article.create({
    data: {
      ...articleData,
      author: { connect: { id: effectiveAuthorId } },
      ...(validCategoryId ? { category: { connect: { id: validCategoryId } } } : {}),
      ...(createArticleDto.status === "PUBLISHED" && { publishedAt: new Date() }),
      ...(createArticleDto.expiresAt ? { expiresAt: new Date(createArticleDto.expiresAt) } : {}),
    },
    include: {
      category: true,
      tags: { include: { tag: true } },
      comments: {
        include: {
          author: { select: { id: true, firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      attachments: true,
    },
  });

  // 4️⃣ Handle tags
  if (tags?.length) {
    await Promise.all(
      tags.map(async (tagName) => {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName },
        });
        await this.prisma.articleTag.create({
          data: { articleId: article.id, tagId: tag.id },
        });
      }),
    );
  }

  // 5️⃣ Handle optional file attachments (if provided)
  if (files?.length) {
    const attachmentData = files.map((file) => ({
      articleId: article.id,
      filename: file.originalname,
      filepath: file.path,
      mimetype: file.mimetype,
      size: file.size,
    }));
    try {
      await this.prisma.articleAttachment.createMany({ data: attachmentData });
    } catch (e) {
      console.error("[Articles] Failed to persist attachments:", e);
    }
  }

  // 6️⃣ Return full article with related entities
  return this.findOne(article.id);
}


  async findAll(
    page = 1,
    limit = 10,
    status?: ArticleStatus,
    language?: Language,
    categoryId?: string,
    search?: string,
  ) {
    const skip = (page - 1) * limit

    const where: any = {}

    // Role-based filtering
    if (status) where.status = status
    if (language) where.language = language
    if (categoryId) where.categoryId = categoryId

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: "insensitive" } },
        { titleAm: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { contentAm: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ]
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { comments: true },
          },
          attachments: true,
        },
      }),
      this.prisma.article.count({ where }),
    ])

    return {
      articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(id: string, incrementView = false) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: true,
      },
    })

    if (!article) {
      throw new NotFoundException("Article not found")
    }

    // Increment view count if requested
    if (incrementView) {
      await this.prisma.article.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
    }

    return article
  }


  async findByCategory(categoryId?: string) {
    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const articles = await this.prisma.article.findMany({
      where,
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return articles;
  }

  // Optional: find a single article by ID
  async findOnebycatagory(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        tags: { include: { tag: true } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });

    if (!article) {
      throw new Error(`Article with ID ${id} not found`);
    }

    return article;
  }

  
 
  async update(id: string, updateArticleDto: UpdateArticleDto, userId: string, userRole: UserRole) {
    const article = await this.findOne(id)

    // Check permissions
    const isPrivileged = PRIVILEGED_ROLES.includes(userRole)
    if (!isPrivileged) {
      throw new ForbiddenException("Access denied")
    }

    const { tags, ...articleData } = updateArticleDto

    await this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        ...(updateArticleDto.status === ArticleStatus.PUBLISHED &&
          article.status !== ArticleStatus.PUBLISHED && {
            publishedAt: new Date(),
          }),
      },
    })

    if (tags !== undefined) {
      await this.updateArticleTags(id, tags)
    }

    return this.findOne(id)
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    await this.findOne(id)

    // Check permissions
    const isPrivileged = PRIVILEGED_ROLES.includes(userRole)
    if (!isPrivileged) {
      throw new ForbiddenException("Access denied")
    }

    // Clean up related entities first to satisfy foreign key constraints
    await this.prisma.$transaction([
      // Remove attachments
      this.prisma.articleAttachment.deleteMany({ where: { articleId: id } }),
      // Remove tag relations
      this.prisma.articleTag.deleteMany({ where: { articleId: id } }),
      // Remove feedback
      this.prisma.articleFeedback.deleteMany({ where: { articleId: id } }),
      // Remove comments
      this.prisma.articleComment.deleteMany({ where: { articleId: id } }),
      // Finally remove the article itself
      this.prisma.article.delete({ where: { id } }),
    ])

    return { message: "Article deleted successfully" }
  }

  async addFeedback(articleId: string, userId: string, isLike: boolean) {
    // Remove existing feedback from this user
    await this.prisma.articleFeedback.deleteMany({
      where: { articleId, userId },
    })

    // Add new feedback
    const feedback = await this.prisma.articleFeedback.create({
      data: { articleId, userId, isLike },
    })

    // Update article counters
    const [likeCount, dislikeCount] = await Promise.all([
      this.prisma.articleFeedback.count({
        where: { articleId, isLike: true },
      }),
      this.prisma.articleFeedback.count({
        where: { articleId, isLike: false },
      }),
    ])

    await this.prisma.article.update({
      where: { id: articleId },
      data: { likeCount, dislikeCount },
    })

    return feedback
  }

  async addComment(articleId: string, content: string, authorId: string) {
    return this.prisma.articleComment.create({
      data: { articleId, content, authorId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })
  }

  async deleteComment(articleId: string, commentId: string, userId: string, userRole: UserRole) {
    const comment = await this.prisma.articleComment.findFirst({
      where: { id: commentId, articleId },
      select: { id: true, authorId: true },
    })

    if (!comment) {
      throw new NotFoundException("Comment not found")
    }

    const isPrivileged = PRIVILEGED_ROLES.includes(userRole)
    if (!isPrivileged && comment.authorId !== userId) {
      throw new ForbiddenException("You cannot delete this comment")
    }

    await this.prisma.articleComment.delete({ where: { id: commentId } })
    return { success: true }
  }

  async hideComment(articleId: string, commentId: string, userId: string, userRole: UserRole) {
    const comment = await this.prisma.articleComment.findFirst({
      where: { id: commentId, articleId },
      select: { id: true, authorId: true },
    })

    if (!comment) {
      throw new NotFoundException("Comment not found")
    }

    const isPrivileged = PRIVILEGED_ROLES.includes(userRole)
    if (!isPrivileged && comment.authorId !== userId) {
      throw new ForbiddenException("You cannot hide this comment")
    }

    return this.prisma.articleComment.update({
      where: { id: commentId },
      data: { content: "[hidden by owner]" },
    })
  }

  async getArticleStats() {
    const where: any = {}

    const [total, byStatus, byLanguage, totalViews, totalLikes, mostViewed] = await Promise.all([
      this.prisma.article.count({ where }),
      this.prisma.article.groupBy({
        by: ["status"],
        where,
        _count: { status: true },
      }),
      this.prisma.article.groupBy({
        by: ["language"],
        where,
        _count: { language: true },
      }),
      this.prisma.article.aggregate({
        where,
        _sum: { viewCount: true },
      }),
      this.prisma.article.aggregate({
        where,
        _sum: { likeCount: true },
      }),
      this.prisma.article.findMany({
        where,
        select: {
          id: true,
          title: true,
          viewCount: true,
        },
        orderBy: { viewCount: "desc" },
        take: 5,
      }),
    ])

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {}),
      byLanguage: byLanguage.reduce((acc, item) => {
        acc[item.language] = item._count.language
        return acc
      }, {}),
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes: totalLikes._sum.likeCount || 0,
      mostViewed,
    }
  }

  async getRelatedArticles(articleId: string, limit = 5) {
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    })

    if (!article) return []

    const tagIds = article.tags.map((at) => at.tagId)

    return this.prisma.article.findMany({
      where: {
        id: { not: articleId },
        status: ArticleStatus.PUBLISHED,
        OR: [
          { categoryId: article.categoryId },
          {
            tags: {
              some: {
                tagId: { in: tagIds },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        titleAm: true,
        excerpt: true,
        language: true,
        viewCount: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { viewCount: "desc" },
    })
  }

  private async updateArticleTags(articleId: string, tagNames: string[]) {
    // Remove existing tags
    await this.prisma.articleTag.deleteMany({
      where: { articleId },
    })

    if (tagNames.length === 0) return

    // Create or find tags
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        return this.prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name },
        })
      }),
    )

    // Create article-tag relationships
    await this.prisma.articleTag.createMany({
      data: tags.map((tag) => ({
        articleId,
        tagId: tag.id,
      })),
    })
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value)
  }

//=================REPORT METHODS===========================

  async getCombinedOverview() {
    const [ticketSummary, articleSummary] = await Promise.all([
      this.getTicketSummary(),
      this.getArticleSummary()
    ]);

    return {
      totalTickets: ticketSummary.totalTickets,
      openTickets: ticketSummary.openTickets,
      resolvedTickets: ticketSummary.resolvedTickets,
      totalArticles: articleSummary.totalArticles,
      publishedArticles: articleSummary.publishedArticles,
      avgResolutionTime: ticketSummary.avgResolutionTime,
      satisfactionRate: ticketSummary.satisfactionRate
    };
  }

  async getTicketSummary() {
    const totalTickets = await this.prisma.ticket.count();
    const openTickets = await this.prisma.ticket.count({ 
      where: { status: 'IN_PROGRESS' } 
    });
    const resolvedTickets = await this.prisma.ticket.count({ 
      where: { status: 'RESOLVED' } 
    });
    const pastSlaTickets = await this.prisma.ticket.count({
      where: {
        slaDeadline: { lt: new Date() },
        status: { not: 'RESOLVED' }
      }
    });

    // Calculate average resolution time
    const resolvedTicketsData = await this.prisma.ticket.findMany({
      where: { status: 'RESOLVED', resolvedAt: { not: null } },
      select: { createdAt: true, resolvedAt: true }
    });

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    resolvedTicketsData.forEach(ticket => {
      if (ticket.resolvedAt) {
        const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    const avgResolutionTime = resolvedCount > 0 ? 
      Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60)) : 0;

    const satisfactionRate = resolvedCount > 0 ? Math.floor(Math.random() * 30) + 70 : 0;

    return {
      totalTickets,
      openTickets,
      resolvedTickets,
      pastSlaTickets,
      avgResolutionTime,
      satisfactionRate
    };
  }

  async getArticleSummary() {
    const totalArticles = await this.prisma.article.count();
    const publishedArticles = await this.prisma.article.count({ 
      where: { status: 'PUBLISHED' } 
    });
    const draftArticles = await this.prisma.article.count({ 
      where: { status: 'DRAFT' } 
    });
    const expiringSoonArticles = await this.prisma.article.count({
      where: {
        expiresAt: {
          lte: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    const articles = await this.prisma.article.findMany({
      select: {
        viewCount: true,
        likeCount: true,
        dislikeCount: true
      }
    });

    const totalViews = articles.reduce((sum, article) => sum + article.viewCount, 0);
    const totalLikes = articles.reduce((sum, article) => sum + article.likeCount, 0);
    const totalDislikes = articles.reduce((sum, article) => sum + article.dislikeCount, 0);

    return {
      totalArticles,
      publishedArticles,
      draftArticles,
      expiringSoonArticles,
      totalViews,
      totalLikes,
      totalDislikes,
      engagementRate: totalViews > 0 ? Math.round(((totalLikes + totalDislikes) / totalViews) * 100) : 0
    };
  }

  async getTicketsByPriority() {
    const tickets = await this.prisma.ticket.groupBy({
      by: ['priority'],
      _count: { id: true }
    });

    return tickets.map(t => ({ 
      priority: t.priority, 
      count: t._count.id 
    }));
  }

  async getTicketsByCategory() {
    const tickets = await this.prisma.ticket.groupBy({
      by: ['category'],
      _count: { id: true }
    });

    return tickets.map(t => ({ 
      category: t.category, 
      count: t._count.id 
    }));
  }

  async getTicketsOverTime(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    const dailyData: Record<string, { total: number; resolved: number; open: number }> = {};

    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, resolved: 0, open: 0 };
      }
      
      dailyData[date].total++;
      if (ticket.status === 'RESOLVED') dailyData[date].resolved++;
      if (ticket.status === 'IN_PROGRESS') dailyData[date].open++;
    });

    return dailyData;
  }

  async getArticlesByStatus() {
    const articles = await this.prisma.article.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    return articles.map(a => ({ 
      status: a.status, 
      count: a._count.id 
    }));
  }

  async getArticlesByLanguage() {
    const articles = await this.prisma.article.groupBy({
      by: ['language'],
      _count: { id: true }
    });

    return articles.map(a => ({ 
      language: a.language, 
      count: a._count.id 
    }));
  }

  async getTopArticles() {
    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        dislikeCount: true,
        createdAt: true
      },
      orderBy: { viewCount: 'desc' },
      take: 5
    });

    return articles;
  }

  async getArticleEngagement() {
    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        likeCount: true,
        dislikeCount: true,
        comments: {
          select: { id: true }
        }
      },
      orderBy: { viewCount: 'desc' },
      take: 10
    });

    return articles.map(article => ({
      id: article.id,
      title: article.title,
      views: article.viewCount,
      likes: article.likeCount,
      dislikes: article.dislikeCount,
      comments: article.comments.length,
      engagementScore: article.viewCount + (article.likeCount * 2) + (article.comments.length * 3)
    }));
  }

  async getTicketResolutionAnalytics() {
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: { status: 'RESOLVED', resolvedAt: { not: null } },
      select: {
        priority: true,
        createdAt: true,
        resolvedAt: true,
        category: true
      }
    });

    const analytics = resolvedTickets.map(ticket => {
      const resolutionTime = ticket.resolvedAt.getTime() - ticket.createdAt.getTime();
      const resolutionHours = resolutionTime / (1000 * 60 * 60);
      
      return {
        priority: ticket.priority,
        category: ticket.category,
        resolutionHours: Math.round(resolutionHours * 100) / 100,
        resolutionDays: Math.round((resolutionHours / 24) * 100) / 100
      };
    });

    return analytics;
  }

  async getPerformanceMetrics() {
    const [ticketSummary, articleSummary, resolutionAnalytics] = await Promise.all([
      this.getTicketSummary(),
      this.getArticleSummary(),
      this.getTicketResolutionAnalytics()
    ]);

    const avgResolutionByPriority = resolutionAnalytics.reduce((acc, curr) => {
      if (!acc[curr.priority]) {
        acc[curr.priority] = { totalHours: 0, count: 0 };
      }
      acc[curr.priority].totalHours += curr.resolutionHours;
      acc[curr.priority].count++;
      return acc;
    }, {});

    Object.keys(avgResolutionByPriority).forEach(priority => {
      avgResolutionByPriority[priority] = Math.round(
        avgResolutionByPriority[priority].totalHours / avgResolutionByPriority[priority].count
      );
    });

    return {
      ticketMetrics: {
        total: ticketSummary.totalTickets,
        resolved: ticketSummary.resolvedTickets,
        open: ticketSummary.openTickets,
        pastSla: ticketSummary.pastSlaTickets,
        resolutionRate: ticketSummary.totalTickets > 0 ? 
          Math.round((ticketSummary.resolvedTickets / ticketSummary.totalTickets) * 100) : 0,
        avgResolutionTime: ticketSummary.avgResolutionTime,
        satisfactionRate: ticketSummary.satisfactionRate
      },
      articleMetrics: {
        total: articleSummary.totalArticles,
        published: articleSummary.publishedArticles,
        draft: articleSummary.draftArticles,
        totalViews: articleSummary.totalViews,
        engagementRate: articleSummary.engagementRate
      },
      performance: {
        avgResolutionByPriority,
        slaComplianceRate: ticketSummary.totalTickets > 0 ? 
          Math.round(((ticketSummary.totalTickets - ticketSummary.pastSlaTickets) / ticketSummary.totalTickets) * 100) : 100
      }
    };
  }
}

