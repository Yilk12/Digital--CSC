import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
export declare class PostsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePostDto): Promise<any>;
    findAll(params: {
        authorId?: string;
    }): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdatePostDto): Promise<any>;
    remove(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
    private ensureExists;
}
