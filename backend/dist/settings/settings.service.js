"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsService = class SettingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listSettings() {
        return this.prisma.systemSetting.findMany({
            orderBy: { settingKey: "asc" },
        });
    }
    async getSetting(settingKey) {
        const setting = await this.prisma.systemSetting.findUnique({
            where: { settingKey },
        });
        if (!setting)
            throw new common_1.NotFoundException("Setting not found");
        return setting;
    }
    async upsertSetting(settingKey, settingValue) {
        return this.prisma.systemSetting.upsert({
            where: { settingKey },
            update: { settingValue },
            create: { settingKey, settingValue },
        });
    }
    async upsertMany(settings) {
        const operations = Object.entries(settings).map(([key, value]) => this.prisma.systemSetting.upsert({
            where: { settingKey: key },
            update: { settingValue: value },
            create: { settingKey: key, settingValue: value },
        }));
        await this.prisma.$transaction(operations);
        return this.listSettings();
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map