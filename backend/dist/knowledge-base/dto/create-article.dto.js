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
exports.CreateArticleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const nestjs_i18n_1 = require("nestjs-i18n");
class CreateArticleDto {
}
exports.CreateArticleDto = CreateArticleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "How to Reset Your Password" }),
    (0, class_validator_1.IsNotEmpty)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.REQUIRED') }),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "የይለፍ ቃልዎን እንዴት እንደሚዳግሙ", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "titleAm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Detailed article content..." }),
    (0, class_validator_1.IsNotEmpty)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.REQUIRED') }),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "የዝርዝር ጽሑፍ ይዘት...", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "contentAm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Brief description of the article", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "excerpt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.ArticleStatus, example: client_1.ArticleStatus.DRAFT }),
    (0, class_validator_1.IsEnum)(client_1.ArticleStatus, { message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.ENUM') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.Language, example: client_1.Language.EN }),
    (0, class_validator_1.IsEnum)(client_1.Language, { message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.ENUM') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "language", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "category-uuid", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["password", "reset", "security"], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_ARRAY') }),
    (0, class_validator_1.IsString)({ each: true, message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_STRING') }),
    __metadata("design:type", Array)
], CreateArticleDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2024-12-31T23:59:59Z", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: (0, nestjs_i18n_1.i18nValidationMessage)('validation.IS_DATE') }),
    __metadata("design:type", String)
], CreateArticleDto.prototype, "expiresAt", void 0);
//# sourceMappingURL=create-article.dto.js.map