"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, User, Bot, Users, Plus, Wifi, WifiOff, ArrowLeft, Lock, Globe } from "lucide-react";
import { chatApi, ChatMessage, ChatConversation, ChatUser } from "@/app/lib/chat-api";
import { useChatWebSocket } from "@/hooks/use-chat-websocket";
import SidebarCmp from "@/components/chat/Sidebar";
import ChatPanelCmp from "@/components/chat/ChatPanel";
import { getCurrentUserId, decodeJwt } from "@/app/lib/auth";
import { API_BASE_URL } from "@/app/lib/api";

// ------------------------------
// Sidebar Components
// ------------------------------

type SidebarProps = {
  chats: ChatConversation[];
  selectedChatId?: string | null;
  onChatSelect: (chatId: string) => void;
  isConnected: boolean;
  onCreateNew: (userId: string) => void;
  availableUsers: ChatUser[];
  currentUserId: string;
};

type ChatSearchBarProps = {
  value: string;
  onChange: (v: string) => void;
};

function ChatSearchBar({ value, onChange }: ChatSearchBarProps) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chats..."
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          outline: "none",
          fontSize: "0.95rem",
          background: "white",
        }}
      />
    </div>
  );
}

type ChatListProps = {
  chats: ChatConversation[];
  selectedChatId?: string | null;
  onChatSelect: (chatId: string) => void;
};

function Badge({ children, bg = "#e5e7eb", color = "#374151" }: { children: React.ReactNode; bg?: string; color?: string }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "2px 8px",
      borderRadius: 999,
      fontSize: "0.7rem",
      background: bg,
      color,
      fontWeight: 600,
      border: "1px solid rgba(0,0,0,0.06)",
    }}>{children}</span>
  );
}

