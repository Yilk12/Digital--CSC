import { UserRole, UserType } from "@prisma/client";
export declare class RegisterDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
    role: UserRole;
    userType: UserType;
    department?: string;
}
