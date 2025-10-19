import { PlanningService } from './planning.service';
export declare class PlanningController {
    private readonly planning;
    constructor(planning: PlanningService);
    list(owner?: string, status?: string, q?: string, page?: string, pageSize?: string, sortBy?: string, sortDir?: 'asc' | 'desc', sortMulti?: string): Promise<{
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
