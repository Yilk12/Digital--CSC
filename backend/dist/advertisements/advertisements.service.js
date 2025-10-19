"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvertisementsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
let AdvertisementsService = class AdvertisementsService {
    constructor() {
        this.store = new Map();
    }
    list(params) {
        const all = Array.from(this.store.values())
            .filter((a) => {
            if (params.category && params.category !== 'All' && a.category !== params.category)
                return false;
            if (params.q) {
                const s = params.q.toLowerCase();
                return a.title.toLowerCase().includes(s) || a.description.toLowerCase().includes(s);
            }
            return true;
        })
            .sort((a, b) => {
            const da = new Date(a.createdAt).getTime();
            const db = new Date(b.createdAt).getTime();
            return (params.sort || 'newest') === 'newest' ? db - da : da - db;
        });
        const start = (params.page - 1) * params.pageSize;
        const items = all.slice(start, start + params.pageSize);
        return { items, total: all.length, page: params.page, pageSize: params.pageSize };
    }
    getOne(id) {
        const it = this.store.get(id);
        if (!it)
            throw new common_1.NotFoundException('Advertisement not found');
        return it;
    }
    create(dto) {
        var _a, _b;
        const now = new Date().toISOString();
        const ad = {
            id: (0, crypto_1.randomUUID)(),
            title: dto.title,
            description: dto.description,
            category: dto.category,
            priority: dto.priority,
            publishDate: dto.publishDate,
            expiryDate: dto.expiryDate,
            isPublished: (_a = dto.isPublished) !== null && _a !== void 0 ? _a : true,
            isUrgent: (_b = dto.isUrgent) !== null && _b !== void 0 ? _b : false,
            attachments: [],
            createdAt: now,
            updatedAt: now,
            likeCount: 0,
            shareCount: 0,
            comments: [],
        };
        this.store.set(ad.id, ad);
        console.log('[AUDIT] advertisement.create', { id: ad.id, title: ad.title });
        return ad;
    }
    update(id, dto) {
        const existing = this.getOne(id);
        const updated = Object.assign(Object.assign(Object.assign({}, existing), dto), { updatedAt: new Date().toISOString() });
        this.store.set(id, updated);
        console.log('[AUDIT] advertisement.update', { id });
        return updated;
    }
    remove(id) {
        const existed = this.store.delete(id);
        if (!existed)
            throw new common_1.NotFoundException('Advertisement not found');
        console.log('[AUDIT] advertisement.remove', { id });
        return { success: true };
    }
    addAttachments(id, files) {
        const ad = this.getOne(id);
        const next = files.map((f) => ({
            id: (0, crypto_1.randomUUID)(),
            name: f.originalname,
            url: `/uploads/${f.filename || f.originalname}`,
            type: f.mimetype,
            size: f.size,
        }));
        ad.attachments = [...(ad.attachments || []), ...next];
        ad.updatedAt = new Date().toISOString();
        this.store.set(id, ad);
        console.log('[AUDIT] advertisement.attachments', { id, files: files.length });
        return ad;
    }
    like(id) {
        const ad = this.getOne(id);
        ad.likeCount = (ad.likeCount || 0) + 1;
        ad.updatedAt = new Date().toISOString();
        this.store.set(id, ad);
        console.log('[AUDIT] advertisement.like', { id, likeCount: ad.likeCount });
        return ad;
    }
    share(id) {
        const ad = this.getOne(id);
        ad.shareCount = (ad.shareCount || 0) + 1;
        ad.updatedAt = new Date().toISOString();
        this.store.set(id, ad);
        console.log('[AUDIT] advertisement.share', { id, shareCount: ad.shareCount });
        return ad;
    }
    listComments(id, page = 1, pageSize = 10) {
        const ad = this.getOne(id);
        const all = ad.comments || [];
        const start = (Number(page) - 1) * Number(pageSize);
        const items = all.slice(start, start + Number(pageSize));
        return { items, total: all.length, page: Number(page), pageSize: Number(pageSize) };
    }
    addComment(id, text, author) {
        if (!text || !text.trim())
            throw new common_1.NotFoundException('Comment text required');
        const ad = this.getOne(id);
        const comment = { id: (0, crypto_1.randomUUID)(), text: text.trim(), author, createdAt: new Date().toISOString() };
        ad.comments = [...(ad.comments || []), comment];
        ad.updatedAt = new Date().toISOString();
        this.store.set(id, ad);
        console.log('[AUDIT] advertisement.comment.add', { id, commentId: comment.id });
        return comment;
    }
    updateComment(id, commentId, text) {
        const ad = this.getOne(id);
        const list = ad.comments || [];
        const idx = list.findIndex(c => c.id === commentId);
        if (idx === -1)
            throw new common_1.NotFoundException('Comment not found');
        if (!text || !text.trim())
            throw new common_1.NotFoundException('Comment text required');
        list[idx] = Object.assign(Object.assign({}, list[idx]), { text: text.trim() });
        ad.comments = list;
        ad.updatedAt = new Date().toISOString();
        this.store.set(id, ad);
        console.log('[AUDIT] advertisement.comment.update', { id, commentId });
        return list[idx];
    }
    deleteComment(id, commentId) {
        const ad = this.getOne(id);
        const list = ad.comments || [];
        const idx = list.findIndex(c => c.id === commentId);
        if (idx === -1)
            throw new common_1.NotFoundException('Comment not found');
        list.splice(idx, 1);
        ad.comments = list;
        ad.updatedAt = new Date().toISOString();
        this.store.set(id, ad);
        console.log('[AUDIT] advertisement.comment.delete', { id, commentId });
        return { success: true };
    }
};
exports.AdvertisementsService = AdvertisementsService;
exports.AdvertisementsService = AdvertisementsService = __decorate([
    (0, common_1.Injectable)()
], AdvertisementsService);
//# sourceMappingURL=advertisements.service.js.map