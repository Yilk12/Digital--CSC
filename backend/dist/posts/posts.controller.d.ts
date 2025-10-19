import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
export declare class PostsController {
    private readonly postsService;
    constructor(postsService: PostsService);
    create(dto: CreatePostDto): Promise<any>;
    findAll(authorId?: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdatePostDto): Promise<any>;
    remove(id: string): Promise<{
        id: string;
        deleted: boolean;
    }>;
}
