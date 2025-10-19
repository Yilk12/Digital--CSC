"use client";

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, ChatUser } from '@/app/lib/chat-api';

interface UseChatWebSocketProps {
  conversationId?: string;
  userId?: string;
  onNewMessage?: (message: ChatMessage) => void;
  onUserOnline?: (user: ChatUser) => void;
  onUserOffline?: (userId: string) => void;
  onError?: (error: string) => void;
}

export const useChatWebSocket = ({
  conversationId,
  userId,
  onNewMessage,
  onUserOnline,
  onUserOffline,
  onError,
}: UseChatWebSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize socket connection with auth handshake (ChatGateway reads handshake.auth)
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/chat`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: {
        userId,
      },
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // No need to emit a separate authenticate event; handshake carries userId
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      onError?.(error.message);
    });

    // Chat events
    newSocket.on('newMessage', (message: ChatMessage) => {
      onNewMessage?.(message);
    });

    newSocket.on('userOnline', (user: ChatUser) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.id === user.id);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
      onUserOnline?.(user);
    });

    newSocket.on('userOffline', (userId: string) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userId));
      onUserOffline?.(userId);
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Chat error:', error);
      onError?.(error.message);
    });

    // Join conversation if provided
    if (conversationId) {
      newSocket.emit('joinConversation', { conversationId });
    }

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [userId, conversationId, onNewMessage, onUserOnline, onUserOffline, onError]);

  // Join conversation
  const joinConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('joinConversation', { conversationId });
    }
  };

  // Leave conversation
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leaveConversation', { conversationId });
    }
  };

  // Send message
  const sendMessage = (messageData: {
    content: string;
    type: 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM';
    conversationId: string;
    replyToId?: string;
  }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('sendMessage', messageData);
    } else {
      onError?.('Not connected to chat server');
    }
  };

  return {
    socket,
    isConnected,
    onlineUsers,
    joinConversation,
    leaveConversation,
    sendMessage,
  };
};
