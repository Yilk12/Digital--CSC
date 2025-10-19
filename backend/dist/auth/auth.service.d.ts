import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
export declare class AuthService {
    private usersService;
    private jwtService;
    checkEmail(email: string): Promise<{
        exists: boolean;
    }>;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
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
    refreshToken(userId: string): Promise<{
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
