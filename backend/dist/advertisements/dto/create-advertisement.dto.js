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
exports.CreateAdvertisementDto = exports.AdvertisementPriority = exports.AdvertisementCategory = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var AdvertisementCategory;
(function (AdvertisementCategory) {
    AdvertisementCategory["HR"] = "HR";
    AdvertisementCategory["IT"] = "IT";
    AdvertisementCategory["Facilities"] = "Facilities";
    AdvertisementCategory["Policy"] = "Policy";
    AdvertisementCategory["Other"] = "Other";
})(AdvertisementCategory || (exports.AdvertisementCategory = AdvertisementCategory = {}));
var AdvertisementPriority;
(function (AdvertisementPriority) {
    AdvertisementPriority["Low"] = "Low";
    AdvertisementPriority["Medium"] = "Medium";
    AdvertisementPriority["High"] = "High";
})(AdvertisementPriority || (exports.AdvertisementPriority = AdvertisementPriority = {}));
class CreateAdvertisementDto {
}
exports.CreateAdvertisementDto = CreateAdvertisementDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 200),
    __metadata("design:type", String)
], CreateAdvertisementDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 5000),
    __metadata("design:type", String)
], CreateAdvertisementDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AdvertisementCategory }),
    (0, class_validator_1.IsEnum)(AdvertisementCategory),
    __metadata("design:type", String)
], CreateAdvertisementDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AdvertisementPriority, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(AdvertisementPriority),
    __metadata("design:type", String)
], CreateAdvertisementDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: String }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdvertisementDto.prototype, "publishDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, type: String }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAdvertisementDto.prototype, "expiryDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAdvertisementDto.prototype, "isPublished", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAdvertisementDto.prototype, "isUrgent", void 0);
//# sourceMappingURL=create-advertisement.dto.js.map