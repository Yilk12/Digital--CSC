import { ScorecardsService } from './scorecards.service';
export declare class ScorecardsController {
    private readonly service;
    constructor(service: ScorecardsService);
    list(scope?: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL', status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED', year?: string, quarter?: string): any;
    get(id: string): any;
    create(body: {
        name: string;
        description?: string;
        scope: 'ORG' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL';
        ownerId?: string | null;
        year?: number | null;
        quarter?: number | null;
        status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    }): Promise<any>;
    update(id: string, body: Partial<Parameters<ScorecardsService['create']>[0]>): Promise<any>;
    remove(id: string): Promise<{
        ok: boolean;
    }>;
}
