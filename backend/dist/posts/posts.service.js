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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PostsService = class PostsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        var _a;
        return this.prisma.post.create({
            data: {
                title: dto.title,
                content: dto.content,
                published: (_a = dto.published) !== null && _a !== void 0 ? _a : false,
                author: { connect: { id: dto.authorId } },
            },
        });
    }
    async findAll(params) {
        const { authorId } = params;
        return this.prisma.post.findMany({
            where: { authorId: authorId || undefined },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const post = await this.prisma.post.findUnique({ where: { id } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        return post;
    }
    async update(id, dto) {
        var _a, _b, _c;
        await this.ensureExists(id);
        return this.prisma.post.update({
            where: { id },
            data: {
                title: (_a = dto.title) !== null && _a !== void 0 ? _a : undefined,
                content: (_b = dto.content) !== null && _b !== void 0 ? _b : undefined,
                published: (_c = dto.published) !== null && _c !== void 0 ? _c : undefined,
            },
        });
    }
    async remove(id) {
        await this.ensureExists(id);
        await this.prisma.post.delete({ where: { id } });
        return { id, deleted: true };
    }
    async ensureExists(id) {
        const exists = await this.prisma.post.findUnique({ where: { id } });
        if (!exists)
            throw new common_1.NotFoundException('Post not found');
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PostsService);
//# sourceMappingURL=posts.service.js.map