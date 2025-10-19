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
exports.FeedbackService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../common/notification.service");
let FeedbackService = class FeedbackService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async listDepartments() {
        const depts = await this.prisma.department.findMany({
            where: { isActive: true },
            select: { id: true, name: true, nameAm: true },
            orderBy: { name: "asc" },
        });
        return depts;
    }
    async createFeedback(dto, user) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const role = ((_a = user === null || user === void 0 ? void 0 : user.role) !== null && _a !== void 0 ? _a : dto.role);
        if (!role) {
            throw new common_1.ForbiddenException("Role is required to submit feedback");
        }
        const userId = dto.anonymous ? null : (_b = user === null || user === void 0 ? void 0 : user.userId) !== null && _b !== void 0 ? _b : null;
        const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
        if (!dept)
            throw new common_1.ForbiddenException("Invalid department");
        const rec = await this.prisma.feedback.create({
            data: {
                role,
                userId,
                departmentId: dto.departmentId,
                type: dto.type,
                rating: (_c = dto.rating) !== null && _c !== void 0 ? _c : null,
                helpful: (_d = dto.helpful) !== null && _d !== void 0 ? _d : null,
                comments: (_e = dto.comments) !== null && _e !== void 0 ? _e : null,
                attachmentPath: (_f = dto.attachmentPath) !== null && _f !== void 0 ? _f : null,
                anonymous: !!dto.anonymous,
                articleId: (_g = dto.articleId) !== null && _g !== void 0 ? _g : null,
                ticketId: (_h = dto.ticketId) !== null && _h !== void 0 ? _h : null,
                experienceClarity: (_j = dto.experienceClarity) !== null && _j !== void 0 ? _j : null,
                resolutionOutcome: (_k = dto.resolutionOutcome) !== null && _k !== void 0 ? _k : null,
                departmentImpact: (_l = dto.departmentImpact) !== null && _l !== void 0 ? _l : null,
                processTrainingImprovements: (_m = dto.processTrainingImprovements) !== null && _m !== void 0 ? _m : null,
                strategicImpact: (_o = dto.strategicImpact) !== null && _o !== void 0 ? _o : null,
                escalationPriority: (_p = dto.escalationPriority) !== null && _p !== void 0 ? _p : null,
            },
        });
        try {
            const deptName = dept.name;
            const heads = await this.prisma.user.findMany({
                where: { role: client_1.UserRole.STAFF_MANAGER, isActive: true, department: deptName },
                select: { id: true },
            });
            for (const h of heads) {
                await this.notifications.createNotification(h.id, "feedback.new.title", `New ${dto.type.toLowerCase()} feedback received for ${deptName}`, "FEEDBACK_NEW");
            }
            if (dto.escalationPriority === "HIGH") {
                const gms = await this.prisma.user.findMany({
                    where: { role: client_1.UserRole.GENERAL_DIRECTOR, isActive: true },
                    select: { id: true },
                });
                for (const gm of gms) {
                    await this.notifications.createNotification(gm.id, "feedback.high_priority.title", `High priority feedback submitted for ${deptName}`, "FEEDBACK_HIGH_PRIORITY");
                }
            }
        }
        catch (e) {
        }
        return rec;
    }
    async listFeedback(query, requester) {
        const allowed = [client_1.UserRole.ADMIN, client_1.UserRole.STAFF_MANAGER, client_1.UserRole.GENERAL_DIRECTOR];
        if (!allowed.includes(requester.role)) {
            throw new common_1.ForbiddenException("Not authorized to view feedback");
        }
        const where = {};
        if (query.departmentId)
            where.departmentId = query.departmentId;
        if (requester.role === client_1.UserRole.STAFF_MANAGER) {
            if (!requester.department)
                throw new common_1.ForbiddenException("Department not set for manager");
            const departments = await this.prisma.department.findMany({ where: { name: requester.department } });
            const ids = departments.map((d) => d.id);
            where.departmentId = { in: ids };
        }
        if (query.type)
            where.type = query.type;
        if (query.from || query.to) {
            where.createdAt = {};
            if (query.from)
                where.createdAt.gte = query.from;
            if (query.to)
                where.createdAt.lte = query.to;
        }
        const items = await this.prisma.feedback.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
        return items;
    }
};
exports.FeedbackService = FeedbackService;
exports.FeedbackService = FeedbackService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], FeedbackService);
//# sourceMappingURL=feedback.service.js.map