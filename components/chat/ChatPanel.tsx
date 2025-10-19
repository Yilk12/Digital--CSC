"use client";

import React, { useEffect, useRef } from "react";
import { ArrowLeft, Bot, MessageCircle, Send } from "lucide-react";
import { ChatConversation, ChatMessage } from "@/app/lib/chat-api";
import { Badge } from "./Badge";

export function ChatHeader({ title, type, onBack }: { title: string; type: "GROUP" | "PRIVATE" | string; onBack?: () => void }) {
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
        style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
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

export function MessageList({ messages, currentUserId, isLoading }: { messages: ChatMessage[]; currentUserId: string; isLoading: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
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

export function ChatActions({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onNewChat} style={{ padding: "10px 12px", background: "#1565c0", border: "none", color: "white", borderRadius: 8, cursor: "pointer", fontSize: "0.9rem" }}>New Chat</button>
    </div>
  );
}

export function MessageInput({ value, onChange, onSend, isLoading }: { value: string; onChange: (v: string) => void; onSend: () => void | Promise<void>; isLoading: boolean }) {
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
            style={{ width: "100%", minHeight: 44, maxHeight: 120, padding: "12px 16px", border: "1px solid #ddd", borderRadius: 22, fontSize: "0.95rem", resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.4 }}
            rows={1}
          />
        </div>
        <button onClick={onSend} disabled={!value.trim() || isLoading} style={{ width: 44, height: 44, borderRadius: "50%", background: value.trim() && !isLoading ? "#1565c0" : "#ccc", border: "none", color: "white", cursor: value.trim() && !isLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }} aria-label="Send message">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

export default function ChatPanel({ conversation, messages, isLoading, onBack, onSend, inputMessage, setInputMessage, currentUserId }: { conversation: ChatConversation | null; messages: ChatMessage[]; isLoading: boolean; onBack?: () => void; onSend: () => void | Promise<void>; inputMessage: string; setInputMessage: (v: string) => void; currentUserId: string }) {
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

  const isGroup = conversation.type === "GROUP";
  const other = !isGroup ? (conversation.participants || [])[0] : undefined;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <ChatHeader title={conversation.name || (conversation.type === "GROUP" ? "Group Chat" : "Private Chat")} type={conversation.type} onBack={onBack} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 0" }}>
        <ChatActions onNewChat={() => { /* future hook */ }} />
        {!isGroup && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {other?.userType === "INTERNAL" && (<Badge bg="#e8f5e9" color="#1b5e20">🏢 Internal</Badge>)}
            {other?.userType === "EXTERNAL" && (<Badge bg="#e0f2fe" color="#0c4a6e">🌐 External</Badge>)}
            {other?.department && (<Badge bg="#fff7ed" color="#9a3412">🏢 {other.department}</Badge>)}
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
