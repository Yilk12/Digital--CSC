"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const tickets_module_1 = require("./tickets/tickets.module");
const knowledge_base_module_1 = require("./knowledge-base/knowledge-base.module");
const analytics_module_1 = require("./analytics/analytics.module");
const common_module_1 = require("./common/common.module");
const prisma_module_1 = require("./prisma/prisma.module");
const chat_module_1 = require("./chat/chat.module");
const helpdesk_module_1 = require("./helpdesk/helpdesk.module");
const reports_module_1 = require("./reports/reports.module");
const settings_module_1 = require("./settings/settings.module");
const nestjs_i18n_1 = require("nestjs-i18n");
const path = __importStar(require("path"));
const posts_module_1 = require("./posts/posts.module");
const advertisements_module_1 = require("./advertisements/advertisements.module");
const feedback_module_1 = require("./feedback/feedback.module");
const abuse_reports_module_1 = require("./abuse-reports/abuse-reports.module");
const departments_module_1 = require("./departments/departments.module");
const submissions_module_1 = require("./submissions/submissions.module");
const scorecards_module_1 = require("./bcas/scorecards/scorecards.module");
const objectives_module_1 = require("./bcas/objectives/objectives.module");
const kpis_module_1 = require("./bcas/kpis/kpis.module");
const dashboards_module_1 = require("./bcas/dashboards/dashboards.module");
const fleet_module_1 = require("./fleet/fleet.module");
const planning_module_1 = require("./planning/planning.module");
const workflow_module_1 = require("./workflow/workflow.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    '.env',
                    '../.env',
                ],
            }),
            nestjs_i18n_1.I18nModule.forRoot({
                fallbackLanguage: 'en',
                loader: nestjs_i18n_1.I18nJsonLoader,
                loaderOptions: {
                    path: path.join(__dirname, 'i18n'),
                    watch: true,
                },
                resolvers: [
                    { use: nestjs_i18n_1.QueryResolver, options: ['lang', 'locale', 'l'] },
                    new nestjs_i18n_1.HeaderResolver(['x-lang', 'x-locale']),
                    nestjs_i18n_1.AcceptLanguageResolver,
                ],
            }),
            prisma_module_1.PrismaModule,
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tickets_module_1.TicketsModule,
            knowledge_base_module_1.KnowledgeBaseModule,
            analytics_module_1.AnalyticsModule,
            chat_module_1.ChatModule,
            helpdesk_module_1.HelpdeskModule,
            reports_module_1.ReportsModule,
            settings_module_1.SettingsModule,
            posts_module_1.PostsModule,
            feedback_module_1.FeedbackModule,
            abuse_reports_module_1.AbuseReportsModule,
            advertisements_module_1.AdvertisementsModule,
            departments_module_1.DepartmentsModule,
            submissions_module_1.SubmissionsModule,
            scorecards_module_1.ScorecardsModule,
            objectives_module_1.ObjectivesModule,
            kpis_module_1.KpisModule,
            dashboards_module_1.DashboardsModule,
            fleet_module_1.FleetModule,
            planning_module_1.PlanningModule,
            workflow_module_1.WorkflowModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map