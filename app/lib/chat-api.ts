import { apiGet, apiPost } from './api';

// Types based on backend interfaces
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

export interface CreateMessageDto {
  content: string;
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
  conversationId: string;
  replyToId?: string;
}

export interface CreateConversationDto {
  name?: string;
  type: 'PRIVATE' | 'GROUP' | 'DEPARTMENT';
  departmentId?: string;
  participantIds: string[];
}

// Chat API functions
export const chatApi = {
  // Get user conversations
  getConversations: (): Promise<ChatConversation[]> => {
    return apiGet<ChatConversation[]>('/chat/conversations');
  },

  // Create a new conversation
  createConversation: (data: CreateConversationDto): Promise<ChatConversation> => {
    return apiPost<ChatConversation>('/chat/conversations', data);
  },

  // Get messages for a conversation (backend returns ChatMessage[])
  getConversationMessages: (
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ChatMessage[]> => {
    return apiGet<ChatMessage[]>(`/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  },

  // Send a message
  sendMessage: (data: CreateMessageDto): Promise<ChatMessage> => {
    return apiPost<ChatMessage>('/chat/messages', data);
  },

  // Get available users for chat
  getAvailableUsers: (): Promise<ChatUser[]> => {
    return apiGet<ChatUser[]>('/chat/users/available');
  },

  // Find or create private conversation
  findOrCreatePrivateConversation: (otherUserId: string): Promise<ChatConversation> => {
    return apiPost<ChatConversation>('/chat/conversations/private', { otherUserId });
  },
};
