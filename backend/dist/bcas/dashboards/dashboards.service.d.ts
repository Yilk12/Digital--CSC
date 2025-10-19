import { PrismaService } from '../../prisma/prisma.service';
export declare class DashboardsService {
    private prisma;
    constructor(prisma: PrismaService);
    executive(params?: {
        year?: number;
        quarter?: number;
    }): Promise<{
        scorecards: any;
        kpiCount: any;
        datapointCount: any;
        byPerspective: any;
    }>;
    manager(params?: {
        departmentId?: string;
    }): Promise<{
        kpis: any;
        recent: any;
        filter: {
            departmentId: string | undefined;
        };
    }>;
    employee(params: {
        userId: string;
    }): Promise<{
        recentMine: any;
    }>;
}
