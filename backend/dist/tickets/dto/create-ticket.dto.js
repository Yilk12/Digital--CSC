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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTicketDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const nestjs_i18n_1 = require("nestjs-i18n");
class CreateTicketDto {
}
exports.CreateTicketDto = CreateTicketDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Unable to access email system" }),
    (0, class_validator_1.IsNotEmpty)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.REQUIRED') }),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    (0, class_validator_1.MaxLength)(200, { message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.MAX_LENGTH', { length: 200 }) }),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Detailed description of the issue..." }),
    (0, class_validator_1.IsNotEmpty)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.REQUIRED') }),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TicketPriority, example: client_1.TicketPriority.MEDIUM }),
    (0, class_validator_1.IsEnum)(client_1.TicketPriority, { message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.ENUM') }),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TicketCategory, example: client_1.TicketCategory.INCIDENT }),
    (0, class_validator_1.IsEnum)(client_1.TicketCategory, { message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.ENUM') }),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "dept-uuid", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "agent-uuid", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateTicketDto.prototype, "assigneeId", void 0);
//# sourceMappingURL=create-ticket.dto.js.map