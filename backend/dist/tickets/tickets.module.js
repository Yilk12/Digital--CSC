"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const tickets_service_1 = require("./tickets.service");
const tickets_controller_1 = require("./tickets.controller");
const comments_service_1 = require("./comments.service");
const attachments_service_1 = require("./attachments.service");
const multer_1 = require("multer");
const path_1 = require("path");
let TicketsModule = class TicketsModule {
};
exports.TicketsModule = TicketsModule;
exports.TicketsModule = TicketsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    storage: (0, multer_1.diskStorage)({
                        destination: configService.get("UPLOAD_PATH") || "./uploads",
                        filename: (req, file, callback) => {
                            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
                            callback(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
                        },
                    }),
                    limits: {
                        fileSize: configService.get("MAX_FILE_SIZE") || 10485760,
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [tickets_service_1.TicketsService, comments_service_1.CommentsService, attachments_service_1.AttachmentsService],
        controllers: [tickets_controller_1.TicketsController],
        exports: [tickets_service_1.TicketsService],
    })
], TicketsModule);
//# sourceMappingURL=tickets.module.js.map