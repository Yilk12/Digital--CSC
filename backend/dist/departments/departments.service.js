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
exports.DepartmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DepartmentsService = class DepartmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        var _a, _b, _c;
        const created = await this.prisma.department.create({
            data: {
                name: dto.name,
                nameAm: (_a = dto.nameAm) !== null && _a !== void 0 ? _a : null,
                description: (_b = dto.description) !== null && _b !== void 0 ? _b : null,
                isActive: (_c = dto.isActive) !== null && _c !== void 0 ? _c : true,
            },
            select: {
                id: true,
                name: true,
                nameAm: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return created;
    }
    async findAll(page = 1, limit = 10, search) {
        const skip = (page - 1) * limit;
        const where = Object.assign({}, (search && {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { nameAm: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ],
        }));
        const [items, total] = await Promise.all([
            this.prisma.department.findMany({
                where,
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    nameAm: true,
                    description: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.department.count({ where }),
        ]);
        return {
            departments: items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findById(id) {
        const department = await this.prisma.department.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                nameAm: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!department)
            throw new common_1.NotFoundException("Department not found");
        return department;
    }
    async update(id, dto) {
        await this.findById(id);
        const updated = await this.prisma.department.update({
            where: { id },
            data: {
                name: dto.name,
                nameAm: dto.nameAm,
                description: dto.description,
                isActive: dto.isActive,
            },
            select: {
                id: true,
                name: true,
                nameAm: true,
                description: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return updated;
    }
    async deactivate(id) {
        await this.findById(id);
        return this.prisma.department.update({
            where: { id },
            data: { isActive: false },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });
    }
};
exports.DepartmentsService = DepartmentsService;
exports.DepartmentsService = DepartmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DepartmentsService);
//# sourceMappingURL=departments.service.js.map