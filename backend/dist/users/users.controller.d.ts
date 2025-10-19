import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserRole } from "@prisma/client";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        department: string | null;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        userType: import("@prisma/client").$Enums.UserType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(page?: number, limit?: number, role?: UserRole, search?: string): Promise<{
        users: {
            department: string | null;
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            role: import("@prisma/client").$Enums.UserRole;
            userType: import("@prisma/client").$Enums.UserType;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getUserStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byRole: Record<string, number>;
    }>;
    findOne(id: string): Promise<{
        department: string | null;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        userType: import("@prisma/client").$Enums.UserType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        department: string | null;
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        userType: import("@prisma/client").$Enums.UserType;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        isActive: boolean;
    }>;
}
