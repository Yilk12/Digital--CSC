import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
export declare class AdvertisementsController {
    private readonly service;
    constructor(service: AdvertisementsService);
    list(q?: string, category?: string, sort?: 'newest' | 'oldest', page?: number, pageSize?: number): {
        items: import("./advertisements.service").Advertisement[];
        total: number;
        page: number;
        pageSize: number;
    };
    getOne(id: string): import("./advertisements.service").Advertisement;
    create(dto: CreateAdvertisementDto): import("./advertisements.service").Advertisement;
    update(id: string, dto: UpdateAdvertisementDto): import("./advertisements.service").Advertisement;
    remove(id: string): {
        success: boolean;
    };
    upload(id: string, files: Express.Multer.File[]): import("./advertisements.service").Advertisement;
    like(id: string): import("./advertisements.service").Advertisement;
    share(id: string): import("./advertisements.service").Advertisement;
    comments(id: string, page?: number, pageSize?: number): {
        items: {
            id: string;
            text: string;
            author?: string;
            createdAt: string;
        }[];
        total: number;
        page: number;
        pageSize: number;
    };
    addComment(id: string, body: {
        text: string;
        author?: string;
    }): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        author: string | undefined;
        createdAt: string;
    };
    updateComment(id: string, commentId: string, body: {
        text: string;
    }): {
        id: string;
        text: string;
        author?: string;
        createdAt: string;
    };
    deleteComment(id: string, commentId: string): {
        success: boolean;
    };
}
