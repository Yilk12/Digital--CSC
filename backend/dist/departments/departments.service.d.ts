import { PrismaService } from "../prisma/prisma.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { UpdateDepartmentDto } from "./dto/update-department.dto";
export declare class DepartmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateDepartmentDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        nameAm: string | null;
    }>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        departments: {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            nameAm: string | null;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        nameAm: string | null;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        nameAm: string | null;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        isActive: boolean;
        name: string;
    }>;
}
