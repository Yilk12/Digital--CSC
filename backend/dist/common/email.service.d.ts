import { ConfigService } from "@nestjs/config";
import { LocalizationService } from "./localization.service";
import { Language } from "@prisma/client";
export declare class EmailService {
    private configService;
    private localizationService;
    private transporter;
    constructor(configService: ConfigService, localizationService: LocalizationService);
    sendTicketCreatedEmail(to: string, ticketTitle: string, ticketId: string, creatorName: string, language?: Language): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
    }>;
    sendTicketAssignedEmail(to: string, ticketTitle: string, ticketId: string, assigneeName: string, language?: Language): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
    }>;
    sendTicketStatusUpdateEmail(to: string, ticketTitle: string, ticketId: string, oldStatus: string, newStatus: string, language?: Language): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
    }>;
    sendWelcomeEmail(to: string, userName: string, language?: Language): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
    }>;
    sendPasswordResetEmail(to: string, resetToken: string, language?: Language): Promise<{
        success: boolean;
        messageId: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        messageId?: undefined;
    }>;
    private sendEmail;
    private generateTicketCreatedTemplate;
    private generateTicketAssignedTemplate;
    private generateTicketStatusUpdateTemplate;
    private generateWelcomeTemplate;
    private generatePasswordResetTemplate;
}
