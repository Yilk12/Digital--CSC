import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateDepartmentDto } from "./dto/create-department.dto"
import { UpdateDepartmentDto } from "./dto/update-department.dto"

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const created = await this.prisma.department.create({
      data: {
        name: dto.name,
        nameAm: dto.nameAm ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
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
    })
    return created
  }

  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { nameAm: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

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
    ])

    return {
      departments: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findById(id: string) {
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
    })
    if (!department) throw new NotFoundException("Department not found")
    return department
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findById(id)
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
    })
    return updated
  }

  async deactivate(id: string) {
    await this.findById(id)
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    })
  }
}
