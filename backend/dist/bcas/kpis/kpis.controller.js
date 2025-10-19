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
exports.KpisController = void 0;
const common_1 = require("@nestjs/common");
const kpis_service_1 = require("./kpis.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/guards/roles.guard");
const roles_decorator_1 = require("../../auth/decorators/roles.decorator");
let KpisController = class KpisController {
    constructor(service) {
        this.service = service;
    }
    list(objectiveId) {
        return this.service.list(objectiveId);
    }
    get(id) { return this.service.get(id); }
    create(body) {
        return this.service.create(body);
    }
    update(id, body) {
        return this.service.update(id, body);
    }
    remove(id) { return this.service.remove(id); }
    listTargets(id) { return this.service.listTargets(id); }
    createTarget(kpiId, body) {
        var _a, _b;
        return this.service.createTarget(kpiId, {
            periodStart: new Date(body.periodStart),
            periodEnd: new Date(body.periodEnd),
            targetValue: body.targetValue,
            thresholdGreen: (_a = body.thresholdGreen) !== null && _a !== void 0 ? _a : null,
            thresholdYellow: (_b = body.thresholdYellow) !== null && _b !== void 0 ? _b : null,
            deadline: body.deadline ? new Date(body.deadline) : null,
        });
    }
    removeTarget(targetId) { return this.service.removeTarget(targetId); }
    listDataPoints(id) { return this.service.listDataPoints(id); }
    createDataPoint(kpiId, body) { return this.service.createDataPoint(kpiId, Object.assign(Object.assign({}, body), { periodDate: new Date(body.periodDate) })); }
    approve(dataPointId, body) { return this.service.approveDataPoint(dataPointId, body.approverId); }
    removeDataPoint(dataPointId) { return this.service.removeDataPoint(dataPointId); }
    bulkCreate(body) {
        const items = ((body === null || body === void 0 ? void 0 : body.items) || []).map((i) => (Object.assign(Object.assign({}, i), { periodDate: new Date(i.periodDate) })));
        return this.service.bulkCreateDataPoints(items);
    }
};
exports.KpisController = KpisController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'GENERAL_DIRECTOR', 'STAFF_MANAGER', 'SUPPORT_AGENT'),
    __param(0, (0, common_1.Query)('objectiveId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'GENERAL_DIRECTOR', 'STAFF_MANAGER', 'SUPPORT_AGENT'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/targets'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER', 'SUPPORT_AGENT'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "listTargets", null);
__decorate([
    (0, common_1.Post)(':id/targets'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "createTarget", null);
__decorate([
    (0, common_1.Delete)('targets/:targetId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('targetId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "removeTarget", null);
__decorate([
    (0, common_1.Get)(':id/datapoints'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER', 'SUPPORT_AGENT', 'GENERAL_DIRECTOR'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "listDataPoints", null);
__decorate([
    (0, common_1.Post)(':id/datapoints'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER', 'SUPPORT_AGENT'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "createDataPoint", null);
__decorate([
    (0, common_1.Patch)('datapoints/:dataPointId/approve'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER'),
    __param(0, (0, common_1.Param)('dataPointId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "approve", null);
__decorate([
    (0, common_1.Delete)('datapoints/:dataPointId'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('dataPointId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "removeDataPoint", null);
__decorate([
    (0, common_1.Post)('datapoints/bulk'),
    (0, roles_decorator_1.Roles)('ADMIN', 'STAFF_MANAGER', 'SUPPORT_AGENT'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KpisController.prototype, "bulkCreate", null);
exports.KpisController = KpisController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('api/v1/bcas/kpis'),
    __metadata("design:paramtypes", [kpis_service_1.KpisService])
], KpisController);
//# sourceMappingURL=kpis.controller.js.map