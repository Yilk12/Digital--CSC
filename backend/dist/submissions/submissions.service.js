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
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let SubmissionsService = class SubmissionsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        var _a, _b, _c, _d;
        const data = {
            user: input.userId ? { connect: { id: input.userId } } : undefined,
            submitterName: (_a = input.submitterName) !== null && _a !== void 0 ? _a : null,
            submitterDepartment: (_b = input.submitterDepartment) !== null && _b !== void 0 ? _b : null,
            contactEmail: (_c = input.contactEmail) !== null && _c !== void 0 ? _c : null,
            contactPhone: (_d = input.contactPhone) !== null && _d !== void 0 ? _d : null,
            anonymous: Boolean(input.anonymous),
            type: input.type,
            subject: input.subject,
            description: input.description,
            status: client_1.$Enums.SubmissionStatus.SUBMITTED,
        };
        return this.prisma.submission.create({ data });
    }
    async list(params) {
        const { type, status } = params;
        return this.prisma.submission.findMany({
            where: { type, status },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getById(id) {
        const sub = await this.prisma.submission.findUnique({ where: { id } });
        if (!sub)
            throw new common_1.NotFoundException('Submission not found');
        return sub;
    }
    async gmAct(id, input) {
        var _a, _b;
        const exists = await this.getById(id);
        let status = exists.status;
        switch (input.action) {
            case 'ACCEPT':
                status = client_1.$Enums.SubmissionStatus.ACCEPTED;
                break;
            case 'REJECT':
                status = client_1.$Enums.SubmissionStatus.REJECTED;
                break;
            case 'ESCALATE':
                status = client_1.$Enums.SubmissionStatus.ESCALATED;
                break;
            case 'MORE_INFO_REQUEST':
                status = client_1.$Enums.SubmissionStatus.MORE_INFO_REQUESTED;
                break;
            case 'CLOSE':
                status = client_1.$Enums.SubmissionStatus.CLOSED;
                break;
        }
        return this.prisma.submission.update({
            where: { id },
            data: {
                status,
                decisionSummary: (_a = input.decisionSummary) !== null && _a !== void 0 ? _a : null,
                decisionAt: new Date(),
                gmReviewer: { connect: { id: input.gmReviewerId } },
                assignedDepartment: input.assignedDepartmentId ? { connect: { id: input.assignedDepartmentId } } : undefined,
                escalatedTo: (_b = input.escalatedTo) !== null && _b !== void 0 ? _b : null,
            },
        });
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map