"use client";

import React, { useEffect, useMemo, useState } from "react";

type Assignment = {
  id: string;
  planId: string;
  level: 'DEPARTMENT'|'TEAM'|'EMPLOYEE';
  fromUserId: string;
  toUserId?: string;
  dueDate?: string;
  notes?: string;
  status: 'PENDING'|'IN_PROGRESS'|'COMPLETED'|'REJECTED';
  createdAt: string;
};

type User = { id: string; name: string; email?: string; role?: string; department?: string; team?: string };

export default function DepartmentInboxPage() {
  const [me, setMe] = useState<string>("U-003"); // assume dept head
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [tls, setTls] = useState<User[]>([]);
  const [fanoutSel, setFanoutSel] = useState<Record<string, boolean>>({});
  // no filters/details/bulk in reverted UI

  // Send Report (as Department Head)
  const [reportText, setReportText] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);

  useEffect(()=>{
    try {
      const t = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      if (t) {
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        const guess = p?.email || p?.preferred_username || p?.sub;
        if (guess) setMe(String(guess));
      }
    } catch {}
  }, []);

  async function loadAssignments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflow/assignments?level=DEPARTMENT&toUserId=${encodeURIComponent(me)}&page=${page}&pageSize=${pageSize}`);
      const j = await res.json();
      setItems(j.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadTLs() {
    // Reverted: load all users for testing
    const res = await fetch(`/api/users?page=1&pageSize=500`);
    const j = await res.json();
    setTls(j.items || []);
  }

  useEffect(()=>{ loadAssignments(); }, [me, page, pageSize]);
  useEffect(()=>{ loadTLs(); }, []);

  async function changeStatus(id: string, action: 'start'|'complete'|'reject') {
    await fetch('/api/workflow/assignments', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id, action, by: me }) });
    await loadAssignments();
  }

  async function fanOut(parentAssignmentId: string) {
    const toUsers = Object.entries(fanoutSel).filter(([,v])=>v).map(([k])=>k);
    if (toUsers.length===0) return;
    await fetch('/api/workflow/assignments', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ parentAssignmentId, level: 'TEAM', by: me, toUsers }) });
    setFanoutSel({});
    await loadAssignments();
  }

  async function submitReport(a: Assignment) {
    const body = (reportText[a.id] || '').trim();
    const fs = files[a.id] || [];
    if (!body && fs.length===0) return;
    setSubmittingFor(a.id);
    try {
      if (fs.length > 0) {
        const form = new FormData();
        form.append('planId', a.planId);
        form.append('assignmentId', a.id);
        form.append('submittedBy', me);
        form.append('submittedTo', a.fromUserId);
        form.append('body', body);
        fs.forEach(f=> form.append('files', f));
        await fetch('/api/workflow/reports', { method:'POST', body: form });
      } else {
        await fetch('/api/workflow/reports', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ planId: a.planId, assignmentId: a.id, submittedBy: me, submittedTo: a.fromUserId, body }) });
      }
      setReportText(prev => ({ ...prev, [a.id]: '' }));
      setFiles(prev => ({ ...prev, [a.id]: [] }));
    } finally {
      setSubmittingFor(null);
    }
  }

  // no comments/bulk in reverted UI

  return (
    <div style={{ maxWidth: 1100, margin:'0 auto', padding:16 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:12 }}>Department Inbox</h1>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <label style={{ fontSize:12, color:'#475569' }}>Rows</label>
          <select value={pageSize} onChange={e=>{ setPageSize(parseInt(e.target.value,10)||10); setPage(1); }} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
          <button onClick={()=> setPage(p=> Math.max(1,p-1))} disabled={page<=1} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: page<=1?'#e5e7eb':'#f3f4f6' }}>Prev</button>
          <button onClick={()=> setPage(p=> p+1)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>Next</button>
        </div>
      </section>
      

      {loading ? (
        <div>Loading...</div>
      ) : items.length===0 ? (
        <div style={{ color:'#6b7280', fontSize:13 }}>No assignments.</div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {items.map(a=> (
            <section key={a.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12 }}>
              <div style={{ fontSize:12, color:'#475569', marginBottom:6 }}>
                <strong>{a.id}</strong> • Plan {a.planId} • Status {a.status}
              </div>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <button onClick={()=> changeStatus(a.id, 'start')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background:'#f3f4f6' }}>Start</button>
                <button onClick={()=> changeStatus(a.id, 'complete')} style={{ padding:'6px 10px', background:'#10b981', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Complete</button>
                <button onClick={()=> changeStatus(a.id, 'reject')} style={{ padding:'6px 10px', background:'#b91c1c', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Reject</button>
              </div>
              
              <div style={{ fontWeight:700, marginBottom:6 }}>Fan-out to Team Leaders</div>
              <div style={{ display:'grid', gap:6, gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {tls.map(u=> (
                  <label key={u.id} style={{ display:'flex', gap:8, alignItems:'center', border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px' }}>
                    <input type="checkbox" checked={!!fanoutSel[u.id]} onChange={(e)=> setFanoutSel(prev=> ({ ...prev, [u.id]: e.target.checked }))} />
                    <span>{u.name} {u.email?`(${u.email})`:''} · {u.role || ''} {u.department?`· ${u.department}`:''} {u.team?`· ${u.team}`:''}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop:8, display:'flex', justifyContent:'flex-end' }}>
                <button onClick={()=> fanOut(a.id)} disabled={Object.values(fanoutSel).every(v=>!v)} style={{ padding:'8px 12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Create TEAM assignments</button>
              </div>

              {/* Send Report upstream (to Planning/Strategy) */}
              <div style={{ marginTop:12 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>Send Report</div>
                <div style={{ display:'grid', gap:8 }}>
                  <textarea value={reportText[a.id]||''} onChange={(e)=> setReportText(prev=> ({ ...prev, [a.id]: e.target.value }))} rows={3} placeholder={`Report for ${a.id}`} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
                  <div>
                    <input id={`dept-files-${a.id}`} type='file' multiple style={{ display:'none' }} onChange={(e)=>{
                      const fs = e.target.files ? Array.from(e.target.files) : [];
                      setFiles(prev => ({ ...prev, [a.id]: fs }));
                      (e.target as HTMLInputElement).value='';
                    }} />
                    <button onClick={()=> document.getElementById(`dept-files-${a.id}`)?.click()} style={{ padding:'6px 10px', background:'#111827', color:'#fff', border:'none', borderRadius:6, fontWeight:700, marginRight:8 }}>Attach files</button>
                    {(files[a.id]?.length||0) > 0 && (
                      <span style={{ fontSize:12, color:'#475569' }}>{files[a.id]?.length} file(s) selected</span>
                    )}
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button onClick={()=> submitReport(a)} disabled={submittingFor===a.id || ((!reportText[a.id] || !reportText[a.id].trim()) && (!files[a.id] || files[a.id].length===0))} style={{ padding:'8px 12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{submittingFor===a.id ? 'Sending...' : 'Send Report'}</button>
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
