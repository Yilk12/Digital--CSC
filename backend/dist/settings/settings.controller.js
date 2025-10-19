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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const defaults_1 = require("./defaults");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    list() {
        return this.settingsService.listSettings();
    }
    get(key) {
        return this.settingsService.getSetting(key);
    }
    upsert(key, value) {
        return this.settingsService.upsertSetting(key, value);
    }
    bulk(payload) {
        return this.settingsService.upsertMany(payload);
    }
    seedDefaults() {
        return this.settingsService.upsertMany(defaults_1.DEFAULT_SETTINGS);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "List all settings" }),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "list", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get a single setting by key" }),
    (0, common_1.Get)(":key"),
    __param(0, (0, common_1.Param)("key")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "get", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Create or update a setting" }),
    (0, common_1.Patch)(":key"),
    __param(0, (0, common_1.Param)("key")),
    __param(1, (0, common_1.Body)("value")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "upsert", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Bulk upsert settings" }),
    (0, common_1.Post)("bulk"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "bulk", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Seed default settings" }),
    (0, common_1.Post)("seed-defaults"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "seedDefaults", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)("System Settings"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    (0, common_1.Controller)("settings"),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map