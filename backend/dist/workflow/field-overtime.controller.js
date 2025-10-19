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
exports.FieldOvertimeController = void 0;
const common_1 = require("@nestjs/common");
let FieldOvertimeController = class FieldOvertimeController {
    getFieldRequests() {
        return { ok: true, data: [], message: 'Field requests listing placeholder' };
    }
    createFieldRequest(body) {
        return { ok: true, data: Object.assign({ id: 'temp-field-id' }, body), message: 'Field request create placeholder' };
    }
    getFieldRequest(id) {
        return { ok: true, data: { id }, message: 'Field request detail placeholder' };
    }
    updateFieldRequest(id, body) {
        return { ok: true, data: Object.assign({ id }, body), message: 'Field request update placeholder' };
    }
    removeFieldRequest(id) {
        return { ok: true, id, message: 'Field request delete placeholder' };
    }
    approveFieldRequest(id) {
        return { ok: true, id, status: 'APPROVED', message: 'Field request approve placeholder' };
    }
    getOvertimeRequests() {
        return { ok: true, data: [], message: 'Overtime requests listing placeholder' };
    }
    createOvertimeRequest(body) {
        return { ok: true, data: Object.assign({ id: 'temp-overtime-id' }, body), message: 'Overtime request create placeholder' };
    }
    getOvertimeRequest(id) {
        return { ok: true, data: { id }, message: 'Overtime request detail placeholder' };
    }
    updateOvertimeRequest(id, body) {
        return { ok: true, data: Object.assign({ id }, body), message: 'Overtime request update placeholder' };
    }
    removeOvertimeRequest(id) {
        return { ok: true, id, message: 'Overtime request delete placeholder' };
    }
    approveOvertimeRequest(id) {
        return { ok: true, id, status: 'APPROVED', message: 'Overtime request approve placeholder' };
    }
};
exports.FieldOvertimeController = FieldOvertimeController;
__decorate([
    (0, common_1.Get)('field-requests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "getFieldRequests", null);
__decorate([
    (0, common_1.Post)('field-requests'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "createFieldRequest", null);
__decorate([
    (0, common_1.Get)('field-requests/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "getFieldRequest", null);
__decorate([
    (0, common_1.Patch)('field-requests/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "updateFieldRequest", null);
__decorate([
    (0, common_1.Delete)('field-requests/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "removeFieldRequest", null);
__decorate([
    (0, common_1.Post)('field-requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "approveFieldRequest", null);
__decorate([
    (0, common_1.Get)('overtime-requests'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "getOvertimeRequests", null);
__decorate([
    (0, common_1.Post)('overtime-requests'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "createOvertimeRequest", null);
__decorate([
    (0, common_1.Get)('overtime-requests/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "getOvertimeRequest", null);
__decorate([
    (0, common_1.Patch)('overtime-requests/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "updateOvertimeRequest", null);
__decorate([
    (0, common_1.Delete)('overtime-requests/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "removeOvertimeRequest", null);
__decorate([
    (0, common_1.Post)('overtime-requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FieldOvertimeController.prototype, "approveOvertimeRequest", null);
exports.FieldOvertimeController = FieldOvertimeController = __decorate([
    (0, common_1.Controller)('workflow')
], FieldOvertimeController);
//# sourceMappingURL=field-overtime.controller.js.map