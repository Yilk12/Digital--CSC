import { ObjectivesService } from './objectives.service';
export declare class ObjectivesController {
    private readonly service;
    constructor(service: ObjectivesService);
    list(scorecardId?: string): any;
    get(id: string): any;
    create(body: {
        scorecardId: string;
        title: string;
        description?: string;
        perspective: 'FINANCIAL' | 'CUSTOMER' | 'INTERNAL' | 'LEARNING_GROWTH';
        parentObjectiveId?: string | null;
        weight?: number | null;
        ownerId?: string | null;
    }): any;
    update(id: string, body: Partial<Parameters<ObjectivesService['create']>[0]>): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
