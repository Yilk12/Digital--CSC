export declare class CreateConversationDto {
    name?: string;
    type: 'PRIVATE' | 'GROUP' | 'DEPARTMENT';
    departmentId?: string;
    participantIds: string[];
}
