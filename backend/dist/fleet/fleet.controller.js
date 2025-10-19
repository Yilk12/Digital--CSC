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
exports.FleetController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fleet_service_1 = require("./fleet.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let FleetController = class FleetController {
    constructor(fleet) {
        this.fleet = fleet;
    }
    listVehicles(q) {
        return this.fleet.listVehicles(q);
    }
    createVehicle(body) {
        return this.fleet.createVehicle(body);
    }
    updateVehicle(id, body) {
        return this.fleet.updateVehicle(id, body);
    }
    deleteVehicle(id) {
        return this.fleet.deleteVehicle(id);
    }
    listRequests(status) {
        return this.fleet.listRequests(status);
    }
    createRequest(body) {
        return this.fleet.createRequest(body);
    }
    approveRequest(id) {
        return this.fleet.setRequestStatus(Number(id), 'APPROVED');
    }
    rejectRequest(id) {
        return this.fleet.setRequestStatus(Number(id), 'REJECTED');
    }
    listTrips(vehicleId) {
        return this.fleet.listTrips(vehicleId);
    }
    createTrip(body) {
        return this.fleet.createTrip(body);
    }
};
exports.FleetController = FleetController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List vehicles' }),
    (0, common_1.Get)('vehicles'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "listVehicles", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create vehicle' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Post)('vehicles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "createVehicle", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Update vehicle' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Put)('vehicles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "updateVehicle", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete vehicle' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Delete)('vehicles/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "deleteVehicle", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List fleet requests' }),
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "listRequests", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create fleet request' }),
    (0, common_1.Post)('requests'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "createRequest", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Approve request' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Put)('requests/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "approveRequest", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Reject request' }),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Put)('requests/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "rejectRequest", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'List trips' }),
    (0, common_1.Get)('trips'),
    __param(0, (0, common_1.Query)('vehicleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "listTrips", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create trip' }),
    (0, common_1.Post)('trips'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FleetController.prototype, "createTrip", null);
exports.FleetController = FleetController = __decorate([
    (0, swagger_1.ApiTags)('Fleet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('fleet'),
    __metadata("design:paramtypes", [fleet_service_1.FleetService])
], FleetController);
//# sourceMappingURL=fleet.controller.js.map