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
exports.WorkflowService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkflowService = class WorkflowService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async distributePlanAssignments(body) {
        const { planId, toUsers, by, dueDate, notes } = body;
        const due = dueDate ? new Date(dueDate) : undefined;
        const created = await this.prisma.$transaction(toUsers.map(uid => this.prisma.planAssignment.create({
            data: {
                planId,
                fromUserId: by,
                toUserId: uid,
                level: 'DEPARTMENT',
                notes: notes || undefined,
                dueDate: due,
            }
        })));
        await this.prisma.planHistory.createMany({
            data: created.map(a => ({ planId, byUserId: by, action: `assign:${a.toUserId}`, comments: notes || undefined })),
        });
        return created;
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowService);
//# sourceMappingURL=workflow.service.js.map