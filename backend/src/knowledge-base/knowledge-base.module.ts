import { Module } from "@nestjs/common"
import { MulterModule } from "@nestjs/platform-express"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { PrismaModule } from "../prisma/prisma.module"
import { ArticlesService } from "./articles.service"
import { ArticlesController } from "./articles.controller"
import { CategoriesService } from "./categories.service"
import { CategoriesController } from "./categories.controller"
import { SearchService } from "./search.service"
import { SearchController } from "./search.controller"
import { KnowledgeBaseAnalyticsService } from "./analytics.service"
import { KnowledgeBaseAnalyticsController } from "./analytics.controller"
import { diskStorage } from "multer"
import { extname } from "path"

@Module({
  imports: [
    PrismaModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>("UPLOAD_PATH") || "./uploads/articles",
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
            callback(null, `article-${uniqueSuffix}${extname(file.originalname)}`)
          },
        }),
        limits: {
          fileSize: configService.get<number>("MAX_FILE_SIZE") || 10485760, // 10MB
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    ArticlesService, 
    CategoriesService, 
    SearchService, 
    KnowledgeBaseAnalyticsService
  ],
  controllers: [
    ArticlesController, 
    CategoriesController, 
    SearchController, 
    KnowledgeBaseAnalyticsController
  ],
  exports: [
    ArticlesService, 
    CategoriesService, 
    SearchService, 
    KnowledgeBaseAnalyticsService
  ],
})
export class KnowledgeBaseModule {}
