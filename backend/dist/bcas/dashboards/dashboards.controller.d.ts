import { DashboardsService } from './dashboards.service';
export declare class DashboardsController {
    private readonly service;
    constructor(service: DashboardsService);
    executive(year?: string, quarter?: string): Promise<{
        scorecards: any;
        kpiCount: any;
        datapointCount: any;
        byPerspective: any;
    }>;
    manager(departmentId?: string): Promise<{
        kpis: any;
        recent: any;
        filter: {
            departmentId: string | undefined;
        };
    }>;
    employee(userId: string): Promise<{
        recentMine: any;
    }>;
}
