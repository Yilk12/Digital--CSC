"use client";
import React from "react";
import { decodeJwt } from "@/app/lib/auth";

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

export default function MyTasksPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = React.useState<'plan'|'daily'>('plan');
  const [me, setMe] = React.useState<string>("");

  React.useEffect(()=>{
    try {
      const t = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      if (t) {
        const p: any = decodeJwt(t);
        const guess = p?.email || p?.preferred_username || p?.sub || p?.name;
        if (guess) setMe(String(guess));
      }
    } catch {}
  }, []);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex: 1000 }} onClick={onClose}>
      <div style={{ position:'absolute', top:0, right:0, width:'min(92vw, 720px)', height:'100%', background:'#fff', borderLeft:'1px solid #e5e7eb', boxShadow:'-8px 0 24px rgba(0,0,0,0.12)', display:'flex', flexDirection:'column' }} onClick={e=> e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ fontWeight:800 }}>My Tasks</div>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid #e5e7eb', borderRadius:6, padding:'4px 8px', cursor:'pointer' }}>Close</button>
        </div>
        <div style={{ padding:'8px 10px', borderBottom:'1px solid #e5e7eb', display:'flex', gap:8 }}>
          <button onClick={()=> setTab('plan')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='plan'? '#eef2ff':'#fff', fontWeight:700 }}>Department Plan</button>
          <button onClick={()=> setTab('daily')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab==='daily'? '#eef2ff':'#fff', fontWeight:700 }}>Daily Task Record</button>
        </div>
        <div style={{ padding:12, overflow:'auto' }}>
          {tab==='plan' ? <DepartmentPlan me={me} /> : <DailyTaskForm me={me} />}
        </div>
      </div>
    </div>
  );
}

function DepartmentPlan({ me }: { me: string }) {
  const [items, setItems] = React.useState<Assignment[]>([]);
  const [loading, setLoading] = React.useState(false);

  async function load() {
    if (!me) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workflow/assignments?level=EMPLOYEE&toUserId=${encodeURIComponent(me)}&page=1&pageSize=20`);
      const j = await res.json();
      setItems(j.items || []);
    } finally { setLoading(false); }
  }
  React.useEffect(()=>{ load(); }, [me]);

  return (
    <div style={{ display:'grid', gap:8 }}>
      <div style={{ fontWeight:800, marginBottom:4 }}>Department Plan</div>
      {loading ? (
        <div style={{ color:'#6b7280', fontSize:13 }}>Loading…</div>
      ) : items.length===0 ? (
        <div style={{ color:'#6b7280', fontSize:13 }}>No plan items yet.</div>
      ) : (
        <div style={{ display:'grid', gap:8 }}>
          {items.map(a=> (
            <div key={a.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#475569' }}>
                <strong>{a.id}</strong> • Plan {a.planId} • Status {a.status}
              </div>
              {a.notes && <div style={{ fontSize:12, color:'#111827', marginTop:4 }}>{a.notes}</div>}
              {a.dueDate && <div style={{ fontSize:12, color:'#64748b' }}>Due {a.dueDate}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyTaskForm({ me }: { me: string }) {
  const todayISO = React.useMemo(()=> new Date().toISOString().slice(0,10), []);
  const [date, setDate] = React.useState<string>(todayISO);
  const [description, setDescription] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!me || !date || !description.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        date,
        employeeName: me,
        tasks: [{ title: description, description }],
        submittedBy: me,
      };
      const res = await fetch('/api/workflow/daily-tasks', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert('Daily Task saved');
        setDescription("");
      } else {
        alert('Failed to save');
      }
    } catch {
      alert('Error during save');
    } finally { setSaving(false); }
  }

  function submitNow() {
    if (!description.trim()) { alert('Please enter a description'); return; }
    alert('Submitted! (wire to backend if needed)');
  }

  return (
    <div style={{ display:'grid', gap:8 }}>
      <div style={{ fontWeight:800, marginBottom:4 }}>Daily Task Record</div>
      <div style={{ display:'grid', gridTemplateColumns:'160px 1fr', gap:8, alignItems:'center' }}>
        <label style={{ fontSize:12, color:'#475569' }}>Date</label>
        <input type="date" value={date} onChange={e=> setDate(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
        <label style={{ fontSize:12, color:'#475569' }}>Description</label>
        <textarea rows={3} value={description} onChange={e=> setDescription(e.target.value)} placeholder="What did you work on today?" style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
        <button onClick={save} disabled={saving || !description.trim()} style={{ padding:'8px 12px', background: saving? '#9ca3af':'#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{saving? 'Saving…' : 'Save'}</button>
        <button onClick={submitNow} style={{ padding:'8px 12px', background:'#111827', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Submit</button>
      </div>
    </div>
  );
}
