import { PrismaService } from '../prisma/prisma.service';
interface ListParams {
    owner?: string | null;
    status?: string | null;
    q?: string | null;
    page: number;
    pageSize: number;
    sortBy?: string | null;
    sortDir?: 'asc' | 'desc';
    sortMulti?: string | null;
}
export declare class PlanningService {
    private prisma;
    constructor(prisma: PrismaService);
    list(params: ListParams): Promise<{
        ok: boolean;
        items: any;
        page: number;
        pageSize: number;
        total: any;
    }>;
    create(body: {
        title: string;
        description?: string;
        ownerId: string;
    }): Promise<any>;
    update(id: string, body: {
        title?: string;
        description?: string;
        status?: string;
    }): Promise<any>;
    remove(id: string): Promise<any>;
}
export {};
