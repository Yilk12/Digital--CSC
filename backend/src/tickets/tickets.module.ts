import { Module } from "@nestjs/common"
import { MulterModule } from "@nestjs/platform-express"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { TicketsService } from "./tickets.service"
import { TicketsController } from "./tickets.controller"
import { CommentsService } from "./comments.service"
import { AttachmentsService } from "./attachments.service"
import { diskStorage } from "multer"
import { extname } from "path"

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>("UPLOAD_PATH") || "./uploads",
          filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
            callback(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`)
          },
        }),
        limits: {
          fileSize: configService.get<number>("MAX_FILE_SIZE") || 10485760, // 10MB
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [TicketsService, CommentsService, AttachmentsService],
  controllers: [TicketsController],
  exports: [TicketsService],
})
export class TicketsModule {}
