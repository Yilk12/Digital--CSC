import { PrismaService } from '../../prisma/prisma.service';
export declare class KpisService {
    private prisma;
    constructor(prisma: PrismaService);
    list(objectiveId?: string): any;
    get(id: string): any;
    create(data: {
        objectiveId: string;
        name: string;
        unit: string;
        direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET';
        calculationNotes?: string | null;
        ownerId?: string | null;
    }): any;
    update(id: string, data: Partial<{
        name: string;
        unit: string;
        direction: 'MAXIMIZE' | 'MINIMIZE' | 'TARGET';
        calculationNotes?: string | null;
        ownerId?: string | null;
    }>): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
    listTargets(kpiId: string): any;
    createTarget(kpiId: string, data: {
        periodStart: Date;
        periodEnd: Date;
        targetValue: number;
        thresholdGreen?: number | null;
        thresholdYellow?: number | null;
        deadline?: Date | null;
    }): any;
    removeTarget(id: string): any;
    listDataPoints(kpiId: string): any;
    createDataPoint(kpiId: string, data: {
        periodDate: Date;
        actualValue: number;
        source?: 'MANUAL' | 'IMPORT' | 'API';
        submittedById?: string | null;
    }): any;
    approveDataPoint(id: string, approverId: string): any;
    removeDataPoint(id: string): any;
    bulkCreateDataPoints(items: Array<{
        kpiId: string;
        periodDate: Date;
        actualValue: number;
        source?: 'MANUAL' | 'IMPORT' | 'API';
        submittedById?: string | null;
    }>): Promise<{
        created: any;
    }>;
}
