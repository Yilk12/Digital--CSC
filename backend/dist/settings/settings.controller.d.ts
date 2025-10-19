import { SettingsService } from "./settings.service";
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    list(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }[]>;
    get(key: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }>;
    upsert(key: string, value: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }>;
    bulk(payload: Record<string, string>): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }[]>;
    seedDefaults(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }[]>;
}
