import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateCategoryDto } from "./dto/create-category.dto"
import { UpdateCategoryDto } from "./dto/update-category.dto"

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { articles: true },
        },
      },
    })
  }

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          include: {
            _count: {
              select: { articles: true },
            },
          },
        },
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: "asc" },
    })
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: { articles: true },
            },
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
            status: true,
            language: true,
            viewCount: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { viewCount: "desc" },
        },
        _count: {
          select: { articles: true },
        },
      },
    })

    if (!category) {
      throw new NotFoundException("Category not found")
    }

    return category
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id)

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
        _count: {
          select: { articles: true },
        },
      },
    })
  }

  async remove(id: string) {
    const category = await this.findOne(id)

    // Check if category has articles
    const articleCount = await this.prisma.article.count({
      where: { categoryId: id },
    })

    if (articleCount > 0) {
      // Soft delete - just deactivate
      return this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      })
    }

    // Hard delete if no articles
    return this.prisma.category.delete({
      where: { id },
    })
  }

  async getHierarchy() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: {
              where: { isActive: true },
              include: {
                _count: {
                  select: { articles: true },
                },
              },
            },
            _count: {
              select: { articles: true },
            },
          },
        },
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: "asc" },
    })

    // Return only root categories (no parent)
    return categories.filter((cat) => !cat.parentId)
  }
}
