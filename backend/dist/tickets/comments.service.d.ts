import { PrismaService } from "../prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
export declare class CommentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(ticketId: string, createCommentDto: CreateCommentDto, authorId: string): Promise<{
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        ticketId: string;
    }>;
    findByTicket(ticketId: string): Promise<({
        author: {
            id: string;
            firstName: string;
            lastName: string;
            role: import("@prisma/client").$Enums.UserRole;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        ticketId: string;
    })[]>;
    update(id: string, content: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        ticketId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        content: string;
        authorId: string;
        ticketId: string;
    }>;
}
