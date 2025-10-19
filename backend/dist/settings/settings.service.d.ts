import { PrismaService } from "../prisma/prisma.service";
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listSettings(): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }[]>;
    getSetting(settingKey: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }>;
    upsertSetting(settingKey: string, settingValue: string): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }>;
    upsertMany(settings: Record<string, string>): Promise<{
        id: number;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        value: string;
        key: string;
    }[]>;
}
