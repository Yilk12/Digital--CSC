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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArticlesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const articles_service_1 = require("./articles.service");
const create_article_dto_1 = require("./dto/create-article.dto");
const update_article_dto_1 = require("./dto/update-article.dto");
const add_feedback_dto_1 = require("./dto/add-feedback.dto");
const add_comment_dto_1 = require("./dto/add-comment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ArticlesController = class ArticlesController {
    constructor(articlesService) {
        this.articlesService = articlesService;
    }
    create(createArticleDto, files, req) {
        return this.articlesService.create(createArticleDto, req.user.userId, files);
    }
    findAll(req, page, limit, status, language, categoryId, search, authorId) {
        var _a;
        return this.articlesService.findAll(page, limit, status, language, categoryId, search, authorId, (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.role);
    }
    getStats(req, authorId) {
        const targetAuthorId = req.user.role === client_1.UserRole.ADMIN ? authorId : req.user.userId;
        return this.articlesService.getArticleStats(targetAuthorId);
    }
    findOne(id, incrementView) {
        return this.articlesService.findOne(id, incrementView === true);
    }
    getRelated(id, limit) {
        return this.articlesService.getRelatedArticles(id, limit);
    }
    update(id, updateArticleDto, req) {
        return this.articlesService.update(id, updateArticleDto, req.user.userId, req.user.role);
    }
    remove(id, req) {
        return this.articlesService.remove(id, req.user.userId, req.user.role);
    }
    addFeedback(articleId, addFeedbackDto, req) {
        return this.articlesService.addFeedback(articleId, req.user.userId, addFeedbackDto.isLike);
    }
    addComment(articleId, addCommentDto, req) {
        return this.articlesService.addComment(articleId, addCommentDto.content, req.user.userId);
    }
};
exports.ArticlesController = ArticlesController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Create a new article" }),
    (0, swagger_1.ApiConsumes)("multipart/form-data"),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Article created successfully" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT_AGENT, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)("files", 5)),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_article_dto_1.CreateArticleDto, Array, Object]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get all articles with pagination and filters" }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false, enum: client_1.ArticleStatus }),
    (0, swagger_1.ApiQuery)({ name: "language", required: false, enum: client_1.Language }),
    (0, swagger_1.ApiQuery)({ name: "categoryId", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "authorId", required: false, type: String }),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('language')),
    __param(5, (0, common_1.Query)('categoryId')),
    __param(6, (0, common_1.Query)('search')),
    __param(7, (0, common_1.Query)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, typeof (_a = typeof client_1.ArticleStatus !== "undefined" && client_1.ArticleStatus) === "function" ? _a : Object, typeof (_b = typeof client_1.Language !== "undefined" && client_1.Language) === "function" ? _b : Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get article statistics" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("stats"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "getStats", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get article by ID" }),
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('incrementView')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get related articles" }),
    (0, common_1.Get)(":id/related"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "getRelated", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Update article" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT_AGENT, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Patch)(":id"),
    __param(0, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_article_dto_1.UpdateArticleDto, Object]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "update", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Delete article" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN, client_1.UserRole.SUPPORT_AGENT, client_1.UserRole.STAFF_MANAGER),
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "remove", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Add feedback to article" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(":id/feedback"),
    __param(0, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_feedback_dto_1.AddFeedbackDto, Object]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "addFeedback", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Add comment to article" }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(":id/comments"),
    __param(0, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_comment_dto_1.AddCommentDto, Object]),
    __metadata("design:returntype", void 0)
], ArticlesController.prototype, "addComment", null);
exports.ArticlesController = ArticlesController = __decorate([
    (0, swagger_1.ApiTags)("Knowledge Base - Articles"),
    (0, common_1.Controller)("knowledge-base/articles"),
    __metadata("design:paramtypes", [articles_service_1.ArticlesService])
], ArticlesController);
//# sourceMappingURL=articles.controller.js.map