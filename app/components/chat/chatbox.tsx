'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { 
  MessageCircle, 
  Send, 
  Users, 
  Building2, 
  X, 
  Minimize2, 
  Maximize2,
  Plus,
  Search
} from 'lucide-react';
import { cn } from '@/backend/lib/utils';

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

interface ChatboxProps {
  currentUser: User;
  departments: Array<{ id: string; name: string }>;
  defaultOpen?: boolean;
}

export default function Chatbox({ currentUser, departments, defaultOpen }: ChatboxProps) {
  const [isOpen, setIsOpen] = useState(!!defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [pages, setPages] = useState<Record<string, number>>({});
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [userCategory, setUserCategory] = useState<'INTERNAL' | 'EXTERNAL'>(currentUser.userType);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState<Record<string, string[]>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen) return;
    if (socket) return;
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'}/chat`, {
        auth: {
          userId: currentUser.id,
          userType: currentUser.userType,
          department: currentUser.department,
        },
      });

      newSocket.on('messageDeleted', ({ messageId, conversationId }: { messageId: string; conversationId: string }) => {
        setMessages(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map(m => m.id === messageId ? { ...m, content: '[deleted]' } : m),
        }));
      });

      newSocket.on('messagesRead', ({ conversationId, userId, count }: { conversationId: string; userId: string; count: number }) => {
        // Optionally update unread counters when others read; for now, decrement local unread if present
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      });

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        fetchConversations();
        fetchAvailableUsers();
      });

      newSocket.on('newMessage', (message: Message) => {
        setMessages(prev => ({
          ...prev,
          [message.conversationId]: [...(prev[message.conversationId] || []), message],
        }));
        
        // Update conversation last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === message.conversationId 
              ? { ...conv, lastMessage: message }
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
        setIsTyping(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []).filter(id => id !== userId), userId],
        }));
      });

      newSocket.on('userStoppedTyping', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
        setIsTyping(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter(id => id !== userId),
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    // Only run when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch available users
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/chat/users/available', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setAvailableUsers(data);
    } catch (error) {
      console.error('Failed to fetch available users:', error);
    }
  };

  // Load conversation messages
  const loadConversationMessages = async (conversationId: string, page: number = 1) => {
    // If already loaded first page and requesting first page again, skip
    if (messages[conversationId] && page === 1) return;

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages?page=${page}&limit=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data: Message[] = await response.json();
      setMessages(prev => ({
        ...prev,
        [conversationId]: page === 1 ? data : [...data, ...(prev[conversationId] || [])],
      }));
      setPages(prev => ({ ...prev, [conversationId]: page }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  // Send message
  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeConversation || !socket) return;

    let contentToSend = newMessage;
    let type: Message['type'] = 'TEXT';

    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      type = isImage ? 'IMAGE' : 'FILE';
      // Basic base64 data-url for demo; in production, upload to storage and send URL
      const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      try {
        contentToSend = await toBase64(selectedFile);
      } catch (e) {
        console.error('Failed to read file', e);
        return;
      }
    }

    socket.emit('sendMessage', {
      content: contentToSend,
      type,
      conversationId: activeConversation,
    });

    setNewMessage('');
    setSelectedFile(null);
    setShowEmoji(false);
    stopTyping();
  };

  // Start private conversation
  const startPrivateConversation = async (otherUserId: string) => {
    try {
      const response = await fetch('/api/chat/conversations/private', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ otherUserId }),
      });
      const conversation = await response.json();
      
      setConversations(prev => {
        const exists = prev.find(c => c.id === conversation.id);
        return exists ? prev : [conversation, ...prev];
      });
      
      setActiveConversation(conversation.id);
      loadConversationMessages(conversation.id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  // Create group conversation
  const createGroupConversation = async (participantIds: string[], name: string, departmentId?: string) => {
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
      const conversation = await response.json();
      
      setConversations(prev => [conversation, ...prev]);
      setActiveConversation(conversation.id);
      loadConversationMessages(conversation.id);
    } catch (error) {
      console.error('Failed to create group conversation:', error);
    }
  };

  // Handle typing
  const handleTyping = () => {
    if (!socket || !activeConversation) return;

    socket.emit('startTyping', { conversationId: activeConversation });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (!socket || !activeConversation) return;
    socket.emit('stopTyping', { conversationId: activeConversation });
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation]);

  // Filter users based on search and department
  const filteredUsers = availableUsers.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (userCategory === 'EXTERNAL') {
      return matchesSearch && user.userType === 'INTERNAL';
    }
    
    if (selectedDepartment !== 'ALL') {
      return matchesSearch && user.department === selectedDepartment;
    }
    
    return matchesSearch;
  });

  const activeConv = conversations.find(c => c.id === activeConversation);
  const activeMessages = activeConversation ? messages[activeConversation] || [] : [];

  // When switching/opening a conversation: join room, load messages, and mark as read
  useEffect(() => {
    if (!activeConversation) return;
    if (!socket) return;
    socket.emit('joinConversation', { conversationId: activeConversation });
    // load first page if not loaded
    if (!messages[activeConversation] || messages[activeConversation].length === 0) {
      loadConversationMessages(activeConversation, 1);
    }
    markAsRead(activeConversation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, socket]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 bg-white border-green-200 shadow-2xl z-50 transition-all duration-300",
      isMinimized ? "h-14" : "h-[600px]"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white border-b border-green-100">
        <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 text-green-600 hover:text-green-800"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 h-[calc(600px-80px)] flex flex-col">
          <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-green-50">
              <TabsTrigger value="conversations" className="data-[state=active]:bg-white data-[state=active]:text-green-800">
                Conversations
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-green-800">
                New Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="flex-1 flex flex-col mt-0">
              {activeConversation ? (
                <div className="flex-1 flex flex-col">
                  {/* Conversation Header */}
                  <div className="p-3 border-b border-green-100 bg-green-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setActiveConversation(null)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div>
                          <h3 className="font-medium text-green-800">
                            {activeConv?.name || 
                             activeConv?.participants
                               .filter(p => p.id !== currentUser.id)
                               .map(p => `${p.firstName} ${p.lastName}`)
                               .join(', ')}
                          </h3>
                          <p className="text-xs text-green-600">
                            {activeConv?.type === 'PRIVATE' ? 'Private' : 
                             activeConv?.type === 'GROUP' ? 'Group' : 'Department'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeConv?.type === 'PRIVATE' && (() => {
                          const other = activeConv?.participants.find(p => p.id !== currentUser.id);
                          return other ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-700"
                              onClick={() => {
                                if (typeof window !== 'undefined') {
                                  window.location.href = `/reporting?target_type=user&target_id=${encodeURIComponent(other.id)}`;
                                }
                              }}
                            >
                              Report user
                            </Button>
                          ) : null;
                        })()}
                        {(activeConv?.type === 'GROUP' || activeConv?.type === 'DEPARTMENT') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-700"
                            onClick={() => {
                              if (typeof window !== 'undefined' && activeConv) {
                                window.location.href = `/reporting?target_type=group&target_id=${encodeURIComponent(activeConv.id)}`;
                              }
                            }}
                          >
                            Report group
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-3">
                    <div className="space-y-3">
                      {/* Load older messages */}
                      {activeConversation && (
                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadConversationMessages(activeConversation, (pages[activeConversation] || 1) + 1)}
                            className="mb-2"
                          >
                            Load older messages
                          </Button>
                        </div>
                      )}
                      {activeMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-2",
                            message.senderId === currentUser.id ? "justify-end" : "justify-start"
                          )}
                        >
                          {message.senderId !== currentUser.id && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                                {message.sender.firstName[0]}{message.sender.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-3 text-sm",
                              message.senderId === currentUser.id
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-800"
                            )}
                          >
                            {message.senderId !== currentUser.id && (
                              <p className="text-xs opacity-70 mb-1">
                                {message.sender.firstName} {message.sender.lastName}
                              </p>
                            )}
                            <p>{message.content}</p>
                            <p className={cn(
                              "text-xs mt-1 opacity-70",
                              message.senderId === currentUser.id ? "text-green-100" : "text-gray-500"
                            )}>
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                            <div className={cn(
                              "text-[11px] mt-1",
                              message.senderId === currentUser.id ? "text-green-100" : "text-gray-500"
                            )}>
                              <button
                                className="underline"
                                onClick={() => {
                                  if (typeof window !== 'undefined') {
                                    window.location.href = `/reporting?target_type=message&target_id=${encodeURIComponent(message.id)}`;
                                  }
                                }}
                              >
                                Report
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Typing indicators */}
                      {(isTyping[activeConversation] || []).length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                          <span>
                            {isTyping[activeConversation]?.length === 1 
                              ? 'Someone is typing...' 
                              : 'Multiple people are typing...'}
                          </span>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-3 border-t border-green-100">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setShowEmoji(v => !v)}>😀</Button>
                          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                            <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                            <span className="px-3 py-1 border rounded">Attach</span>
                            {selectedFile && (<span className="text-xs text-gray-600">{selectedFile.name}</span>)}
                          </label>
                        </div>
                        {showEmoji && (
                          <div className="p-2 border rounded mb-2 max-h-28 overflow-auto bg-white">
                            {['😀','😁','😂','🤣','😊','😍','😘','🤔','👍','👏','🙏','🎉','💡','🔥','❤️'].map(em => (
                              <button key={em} className="p-1" onClick={() => setNewMessage(prev => prev + em)}>{em}</button>
                            ))}
                          </div>
                        )}
                        <Input
                          value={newMessage}
                          onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 border-green-200 focus:border-green-400"
                        />
                      </div>
                      <Button
                        onClick={sendMessage}
                        size="icon"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!(newMessage.trim() || selectedFile)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-2">
                    {conversations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No conversations yet</p>
                        <p className="text-sm">Start a new chat to get started</p>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => {
                            setActiveConversation(conversation.id);
                            loadConversationMessages(conversation.id);
                          }}
                          className="p-3 rounded-lg border border-green-100 hover:bg-green-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-green-100 text-green-800">
                                  {conversation.type === 'PRIVATE' 
                                    ? (() => {
                                        const otherParticipant = conversation.participants
                                          .find(p => p.id !== currentUser.id);
                                        return otherParticipant 
                                          ? `${otherParticipant.firstName?.[0] || ''}${otherParticipant.lastName?.[0] || ''}`
                                          : '?';
                                      })()
                                    : conversation.type === 'GROUP' 
                                    ? <Users className="h-5 w-5" />
                                    : <Building2 className="h-5 w-5" />
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm text-green-800">
                                  {conversation.name || 
                                   conversation.participants
                                     .filter(p => p.id !== currentUser.id)
                                     .map(p => `${p.firstName} ${p.lastName}`)
                                     .join(', ')}
                                </h4>
                                {conversation.lastMessage && (
                                  <p className="text-xs text-gray-600 truncate">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                            {conversation.unreadCount && conversation.unreadCount > 0 && (
                              <Badge className="bg-green-600 text-white">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="users" className="flex-1 flex flex-col mt-0">
              <div className="p-3 space-y-3">
                {/* User Category Selection */}
                <div>
                  <label className="text-sm font-medium text-green-800 mb-2 block">
                    Category
                  </label>
                  <Select value={userCategory} onValueChange={(value: 'INTERNAL' | 'EXTERNAL') => setUserCategory(value)}>
                    <SelectTrigger className="border-green-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL">Internal</SelectItem>
                      <SelectItem value="EXTERNAL">External Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Department Selection - Only for Internal */}
                {userCategory === 'INTERNAL' && (
                  <div>
                    <label className="text-sm font-medium text-green-800 mb-2 block">
                      Department
                    </label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="border-green-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 border-green-200 focus:border-green-400"
                  />
                </div>
              </div>

              {/* Users List */}
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => startPrivateConversation(user.id)}
                      className="p-3 rounded-lg border border-green-100 hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-green-100 text-green-800">
                            {user.firstName[0]}{user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-green-800">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-xs text-gray-600">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-green-600">{user.department}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.userType === 'INTERNAL' ? 'default' : 'secondary'}>
                            {user.userType}
                          </Badge>
                          {user.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No users found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}
