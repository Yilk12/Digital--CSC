import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'INTERNAL' | 'EXTERNAL';
  department?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  content: string;
  type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
  senderId: string;
  sender: User;
  conversationId: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  name?: string;
  type: 'PRIVATE' | 'GROUP' | 'DEPARTMENT';
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
  departmentId?: string;
}

interface UseChatOptions {
  currentUser: User;
  autoConnect?: boolean;
}

export function useChat({ currentUser, autoConnect = false }: UseChatOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // Connect to socket
  const connect = useCallback(() => {
    if (socket?.connected) return;

    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/chat`, {
      auth: {
        userId: currentUser.id,
        userType: currentUser.userType,
        department: currentUser.department,
      },
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    newSocket.on('newMessage', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [message.conversationId]: [...(prev[message.conversationId] || []), message],
      }));
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, lastMessage: message, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        )
      );
    });

    newSocket.on('userOnline', (user: User) => {
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), { ...user, isOnline: true }]);
    });

    newSocket.on('userOffline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
    });

    newSocket.on('userTyping', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []).filter(id => id !== userId), userId],
      }));
    });

    newSocket.on('userStoppedTyping', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(id => id !== userId),
      }));
    });

    newSocket.on('conversationMessages', ({ conversationId, messages: convMessages }: { conversationId: string; messages: Message[] }) => {
      setMessages(prev => ({ ...prev, [conversationId]: convMessages }));
    });

    setSocket(newSocket);
  }, [currentUser]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  // Send message
  const sendMessage = useCallback((conversationId: string, content: string, type: 'TEXT' | 'FILE' | 'IMAGE' = 'TEXT') => {
    if (!socket || !content.trim()) return;

    socket.emit('sendMessage', {
      content,
      type,
      conversationId,
    });
  }, [socket]);

  // Join conversation
  const joinConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('joinConversation', { conversationId });
  }, [socket]);

  // Leave conversation
  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('leaveConversation', { conversationId });
  }, [socket]);

  // Start typing
  const startTyping = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('startTyping', { conversationId });
  }, [socket]);

  // Stop typing
  const stopTyping = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('stopTyping', { conversationId });
  }, [socket]);

  // Get online users
  const getOnlineUsers = useCallback(() => {
    if (!socket) return;
    socket.emit('getOnlineUsers');
  }, [socket]);

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, []);

  // Load conversation messages from API
  const loadMessages = useCallback(async (conversationId: string, page = 1, limit = 50) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => ({ ...prev, [conversationId]: data }));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // Create private conversation
  const createPrivateConversation = useCallback(async (otherUserId: string) => {
    try {
      const response = await fetch('/api/chat/conversations/private', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      if (response.ok) {
        const conversation = await response.json();
        setConversations(prev => {
          const exists = prev.find(c => c.id === conversation.id);
          return exists ? prev : [conversation, ...prev];
        });
        return conversation;
      }
    } catch (error) {
      console.error('Failed to create private conversation:', error);
    }
  }, []);

  // Create group conversation
  const createGroupConversation = useCallback(async (
    participantIds: string[], 
    name: string, 
    departmentId?: string
  ) => {
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          name,
          type: departmentId ? 'DEPARTMENT' : 'GROUP',
          departmentId,
          participantIds,
        }),
      });
      if (response.ok) {
        const conversation = await response.json();
        setConversations(prev => [conversation, ...prev]);
        return conversation;
      }
    } catch (error) {
      console.error('Failed to create group conversation:', error);
    }
  }, []);

  // Mark conversation as read
  const markAsRead = useCallback((conversationId: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  }, []);

  // Auto-connect if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // Connection state
    socket,
    isConnected,
    connect,
    disconnect,

    // Data
    conversations,
    messages,
    onlineUsers,
    typingUsers,

    // Actions
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    getOnlineUsers,
    fetchConversations,
    loadMessages,
    createPrivateConversation,
    createGroupConversation,
    markAsRead,
  };
}
