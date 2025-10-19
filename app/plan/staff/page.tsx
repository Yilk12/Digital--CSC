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

export default function StaffPlanningPage() {
  const [items, setItems] = useState<Plan[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPlanId, setUploadingPlanId] = useState<string | null>(null);
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const owner = "STAFF"; // simple marker; replace with real user id if available
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const load = async () => {
    const res = await fetch(`/api/planning?owner=${encodeURIComponent(owner)}&sort=id:desc&page=${page}&pageSize=${pageSize}` , { cache: "no-store" });
    const data = await res.json();
    setItems(data.items || []);
    setTotal(typeof data.total === 'number' ? data.total : 0);
  };

  // Inline edit state for table
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [editTitle, setEditTitle] = useState<Record<string, string>>({});
  const [editDesc, setEditDesc] = useState<Record<string, string>>({});
  const [openDocs, setOpenDocs] = useState<Record<string, boolean>>({});

  const onEdit = (p: Plan) => {
    setEditing(prev => ({ ...prev, [p.id]: true }));
    setEditTitle(prev => ({ ...prev, [p.id]: p.title }));
    setEditDesc(prev => ({ ...prev, [p.id]: p.description || "" }));
  };
  const onCancel = (id: string) => {
    setEditing(prev => ({ ...prev, [id]: false }));
  };
  const onSave = async (id: string) => {
    const payload = { id, title: editTitle[id], description: editDesc[id] };
    await fetch("/api/planning", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setEditing(prev => ({ ...prev, [id]: false }));
    await load();
  };
  const onDelete = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await fetch(`/api/planning?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  };

  const uploadAttachments = async (planId: string, files: FileList | File[]) => {
    const list: File[] = Array.isArray(files) ? files : Array.from(files || []);
    if (!list || list.length === 0) return;
    setUploadingPlanId(planId);
    try {
      const form = new FormData();
      form.append("id", planId);
      list.forEach(f => form.append("files", f));
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      await fetch("/api/planning/attachments", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } as any : undefined,
        body: form,
      });
      await load();
    } finally {
      setUploadingPlanId(null);
    }
  };

  useEffect(() => {
    load();
  }, [page, pageSize]);

  const createPlan = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, owner }),
      });
      if (!res.ok) throw new Error("Failed to create plan");
      const j = await res.json();
      const newId = j?.item?.id as string | undefined;
      // If files were chosen during create, upload them now
      if (newId && createFiles.length > 0) {
        await uploadAttachments(newId, createFiles);
      }
      setTitle("");
      setDescription("");
      setCreateFiles([]);
      setPage(1); // show newest on top
      await load();
    } finally {
      setLoading(false);
    }
  };

  const submitToTeamLead = async (id: string) => {
    await fetch("/api/planning/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "staff_submit", by: "STAFF" }),
    });
    await load();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Staff Planning</h1>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Plan title"
          style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6 }}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6 }}
        />
        <button
          onClick={createPlan}
          disabled={loading}
          style={{ padding: "8px 12px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
        >
          {loading ? "Creating..." : "Create Plan"}
        </button>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#475569", marginBottom: 6 }}>Attach documents (optional)</label>
          <input
            type="file"
            multiple
            onChange={(e) => {
              const files = e.target.files ? Array.from(e.target.files) : [];
              setCreateFiles(files);
            }}
          />
          {createFiles.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: "#475569" }}>Selected:</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {createFiles.map((f, i) => (
                  <li key={i} style={{ fontSize: 12 }}>{f.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <h2 style={{ fontWeight: 700, margin: "12px 0" }}>My Plans</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Title</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Description</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Status</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #e5e7eb" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <React.Fragment key={p.id}>
                <tr>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                    {editing[p.id] ? (
                      <input value={editTitle[p.id] ?? ""} onChange={(e)=>setEditTitle(v=>({ ...v, [p.id]: e.target.value }))} style={{ width: "100%", padding: 6, border: "1px solid #e5e7eb", borderRadius: 6 }} />
                    ) : (
                      <a href={`/plan/staff/${p.id}`} style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>{p.title}</a>
                    )}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                    {editing[p.id] ? (
                      <textarea value={editDesc[p.id] ?? ""} onChange={(e)=>setEditDesc(v=>({ ...v, [p.id]: e.target.value }))} rows={2} style={{ width: "100%", padding: 6, border: "1px solid #e5e7eb", borderRadius: 6 }} />
                    ) : (
                      <span style={{ color: "#475569" }}>{p.description}</span>
                    )}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, color: "#475569" }}>{p.status}{p.assignee ? ` (Assignee: ${p.assignee})` : ""}</div>
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #e5e7eb" }}>
                    {!editing[p.id] ? (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={()=>onEdit(p)} style={{ padding: "6px 10px", background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Edit</button>
                        <button
                          onClick={()=> p.status === 'DRAFT' ? submitToTeamLead(p.id) : undefined}
                          disabled={p.status !== 'DRAFT'}
                          title={p.status !== 'DRAFT' ? 'Send is available only in DRAFT' : ''}
                          style={{ padding: "6px 10px", background: p.status === 'DRAFT' ? "#111827" : "#9ca3af", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}
                        >
                          Send
                        </button>
                        <button onClick={()=>setOpenDocs(v=>({ ...v, [p.id]: !v[p.id] }))} style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Open Documents</button>
                        <button onClick={()=>onDelete(p.id)} style={{ padding: "6px 10px", background: "#b91c1c", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Delete</button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={()=>onSave(p.id)} style={{ padding: "6px 10px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Update</button>
                        <button onClick={()=>onCancel(p.id)} style={{ padding: "6px 10px", background: "#6b7280", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
                {openDocs[p.id] && (
                  <tr>
                    <td colSpan={4} style={{ padding: 8, borderBottom: "1px solid #e5e7eb", background: "#fcfcfc" }}>
                      {/* Attachments list */}
                      {Array.isArray(p.attachments) && p.attachments.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
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
                      {/* Upload for DRAFT plans */}
                      {p.status === "DRAFT" && (
                        <div>
                          <input
                            id={`file-input-${p.id}`}
                            type="file"
                            multiple
                            style={{ display: "none" }}
                            onChange={async (e) => {
                              const list = e.target.files;
                              if (list && list.length > 0) {
                                await uploadAttachments(p.id, list);
                              }
                              e.currentTarget.value = "";
                            }}
                          />
                          <button
                            onClick={() => document.getElementById(`file-input-${p.id}`)?.click()}
                            style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, marginRight: 8 }}
                          >
                            Upload documents
                          </button>
                          {uploadingPlanId === p.id && <span style={{ fontSize: 12, color: "#475569" }}>Uploading...</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 8, color: "#475569" }}>No plans yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
          <div style={{ fontSize: 12, color: '#475569' }}>
            {total > 0 ? (
              <>Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}</>
            ) : (
              <>No records</>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, color: '#475569' }}>Rows per page</label>
            <select
              value={pageSize}
              onChange={(e)=>{ setPageSize(parseInt(e.target.value,10)||10); setPage(1); }}
              style={{ padding: '4px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={()=> setPage(p=> Math.max(1, p-1))}
              disabled={page <= 1}
              style={{ padding: '6px 10px', background: page<=1? '#e5e7eb':'#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              Prev
            </button>
            <button
              onClick={()=> setPage(p=> (p*pageSize < total ? p+1 : p))}
              disabled={page * pageSize >= total}
              style={{ padding: '6px 10px', background: page*pageSize>=total? '#e5e7eb':'#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 6 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
