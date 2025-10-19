import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { TicketsModule } from "./tickets/tickets.module"
import { KnowledgeBaseModule } from "./knowledge-base/knowledge-base.module"
import { AnalyticsModule } from "./analytics/analytics.module"
import { CommonModule } from "./common/common.module"
import { PrismaModule } from "./prisma/prisma.module"
import { ChatModule } from "./chat/chat.module"
import { HelpdeskModule } from "./helpdesk/helpdesk.module"
import { ReportsModule } from "./reports/reports.module"
import { SettingsModule } from "./settings/settings.module"
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver, I18nJsonLoader } from 'nestjs-i18n'
import * as path from 'path'
import { PostsModule } from './posts/posts.module'
import { AdvertisementsModule } from './advertisements/advertisements.module'
import { FeedbackModule } from "./feedback/feedback.module"
import { AbuseReportsModule } from './abuse-reports/abuse-reports.module'
import { DepartmentsModule } from './departments/departments.module'
import { SubmissionsModule } from './submissions/submissions.module'
import { ScorecardsModule } from './bcas/scorecards/scorecards.module'
import { ObjectivesModule } from './bcas/objectives/objectives.module'
import { KpisModule } from './bcas/kpis/kpis.module'
import { DashboardsModule } from './bcas/dashboards/dashboards.module'
import { FleetModule } from './fleet/fleet.module'
import { PlanningModule } from './planning/planning.module'
import { WorkflowModule } from './workflow/workflow.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',      // prefer env file located in backend/.env
        '../.env',   // fallback to monorepo root .env
      ],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-lang', 'x-locale']),
        AcceptLanguageResolver,
      ],
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    KnowledgeBaseModule,
    AnalyticsModule,
    ChatModule,
    HelpdeskModule,
    ReportsModule,
    SettingsModule,
    PostsModule,
    FeedbackModule,
    AbuseReportsModule,
    AdvertisementsModule,
    DepartmentsModule,
    SubmissionsModule,
    ScorecardsModule,
    ObjectivesModule,
    KpisModule,
    DashboardsModule,
    FleetModule,
    PlanningModule,
    WorkflowModule,
  ],
})
export class AppModule {}
