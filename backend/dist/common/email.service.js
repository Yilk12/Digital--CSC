"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
const localization_service_1 = require("./localization.service");
const client_1 = require("@prisma/client");
let EmailService = class EmailService {
    constructor(configService, localizationService) {
        this.configService = configService;
        this.localizationService = localizationService;
        this.transporter = nodemailer_1.default.createTransport({
            host: this.configService.get("SMTP_HOST"),
            port: this.configService.get("SMTP_PORT"),
            secure: false,
            auth: {
                user: this.configService.get("SMTP_USER"),
                pass: this.configService.get("SMTP_PASS"),
            },
        });
    }
    async sendTicketCreatedEmail(to, ticketTitle, ticketId, creatorName, language = client_1.Language.EN) {
        const subject = this.localizationService.translate("email.ticket.created.subject", language, { title: ticketTitle });
        const html = this.generateTicketCreatedTemplate(ticketTitle, ticketId, creatorName, language);
        return this.sendEmail(to, subject, html);
    }
    async sendTicketAssignedEmail(to, ticketTitle, ticketId, assigneeName, language = client_1.Language.EN) {
        const subject = this.localizationService.translate("email.ticket.assigned.subject", language, {
            title: ticketTitle,
        });
        const html = this.generateTicketAssignedTemplate(ticketTitle, ticketId, assigneeName, language);
        return this.sendEmail(to, subject, html);
    }
    async sendTicketStatusUpdateEmail(to, ticketTitle, ticketId, oldStatus, newStatus, language = client_1.Language.EN) {
        const subject = `Ticket Status Updated: ${ticketTitle}`;
        const html = this.generateTicketStatusUpdateTemplate(ticketTitle, ticketId, oldStatus, newStatus, language);
        return this.sendEmail(to, subject, html);
    }
    async sendWelcomeEmail(to, userName, language = client_1.Language.EN) {
        const subject = this.localizationService.translate("notification.welcome", language);
        const html = this.generateWelcomeTemplate(userName, language);
        return this.sendEmail(to, subject, html);
    }
    async sendPasswordResetEmail(to, resetToken, language = client_1.Language.EN) {
        const subject = "Password Reset Request";
        const resetUrl = `${this.configService.get("FRONTEND_URL")}/reset-password?token=${resetToken}`;
        const html = this.generatePasswordResetTemplate(resetUrl, language);
        return this.sendEmail(to, subject, html);
    }
    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: this.configService.get("SMTP_USER"),
                to,
                subject,
                html,
            });
            console.log("Email sent:", info.messageId);
            return { success: true, messageId: info.messageId };
        }
        catch (error) {
            console.error("Email sending failed:", error);
            return { success: false, error: error.message };
        }
    }
    generateTicketCreatedTemplate(ticketTitle, ticketId, creatorName, language) {
        const baseUrl = this.configService.get("FRONTEND_URL");
        const ticketUrl = `${baseUrl}/tickets/${ticketId}`;
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Ticket Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>New Ticket Created</h3>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <p><strong>Created by:</strong> ${creatorName}</p>
            <p>A new support ticket has been created and is awaiting assignment.</p>
            <p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateTicketAssignedTemplate(ticketTitle, ticketId, assigneeName, language) {
        const baseUrl = this.configService.get("FRONTEND_URL");
        const ticketUrl = `${baseUrl}/tickets/${ticketId}`;
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Assigned</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Ticket Assigned to You</h3>
            <p>Hello ${assigneeName},</p>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <p>A support ticket has been assigned to you. Please review and take appropriate action.</p>
            <p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateTicketStatusUpdateTemplate(ticketTitle, ticketId, oldStatus, newStatus, language) {
        const baseUrl = this.configService.get("FRONTEND_URL");
        const ticketUrl = `${baseUrl}/tickets/${ticketId}`;
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Status Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .status-change { background-color: #e6f3ff; padding: 15px; border-left: 4px solid #0f766e; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Ticket Status Updated</h3>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <div class="status-change">
              <p><strong>Status changed from:</strong> ${oldStatus} → ${newStatus}</p>
            </div>
            <p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateWelcomeTemplate(userName, language) {
        const baseUrl = this.configService.get("FRONTEND_URL");
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Welcome ${userName}!</h3>
            <p>${this.localizationService.translate("notification.welcome", language)}</p>
            <p>You can now:</p>
            <ul>
              <li>Create and track support tickets</li>
              <li>Access our knowledge base</li>
              <li>Get help from our support team</li>
            </ul>
            <p>
              <a href="${baseUrl}" class="button">Access Helpdesk</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generatePasswordResetTemplate(resetUrl, language) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Password Reset Request</h3>
            <p>You have requested to reset your password. Click the button below to set a new password:</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>Security Notice:</strong> This link will expire in 1 hour. If you did not request this password reset, please ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        localization_service_1.LocalizationService])
], EmailService);
//# sourceMappingURL=email.service.js.map