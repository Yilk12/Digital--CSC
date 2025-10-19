"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpdeskModule = void 0;
const common_1 = require("@nestjs/common");
const helpdesk_controller_1 = require("./helpdesk.controller");
const helpdesk_service_1 = require("./helpdesk.service");
const prisma_module_1 = require("../prisma/prisma.module");
let HelpdeskModule = class HelpdeskModule {
};
exports.HelpdeskModule = HelpdeskModule;
exports.HelpdeskModule = HelpdeskModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [helpdesk_controller_1.HelpdeskController],
        providers: [helpdesk_service_1.HelpdeskService],
        exports: [helpdesk_service_1.HelpdeskService],
    })
], HelpdeskModule);
//# sourceMappingURL=helpdesk.module.js.map