function ChatList({ chats, selectedChatId, onChatSelect }: ChatListProps) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {chats.map((conversation) => {
        const isSelected = selectedChatId === conversation.id;
        const isGroup = conversation.type === "GROUP";
        // For private chats, find the other participant for badges
        const other = !isGroup
          ? (conversation.participants || []).find((p) => p.id !== (conversation as any).currentUserId)
          : undefined;
        return (
          <div
            key={conversation.id}
            onClick={() => onChatSelect(conversation.id)}
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #f0f0f0",
              cursor: "pointer",
              background: isSelected ? "#e3f2fd" : "transparent",
              transition: "background 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#1565c0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "0.9rem",
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {isGroup ? <Users size={16} /> : (conversation.name?.[0] ?? "U")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#333",
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {conversation.name || (isGroup ? "Group Chat" : "Private Chat")}
                  </div>
                  {isGroup ? (
                    <Badge bg="#eef2ff" color="#3730a3">👥 Group</Badge>
                  ) : (
                    <>
                      <Badge bg="#ecfeff" color="#155e75">🔒 Private</Badge>
                      {other?.userType === "INTERNAL" && (
                        <Badge bg="#e8f5e9" color="#1b5e20">🏢 Internal</Badge>
                      )}
                      {other?.userType === "EXTERNAL" && (
                        <Badge bg="#e0f2fe" color="#0c4a6e">🌐 External</Badge>
                      )}
                      {other?.department && (
                        <Badge bg="#fff7ed" color="#9a3412">🏢 {other.department}</Badge>
                      )}
                    </>
                  )}
                </div>
                {conversation.lastMessage && (
                  <div style={{
                    fontSize: "0.8rem",
                    color: "#666",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {conversation.lastMessage.content}
                  </div>
                )}
              </div>
              {conversation.unreadCount && conversation.unreadCount > 0 && (
                <div style={{
                  background: "#f44336",
                  color: "white",
                  borderRadius: "50%",
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}>
                  {conversation.unreadCount}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Sidebar({ chats, selectedChatId, onChatSelect, isConnected, onCreateNew, availableUsers, currentUserId }: SidebarProps) {
  const [search, setSearch] = useState("");
  const filtered = chats.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div style={{
      width: 300,
      background: "#fff",
      border: "1px solid #e5e5e5",
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    }}>
      {/* Header */}
      <div style={{
        padding: 20,
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1565c0" }}>Conversations</h2>
        <button
          onClick={() => {
            if (availableUsers[0]) onCreateNew(availableUsers[0].id);
          }}
          style={{
            background: "#1565c0",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Start new chat"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Connection Status */}
      <div style={{
        padding: "12px 20px",
        background: isConnected ? "#e8f5e8" : "#ffeaea",
        borderBottom: "1px solid #e5e5e5",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.9rem",
        color: isConnected ? "#2e7d32" : "#d32f2f",
      }}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      <ChatSearchBar value={search} onChange={setSearch} />
      <ChatList chats={filtered} selectedChatId={selectedChatId ?? null} onChatSelect={onChatSelect} />
    </div>
  );
}

// ------------------------------
// Chat Panel Components
// ------------------------------

type ChatHeaderProps = {
  title: string;
  type: "GROUP" | "PRIVATE" | string;
  onBack?: () => void;
};

function ChatHeader({ title, type, onBack }: ChatHeaderProps) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1565c0 0%, #43a047 100%)",
      color: "white",
      padding: "20px 24px",
      borderRadius: "12px 12px 0 0",
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
    }}>
      <button
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
        }}
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>
      <MessageCircle size={24} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>{title}</h1>
        {type === "GROUP" ? (
          <Badge bg="#eef2ff" color="#3730a3">👥 Group</Badge>
        ) : (
          <Badge bg="#ecfeff" color="#155e75">🔒 Private</Badge>
        )}
      </div>
    </div>
  );
}

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
};

function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div style={{
      flex: 1,
      overflowY: "auto",
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      {messages.map((message) => {
        const isCurrentUser = message.senderId === currentUserId;
        return (
          <div key={message.id} style={{ display: "flex", justifyContent: isCurrentUser ? "flex-end" : "flex-start", alignItems: "flex-start", gap: 12 }}>
            {!isCurrentUser && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1565c0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white", fontSize: "0.8rem", fontWeight: 600 }}>
                {message.sender.firstName?.[0] || "U"}
              </div>
            )}
            <div style={{ maxWidth: "70%", background: isCurrentUser ? "#1565c0" : "#f5f5f5", color: isCurrentUser ? "white" : "#333", padding: "12px 16px", borderRadius: isCurrentUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", fontSize: "0.95rem", lineHeight: 1.4, wordWrap: "break-word" }}>
              {!isCurrentUser && (
                <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 4, opacity: 0.8 }}>
                  {message.sender.firstName} {message.sender.lastName}
                </div>
              )}
              {message.content}
              <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: 4, textAlign: isCurrentUser ? "right" : "left" }}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            {isCurrentUser && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#43a047", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "white", fontSize: "0.8rem", fontWeight: 600 }}>
                {message.sender.firstName?.[0] || "U"}
              </div>
            )}
          </div>
        );
      })}

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1565c0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bot size={16} color="white" />
          </div>
          <div style={{ background: "#f5f5f5", padding: "12px 16px", borderRadius: "18px 18px 18px 4px", fontSize: "0.95rem" }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1565c0", animation: "pulse 1.4s ease-in-out infinite both" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1565c0", animation: "pulse 1.4s ease-in-out infinite both", animationDelay: "0.2s" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1565c0", animation: "pulse 1.4s ease-in-out infinite both", animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}

type ChatActionsProps = {
  onNewChat: () => void;
};

function ChatActions({ onNewChat }: ChatActionsProps) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={onNewChat}
        style={{
          padding: "10px 12px",
          background: "#1565c0",
          border: "none",
          color: "white",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        New Chat
      </button>
    </div>
  );
}

type MessageInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
};

function MessageInput({ value, onChange, onSend, isLoading }: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  return (
    <div style={{ borderTop: "1px solid #e5e5e5", padding: 20, background: "#fafafa" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            style={{
              width: "100%",
              minHeight: 44,
              maxHeight: 120,
              padding: "12px 16px",
              border: "1px solid #ddd",
              borderRadius: 22,
              fontSize: "0.95rem",
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              lineHeight: 1.4,
            }}
            rows={1}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: value.trim() && !isLoading ? "#1565c0" : "#ccc",
            border: "none",
            color: "white",
            cursor: value.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
          }}
          aria-label="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

type ChatPanelProps = {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  isLoading: boolean;
  onBack?: () => void;
  onSend: () => void;
  inputMessage: string;
  setInputMessage: (v: string) => void;
  currentUserId: string;
};

function ChatPanel({ conversation, messages, isLoading, onBack, onSend, inputMessage, setInputMessage, currentUserId }: ChatPanelProps) {
  if (!conversation) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, color: "#666" }}>
          <div style={{ textAlign: "center" }}>
            <MessageCircle size={48} color="#ccc" style={{ marginBottom: 16 }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#999" }}>Select a conversation</h3>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>Choose a conversation from the sidebar to start chatting</p>
          </div>
        </div>
      </div>
    );
  }

  // Derive other participant for PRIVATE chats to show badges
  const isGroup = conversation.type === "GROUP";
  const other = !isGroup ? (conversation.participants || [])[0] : undefined;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ChatHeader title={conversation.name || (conversation.type === "GROUP" ? "Group Chat" : "Private Chat")} type={conversation.type} onBack={onBack} />
      {/* Optional quick actions bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 0" }}>
        <ChatActions onNewChat={() => { /* hook for future actions */ }} />
        {!isGroup && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {other?.userType === "INTERNAL" && (
              <Badge bg="#e8f5e9" color="#1b5e20">🏢 Internal</Badge>
            )}
            {other?.userType === "EXTERNAL" && (
              <Badge bg="#e0f2fe" color="#0c4a6e">🌐 External</Badge>
            )}
            {other?.department && (
              <Badge bg="#fff7ed" color="#9a3412">🏢 {other.department}</Badge>
            )}
          </div>
        )}
      </div>
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: "0 0 12px 12px", height: 600, display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <MessageList messages={messages} currentUserId={currentUserId} isLoading={isLoading} />
        <MessageInput value={inputMessage} onChange={setInputMessage} onSend={onSend} isLoading={isLoading} />
      </div>
    </div>
  );
}

