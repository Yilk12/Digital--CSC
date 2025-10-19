import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Request } from "express";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        userType: import("@prisma/client").$Enums.UserType;
        department: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    signup(registerDto: RegisterDto): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import("@prisma/client").$Enums.UserRole;
        userType: import("@prisma/client").$Enums.UserType;
        department: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    checkEmail(body: {
        email: string;
    }): Promise<{
        exists: boolean;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            firstName: any;
            lastName: any;
            role: any;
            userType: any;
            department: any;
        };
    }>;
    refresh(req: Request): Promise<{
        access_token: string;
    }>;
    createGuest(): Promise<{
        access_token: string;
        user: {
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
        };
    }>;
}
