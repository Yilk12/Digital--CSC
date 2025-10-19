"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const analytics_controller_1 = require("./analytics.controller");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const tickets_module_1 = require("../tickets/tickets.module");
const knowledge_base_module_1 = require("../knowledge-base/knowledge-base.module");
const users_module_1 = require("../users/users.module");
let AnalyticsModule = class AnalyticsModule {
};
exports.AnalyticsModule = AnalyticsModule;
exports.AnalyticsModule = AnalyticsModule = __decorate([
    (0, common_1.Module)({
        imports: [tickets_module_1.TicketsModule, knowledge_base_module_1.KnowledgeBaseModule, users_module_1.UsersModule],
        providers: [analytics_service_1.AnalyticsService, reports_service_1.ReportsService],
        controllers: [analytics_controller_1.AnalyticsController, reports_controller_1.ReportsController],
        exports: [analytics_service_1.AnalyticsService, reports_service_1.ReportsService],
    })
], AnalyticsModule);
//# sourceMappingURL=analytics.module.js.map