// ------------------------------
// Page Component
// ------------------------------

export default function ChatPage() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>(getCurrentUserId() || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure a session exists: if not logged in, create a guest session and store token
  useEffect(() => {
    const ensureGuestSession = async () => {
      try {
        const existing = getCurrentUserId();
        if (existing) {
          setCurrentUserId(existing);
          return;
        }
        const res = await fetch(`${API_BASE_URL}/auth/guest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Guest create failed: ${res.status}`);
        const data = await res.json();
        const token: string | undefined = data?.access_token;
        if (token) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("accessToken", token);
          }
          const decoded = decodeJwt(token);
          const id = (decoded?.id as string) || (decoded?.userId as string) || (decoded?.sub as string) || "";
          setCurrentUserId(id);
        }
      } catch (e: any) {
        console.error("Failed to initialize guest session", e);
        setError("Unable to initialize chat session. Please try again later.");
      } finally {
        setInitializing(false);
      }
    };

    ensureGuestSession();
  }, []);

  // WebSocket integration
  const { isConnected, onlineUsers, sendMessage: sendWebSocketMessage } = useChatWebSocket({
    conversationId: currentConversation?.id,
    userId: currentUserId,
    onNewMessage: (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
    },
    onError: (error: string) => {
      setError(error);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on component mount (only when we have a userId)
  useEffect(() => {
    if (!currentUserId) return;
    loadConversations();
    loadAvailableUsers();
  }, [currentUserId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const data = await chatApi.getConversations();
      setConversations(data);
      if (data.length > 0 && !currentConversation) {
        setCurrentConversation(data[0]);
      }
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
      const msg = String(error?.message || "");
      if (msg.includes("401")) {
        setError("Failed to load conversations (unauthorized).");
      } else if (msg.includes("404") || msg.includes("ECONNREFUSED")) {
        setError("Failed to load conversations. Ensure the backend is running and NEXT_PUBLIC_API_URL is set.");
      } else {
        setError("Failed to load conversations");
      }
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const data = await chatApi.getConversationMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const users = await chatApi.getAvailableUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation) return;

    const messageContent = inputMessage.trim();
    setInputMessage("");

    try {
      // Send via WebSocket for real-time delivery
      sendWebSocketMessage({
        content: messageContent,
        type: "TEXT",
        conversationId: currentConversation.id,
      });

      // Also send via REST API as backup
      await chatApi.sendMessage({
        content: messageContent,
        type: "TEXT",
        conversationId: currentConversation.id,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setError("Failed to send message");
    }
  };

  const createNewConversation = async (userId: string) => {
    try {
      const conversation = await chatApi.findOrCreatePrivateConversation(userId);
      setConversations((prev) => [conversation, ...prev]);
      setCurrentConversation(conversation);
      setShowNewChat(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
      setError("Failed to create conversation");
    }
  };

  // If initializing guest/session, show a lightweight loader
  if (initializing || !currentUserId) {
    return (
      <div style={{ width: "100%", maxWidth: 800, margin: "0 auto", padding: 24, minHeight: "calc(100vh - 200px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, padding: 24, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxWidth: 520 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8, color: "#1565c0" }}>Preparing chat…</h2>
          <p style={{ marginTop: 0, marginBottom: 0, color: "#555" }}>Setting up a guest session.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: 24, minHeight: "calc(100vh - 200px)", display: "flex", gap: 16 }}>
      {/* Sidebar */}
      <SidebarCmp
        chats={conversations}
        selectedChatId={currentConversation?.id ?? null}
        onChatSelect={(id) => setCurrentConversation(conversations.find((c) => c.id === id) ?? null)}
        isConnected={isConnected}
        onCreateNew={createNewConversation}
        availableUsers={availableUsers}
        currentUserId={currentUserId}
      />

      {/* Chat Panel */}
      <ChatPanelCmp
        conversation={currentConversation}
        messages={messages}
        isLoading={isLoading}
        onBack={() => setCurrentConversation(null)}
        onSend={handleSendMessage}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        currentUserId={currentUserId}
      />

      {/* Error Display */}
      {error && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "#f44336", color: "white", padding: "12px 16px", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "1.2rem" }}>×</button>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
