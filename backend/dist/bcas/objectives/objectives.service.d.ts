import { PrismaService } from '../../prisma/prisma.service';
export declare class ObjectivesService {
    private prisma;
    constructor(prisma: PrismaService);
    list(scorecardId?: string): any;
    get(id: string): any;
    create(data: {
        scorecardId: string;
        title: string;
        description?: string;
        perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL' | 'LEARNING_GROWTH';
        parentObjectiveId?: string | null;
        weight?: number | null;
        ownerId?: string | null;
    }): any;
    update(id: string, data: Partial<{
        title: string;
        description?: string;
        perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL' | 'LEARNING_GROWTH';
        parentObjectiveId?: string | null;
        weight?: number | null;
        ownerId?: string | null;
    }>): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
