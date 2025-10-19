import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateArticleDto } from "./dto/create-article.dto"
import { UpdateArticleDto } from "./dto/update-article.dto"
import { ArticleStatus, type Language, UserRole } from "@prisma/client"

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  async create(createArticleDto: CreateArticleDto, authorId: string, files: Express.Multer.File[] = []) {
    const { tags, ...articleData } = createArticleDto

    const article = await this.prisma.article.create({
      data: {
        ...articleData,
        authorId,
        ...(createArticleDto.status === ArticleStatus.PUBLISHED && {
          publishedAt: new Date(),
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Handle tags
    if (tags && tags.length > 0) {
      await this.updateArticleTags(article.id, tags)
    }

    // Handle attachments if any
    if (files && files.length > 0) {
      const data = files.map((file) => ({
        articleId: article.id,
        filename: file.originalname,
        filepath: file.path,
        mimetype: file.mimetype,
        size: file.size,
      }))
      try {
        await this.prisma.articleAttachment.createMany({ data })
      } catch (e) {
        // Non-fatal: log and continue
        console.error('[KB] Failed to persist article attachments', e)
      }
    }

    return this.findOne(article.id)
  }

  async findAll(
    page = 1,
    limit = 10,
    status?: ArticleStatus,
    language?: Language,
    categoryId?: string,
    search?: string,
    authorId?: string,
    userRole?: UserRole,
  ) {
    const skip = (page - 1) * limit

    const where: any = {}

    // Role-based filtering
    if (userRole === UserRole.END_USER) {
      where.status = ArticleStatus.PUBLISHED
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    }

    // Additional filters
    if (status) where.status = status
    if (language) where.language = language
    if (categoryId) where.categoryId = categoryId
    if (authorId) where.authorId = authorId

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
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          category: true,
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              comments: true,
              feedback: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
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

  async update(id: string, updateArticleDto: UpdateArticleDto, userId: string, userRole: UserRole) {
    const article = await this.findOne(id)

    // Check permissions
    if (userRole !== UserRole.ADMIN && article.authorId !== userId) {
      throw new ForbiddenException("Access denied")
    }

    const { tags, ...articleData } = updateArticleDto

    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        ...(updateArticleDto.status === ArticleStatus.PUBLISHED &&
          article.status !== ArticleStatus.PUBLISHED && {
            publishedAt: new Date(),
          }),
      },
    })

    // Handle tags update
    if (tags !== undefined) {
      await this.updateArticleTags(id, tags)
    }

    return this.findOne(id)
  }

  async remove(id: string, userId: string, userRole: UserRole) {
    const article = await this.findOne(id)

    // Check permissions
    if (userRole !== UserRole.ADMIN && article.authorId !== userId) {
      throw new ForbiddenException("Access denied")
    }

    await this.prisma.article.delete({
      where: { id },
    })

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

  async getArticleStats(authorId?: string) {
    const where: any = {}
    if (authorId) where.authorId = authorId

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
}
