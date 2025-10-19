import { Global, Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { LocalizationService } from "./localization.service"
import { EmailService } from "./email.service"
import { NotificationService } from "./notification.service"
import { AuditService } from "./audit.service"

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LocalizationService,
     EmailService,
      NotificationService, AuditService],
  exports: [LocalizationService,
    EmailService,
      NotificationService, AuditService],
})
export class CommonModule {}
