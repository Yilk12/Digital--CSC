"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wifi, WifiOff, Users, Plus } from "lucide-react";
import { ChatConversation, ChatUser } from "@/app/lib/chat-api";
import { Badge } from "./Badge";
import SidebarWrapper from "@/app/components/sidebar/SidebarWrapper";
import { useLocalization } from "@/app/hooks/use-localization";

export type SidebarProps = {
  chats: ChatConversation[];
  selectedChatId?: string | null;
  onChatSelect: (chatId: string) => void;
  isConnected: boolean;
  onCreateNew: (userId: string) => void;
  availableUsers: ChatUser[];
  currentUserId?: string;
};

export function ChatSearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLocalization();
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e5e5", background: "#fafafa" }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("chat.search_placeholder")}
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

export function ChatList({ chats, selectedChatId, onChatSelect, currentUserId }: { chats: ChatConversation[]; selectedChatId?: string | null; onChatSelect: (chatId: string) => void; currentUserId?: string }) {
  const { t } = useLocalization();
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {chats.map((conversation) => {
        const isSelected = selectedChatId === conversation.id;
        const isGroup = conversation.type === "GROUP";
        const other = !isGroup ? (conversation.participants || []).find((p) => p.id !== currentUserId) : undefined;
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
                    {conversation.name || (isGroup ? t("chat.group_chat") : t("chat.private_chat"))}
                  </div>
                  {isGroup ? (
                    <Badge bg="#eef2ff" color="#3730a3">👥 {t("chat.badge.group")}</Badge>
                  ) : (
                    <>
                      <Badge bg="#ecfeff" color="#155e75">🔒 {t("chat.badge.private")}</Badge>
                      {other?.userType === "INTERNAL" && (
                        <Badge bg="#e8f5e9" color="#1b5e20">🏢 {t("chat.badge.internal")}</Badge>
                      )}
                      {other?.userType === "EXTERNAL" && (
                        <Badge bg="#e0f2fe" color="#0c4a6e">🌐 {t("chat.badge.external")}</Badge>
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

export default function Sidebar({ chats, selectedChatId, onChatSelect, isConnected, onCreateNew, availableUsers, currentUserId }: SidebarProps) {
  const { t } = useLocalization();
  const [search, setSearch] = useState("");
  const filtered = chats.filter((c) => (c.name || "").toLowerCase().includes(search.toLowerCase()));
  const onBackToSidebar = () => {
    // Default behavior: navigate to the main area/home
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };
  return (
    <SidebarWrapper onBackToSidebar={onBackToSidebar}>
      <div style={{ padding: 20, borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: "1.2rem", color: "#1565c0" }}>{t("chat.title")}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/plan" prefetch={false}
            style={{ background: "#0f766e", color: "white", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
            title="Plan"
          >
            Plan
          </Link>
          <button
            onClick={() => { if (availableUsers[0]) onCreateNew(availableUsers[0].id); }}
            style={{ background: "#1565c0", color: "white", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            title={t("chat.start_new")}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div style={{ padding: "12px 20px", background: isConnected ? "#e8f5e8" : "#ffeaea", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", gap: 8, fontSize: "0.9rem", color: isConnected ? "#2e7d32" : "#d32f2f" }}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        {isConnected ? t("chat.connected") : t("chat.disconnected")}
      </div>
      <ChatSearchBar value={search} onChange={setSearch} />
      <ChatList chats={filtered} selectedChatId={selectedChatId ?? null} onChatSelect={onChatSelect} currentUserId={currentUserId} />
    </SidebarWrapper>
  );
}
