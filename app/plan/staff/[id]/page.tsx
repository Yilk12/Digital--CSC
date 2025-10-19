"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface Attachment { id: string; name: string; type: string; url?: string; dataUrl?: string; size?: number; by?: string; uploadedAt?: string }
interface Comment { id: string; by: string; text: string; at: string }
interface Plan {
  id: string;
  title: string;
  description?: string;
  owner?: string;
  status: string;
  assignee?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  history?: any[];
}

export default function StaffPlanDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/planning/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const j = await res.json();
      setPlan(j.item as Plan);
    } catch (e: any) {
      setError(e?.message || "Failed to load plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const uploadAttachments = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("id", id);
      Array.from(files).forEach((f) => form.append("files", f));
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      await fetch("/api/planning/attachments", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
        body: form,
      });
      await load();
    } finally {
      setUploading(false);
    }
  };

  const submitToTeamLead = async () => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "staff_submit", by: "STAFF" }),
    });
    await load();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Link href="/plan/staff" style={{ color: "#2563eb", textDecoration: "none" }}>← Back to My Plans</Link>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
      {plan && (
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{plan.title}</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>ID: {plan.id}</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>Status: {plan.status}{plan.assignee ? ` (Assignee: ${plan.assignee})` : ''}</div>
          </div>

          {plan.description && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Description</div>
              <div style={{ fontSize: 14 }}>{plan.description}</div>
            </div>
          )}

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Attachments</div>
            {Array.isArray(plan.attachments) && plan.attachments.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {plan.attachments.map((a) => (
                  <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: 6 }}>
                    {a.type?.startsWith("image/") ? (
                      <a href={a.url || a.dataUrl || "#"} target="_blank" rel="noreferrer" title={a.name}>
                        <img src={a.url || a.dataUrl} alt={a.name} style={{ width: 128, height: 96, objectFit: "cover", display: "block", borderRadius: 4 }} />
                      </a>
                    ) : (
                      <a href={a.url || a.dataUrl || "#"} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "#2563eb", fontSize: 13 }}>
                        {a.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#6b7280" }}>No attachments.</div>
            )}

            {plan.status === 'DRAFT' && (
              <div style={{ marginTop: 10 }}>
                <input
                  id="file-input-detail"
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const list = e.target.files;
                    if (list && list.length > 0) await uploadAttachments(list);
                    e.currentTarget.value = '';
                  }}
                />
                <button onClick={() => document.getElementById('file-input-detail')?.click()} style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, marginRight: 8 }}>
                  Upload documents
                </button>
                {uploading && <span style={{ fontSize: 12, color: "#475569" }}>Uploading...</span>}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Comments</div>
            {Array.isArray(plan.comments) && plan.comments.length > 0 ? (
              <div style={{ display: 'grid', gap: 6 }}>
                {plan.comments.map((c) => (
                  <div key={c.id} style={{ fontSize: 13, color: '#374151' }}>
                    <span style={{ fontWeight: 700 }}>{c.by}</span>: {c.text}
                    <span style={{ marginLeft: 6, fontSize: 11, color: '#6b7280' }}>({new Date(c.at).toLocaleString()})</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#6b7280' }}>No comments.</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={submitToTeamLead}
              disabled={plan.status !== 'DRAFT'}
              title={plan.status !== 'DRAFT' ? 'Send is available only in DRAFT' : ''}
              style={{ padding: "8px 12px", background: plan.status === 'DRAFT' ? "#111827" : "#9ca3af", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
            >
              Send to Team Lead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
