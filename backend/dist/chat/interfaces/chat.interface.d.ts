export interface ChatUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: 'INTERNAL' | 'EXTERNAL';
    department?: string;
    isOnline?: boolean;
}
export interface ChatMessage {
    id: string;
    content: string;
    type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
    senderId: string;
    sender: ChatUser;
    conversationId: string;
    replyToId?: string;
    isEdited: boolean;
    readCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ChatConversation {
    id: string;
    name?: string;
    type: 'PRIVATE' | 'GROUP' | 'DEPARTMENT';
    departmentId?: string;
    participants: ChatUser[];
    lastMessage?: ChatMessage;
    unreadCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface OnlineUser {
    userId: string;
    socketId: string;
    userType: 'INTERNAL' | 'EXTERNAL';
    department?: string;
}
