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
  attachments?: Array<{ id: string; name: string; type: string; dataUrl?: string; url?: string; size?: number; by?: string; uploadedAt?: string }>;
}

export default function TeamLeadPlanningPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [newCmt, setNewCmt] = useState<Record<string, string>>({});

  const load = async () => {
    // Team Lead reviews items in UNDER_TEAM_REVIEW
    const res = await fetch(`/api/planning?status=${encodeURIComponent("UNDER_TEAM_REVIEW")}`, { cache: "no-store" });
    const data = await res.json();
    setItems(data.items || []);
  };

  const addComment = async (id: string) => {
    const text = (newCmt[id] || '').trim();
    if (!text) return;
    await fetch('/api/planning/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, by: 'TEAM_LEAD', text })
    });
    setNewCmt(v => ({ ...v, [id]: '' }));
    await load();
  };

  useEffect(() => {
    load();
  }, []);

  const escalateToDH = async (id: string) => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "team_submit_up", by: "TEAM_LEAD" }),
    });
    await load();
  };

  const requestChanges = async (id: string) => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "team_request_changes", by: "TEAM_LEAD" }),
    });
    await load();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Team Lead Planning Review</h1>
      <div style={{ display: "grid", gap: 8 }}>
        {items.map((p) => (
          <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>Status: {p.status}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => escalateToDH(p.id)} style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Send to Dept Head</button>
                <button onClick={() => requestChanges(p.id)} style={{ padding: "6px 10px", background: "#111827", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Request Changes</button>
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
                        <a href={a.url || a.dataUrl || "#"} target="_blank" rel="noreferrer" title={a.name}>
                          <img src={a.url || a.dataUrl} alt={a.name} style={{ width: 96, height: 72, objectFit: "cover", display: "block", borderRadius: 4 }} />
                        </a>
                      ) : (
                        <a href={a.url || a.dataUrl || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#2563eb", fontSize: 12 }}>
                          {a.name}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Comments</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {Array.isArray((p as any).comments) && (p as any).comments.length > 0 ? (
                  (p as any).comments.map((c: any) => (
                    <div key={c.id} style={{ fontSize: 13, color: '#374151' }}>
                      <span style={{ fontWeight: 700 }}>{c.by}</span>: {c.text}
                      <span style={{ marginLeft: 6, fontSize: 11, color: '#6b7280' }}>({new Date(c.at).toLocaleString()})</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 12, color: '#6b7280' }}>No comments yet.</div>
                )}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    value={newCmt[p.id] ?? ''}
                    onChange={(e)=>setNewCmt(v=>({ ...v, [p.id]: e.target.value }))}
                    placeholder="Add a comment"
                    style={{ flex: 1, padding: '6px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
                  />
                  <button onClick={()=>addComment(p.id)} style={{ padding: '6px 10px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700 }}>Post</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ color: "#475569" }}>No plans to review.</div>}
      </div>
    </div>
  );
}
