import { KpisService } from './kpis.service';
export declare class KpisController {
    private readonly service;
    constructor(service: KpisService);
    list(objectiveId?: string): any;
    get(id: string): any;
    create(body: {
        objectiveId: string;
        name: string;
        unit: string;
        direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET';
        calculationNotes?: string | null;
        ownerId?: string | null;
    }): any;
    update(id: string, body: Partial<Parameters<KpisService['create']>[0]>): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
    listTargets(id: string): any;
    createTarget(kpiId: string, body: {
        periodStart: string;
        periodEnd: string;
        targetValue: number;
        thresholdGreen?: number | null;
        thresholdYellow?: number | null;
        deadline?: string | null;
    }): any;
    removeTarget(targetId: string): any;
    listDataPoints(id: string): any;
    createDataPoint(kpiId: string, body: {
        periodDate: string;
        actualValue: number;
        source?: 'MANUAL' | 'IMPORT' | 'API';
        submittedById?: string | null;
    }): any;
    approve(dataPointId: string, body: {
        approverId: string;
    }): any;
    removeDataPoint(dataPointId: string): any;
    bulkCreate(body: {
        items: Array<{
            kpiId: string;
            periodDate: string;
            actualValue: number;
            source?: 'MANUAL' | 'IMPORT' | 'API';
            submittedById?: string | null;
        }>;
    }): Promise<{
        created: any;
    }>;
}
