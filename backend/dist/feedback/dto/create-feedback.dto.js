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
exports.CreateFeedbackDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateFeedbackDto {
}
exports.CreateFeedbackDto = CreateFeedbackDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.FeedbackType }),
    (0, class_validator_1.IsEnum)(client_1.FeedbackType),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Department ID", format: "uuid" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Article ID if KB feedback", format: "uuid" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "articleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Ticket ID if ticket feedback", format: "uuid" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "ticketId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Likert scale 1-5" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateFeedbackDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Helpful binary" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeedbackDto.prototype, "helpful", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Free-form comments" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Attachment path (server-side)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "attachmentPath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Submit anonymously" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeedbackDto.prototype, "anonymous", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.UserRole,
        description: "Role of submitter (used if anonymous or no session)",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.UserRole),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Was the solution clear?" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeedbackDto.prototype, "experienceClarity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Was the issue solved?" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFeedbackDto.prototype, "resolutionOutcome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Impact on team performance" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "departmentImpact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Process/training improvements suggested" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "processTrainingImprovements", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Strategic impact on business" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "strategicImpact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["LOW", "MEDIUM", "HIGH"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["LOW", "MEDIUM", "HIGH"]),
    __metadata("design:type", String)
], CreateFeedbackDto.prototype, "escalationPriority", void 0);
//# sourceMappingURL=create-feedback.dto.js.map