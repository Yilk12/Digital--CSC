import { PrismaService } from "../prisma/prisma.service";
export declare class AttachmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    createMultiple(ticketId: string, files: Express.Multer.File[]): Promise<import("@prisma/client").Prisma.BatchPayload>;
    findByTicket(ticketId: string): Promise<{
        id: string;
        createdAt: Date;
        ticketId: string;
        filename: string;
        filepath: string;
        mimetype: string;
        size: number;
    }[]>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        ticketId: string;
        filename: string;
        filepath: string;
        mimetype: string;
        size: number;
    }>;
}
