"use client";
import React from "react";

export function Badge({ children, bg = "#e5e7eb", color = "#374151" }: { children: React.ReactNode; bg?: string; color?: string }) {
  return (
    <span
      style={{
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
      }}
    >
      {children}
    </span>
  );
}
