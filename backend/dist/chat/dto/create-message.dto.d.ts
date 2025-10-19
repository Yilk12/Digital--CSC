export declare class CreateMessageDto {
    content: string;
    type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
    conversationId: string;
    replyToId?: string;
}
