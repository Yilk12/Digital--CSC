"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const articles_service_1 = require("./articles.service");
const articles_controller_1 = require("./articles.controller");
const categories_service_1 = require("./categories.service");
const categories_controller_1 = require("./categories.controller");
const search_service_1 = require("./search.service");
const search_controller_1 = require("./search.controller");
const analytics_service_1 = require("./analytics.service");
const analytics_controller_1 = require("./analytics.controller");
const multer_1 = require("multer");
const path_1 = require("path");
let KnowledgeBaseModule = class KnowledgeBaseModule {
};
exports.KnowledgeBaseModule = KnowledgeBaseModule;
exports.KnowledgeBaseModule = KnowledgeBaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    storage: (0, multer_1.diskStorage)({
                        destination: configService.get("UPLOAD_PATH") || "./uploads/articles",
                        filename: (req, file, callback) => {
                            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                            callback(null, `article-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
                        },
                    }),
                    limits: {
                        fileSize: configService.get("MAX_FILE_SIZE") || 10485760,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            articles_service_1.ArticlesService,
            categories_service_1.CategoriesService,
            search_service_1.SearchService,
            analytics_service_1.KnowledgeBaseAnalyticsService
        ],
        controllers: [
            articles_controller_1.ArticlesController,
            categories_controller_1.CategoriesController,
            search_controller_1.SearchController,
            analytics_controller_1.KnowledgeBaseAnalyticsController
        ],
        exports: [
            articles_service_1.ArticlesService,
            categories_service_1.CategoriesService,
            search_service_1.SearchService,
            analytics_service_1.KnowledgeBaseAnalyticsService
        ],
    })
], KnowledgeBaseModule);
//# sourceMappingURL=knowledge-base.module.js.map