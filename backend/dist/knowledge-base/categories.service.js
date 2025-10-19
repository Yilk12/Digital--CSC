"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CategoriesService = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCategoryDto) {
        return this.prisma.category.create({
            data: createCategoryDto,
            include: {
                parent: true,
                children: true,
                _count: {
                    select: { articles: true },
                },
            },
        });
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
        });
    }
    async findOne(id) {
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
        });
        if (!category) {
            throw new common_1.NotFoundException("Category not found");
        }
        return category;
    }
    async update(id, updateCategoryDto) {
        const category = await this.findOne(id);
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
        });
    }
    async remove(id) {
        const category = await this.findOne(id);
        const articleCount = await this.prisma.article.count({
            where: { categoryId: id },
        });
        if (articleCount > 0) {
            return this.prisma.category.update({
                where: { id },
                data: { isActive: false },
            });
        }
        return this.prisma.category.delete({
            where: { id },
        });
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
        });
        return categories.filter((cat) => !cat.parentId);
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map