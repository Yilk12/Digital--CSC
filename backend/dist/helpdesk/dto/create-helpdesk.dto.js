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
exports.CreateHelpdeskDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class CreateHelpdeskDto {
}
exports.CreateHelpdeskDto = CreateHelpdeskDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Ticket title" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHelpdeskDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Ticket description" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHelpdeskDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TicketPriority, description: "Ticket priority" }),
    (0, class_validator_1.IsEnum)(client_1.TicketPriority),
    __metadata("design:type", String)
], CreateHelpdeskDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.TicketCategory, description: "Ticket category" }),
    (0, class_validator_1.IsEnum)(client_1.TicketCategory),
    __metadata("design:type", String)
], CreateHelpdeskDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Department ID", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateHelpdeskDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Assignee ID", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateHelpdeskDto.prototype, "assigneeId", void 0);
//# sourceMappingURL=create-helpdesk.dto.js.map