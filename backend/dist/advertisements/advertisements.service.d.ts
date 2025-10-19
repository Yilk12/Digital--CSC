import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';
export type Advertisement = {
    id: string;
    title: string;
    description: string;
    category: string;
    priority?: 'Low' | 'Medium' | 'High';
    publishDate?: string;
    expiryDate?: string;
    isPublished?: boolean;
    isUrgent?: boolean;
    attachments?: {
        id: string;
        name: string;
        url: string;
        type?: string;
        size?: number;
    }[];
    createdAt: string;
    updatedAt: string;
    createdBy?: {
        id?: string;
        name?: string;
    };
    likeCount?: number;
    shareCount?: number;
    comments?: Array<{
        id: string;
        text: string;
        author?: string;
        createdAt: string;
    }>;
};
export declare class AdvertisementsService {
    private readonly store;
    list(params: {
        q?: string;
        category?: string;
        sort?: 'newest' | 'oldest';
        page: number;
        pageSize: number;
    }): {
        items: Advertisement[];
        total: number;
        page: number;
        pageSize: number;
    };
    getOne(id: string): Advertisement;
    create(dto: CreateAdvertisementDto): Advertisement;
    update(id: string, dto: UpdateAdvertisementDto): Advertisement;
    remove(id: string): {
        success: boolean;
    };
    addAttachments(id: string, files: Express.Multer.File[]): Advertisement;
    like(id: string): Advertisement;
    share(id: string): Advertisement;
    listComments(id: string, page?: number, pageSize?: number): {
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
    addComment(id: string, text: string, author?: string): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        text: string;
        author: string | undefined;
        createdAt: string;
    };
    updateComment(id: string, commentId: string, text: string): {
        id: string;
        text: string;
        author?: string;
        createdAt: string;
    };
    deleteComment(id: string, commentId: string): {
        success: boolean;
    };
}
