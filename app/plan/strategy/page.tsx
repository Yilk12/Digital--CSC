"use client";
import React, { useEffect, useState } from "react";

interface Plan {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  status: string;
  assignee?: string;
  history?: any[];
  attachments?: Array<{ id: string; name: string; type: string; dataUrl: string; size?: number; by?: string; uploadedAt?: string }>;
}

export default function StrategyPlanningPage() {
  const [items, setItems] = useState<Plan[]>([]);

  const load = async () => {
    // Strategy reviews items in UNDER_STRATEGY_REVIEW
    const res = await fetch(`/api/planning?status=${encodeURIComponent("UNDER_STRATEGY_REVIEW")}`, { cache: "no-store" });
    const data = await res.json();
    setItems(data.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const approveAligned = async (id: string) => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "strategy_align_approve", by: "STRATEGY" }),
    });
    await load();
  };

  const reject = async (id: string) => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "strategy_reject", by: "STRATEGY" }),
    });
    await load();
  };

  const requestChanges = async (id: string) => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "strategy_request_changes", by: "STRATEGY" }),
    });
    await load();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Planning/Strategy Department Review</h1>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((p) => (
          <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Status: {p.status}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => approveAligned(p.id)} style={{ padding: "6px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Approve & Align</button>
                <button onClick={() => requestChanges(p.id)} style={{ padding: "6px 10px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Request Changes</button>
                <button onClick={() => reject(p.id)} style={{ padding: "6px 10px", background: "#b91c1c", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Reject</button>
              </div>
            </div>
            {p.description && <div style={{ marginTop: 8, fontSize: 14 }}>{p.description}</div>}
            {Array.isArray(p.attachments) && p.attachments.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Attachments</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {p.attachments.map((a) => (
                    <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 6 }}>
                      {a.type?.startsWith("image/") ? (
                        <a href={a.dataUrl} target="_blank" rel="noreferrer" title={a.name}>
                          <img src={a.dataUrl} alt={a.name} style={{ width: 96, height: 72, objectFit: "cover", display: "block", borderRadius: 4 }} />
                        </a>
                      ) : (
                        <a href={a.dataUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#2563eb", fontSize: 12 }}>
                          {a.name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div style={{ color: "#475569" }}>No plans to review.</div>}
      </div>
    </div>
  );
}
