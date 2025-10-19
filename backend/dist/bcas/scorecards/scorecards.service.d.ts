import { PrismaService } from '../../prisma/prisma.service';
export declare class ScorecardsService {
    private prisma;
    constructor(prisma: PrismaService);
    list(params?: {
        scope?: string;
        status?: string;
        year?: number;
        quarter?: number;
    }): any;
    get(id: string): any;
    create(data: {
        name: string;
        description?: string;
        scope: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
        ownerId?: string | null;
        year?: number | null;
        quarter?: number | null;
        status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    }): Promise<any>;
    update(id: string, data: Partial<{
        name: string;
        description?: string;
        scope: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
        ownerId?: string | null;
        year?: number | null;
        quarter?: number | null;
        status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    }>): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
