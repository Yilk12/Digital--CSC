"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/http";

type UserLite = { id: string; name?: string; email?: string; role?: string; department?: string };

type Role = 'EMPLOYEE'|'TEAM_LEAD'|'DEPARTMENT_HEAD'|'ADMIN'|'PLANNING'|'STRATEGY'|'STAFF'|string;

type RequestAny = any & { kind: 'FIELD'|'OVERTIME' };

type Status = 'PENDING_DEPT'|'PENDING_HRM'|'APPROVED'|'REJECTED';

export default function ReviewPage() {
  const [me, setMe] = useState<string>("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [department, setDepartment] = useState<string>('');

  // Filters
  const [type, setType] = useState<'ALL'|'FIELD'|'OVERTIME'>('ALL');
  const [status, setStatus] = useState<'ALL'|Status>('ALL');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [requester, setRequester] = useState<string>('');

  const [items, setItems] = useState<RequestAny[]>([]);
  const [loading, setLoading] = useState(false);

  // Identity
  useEffect(()=>{
    try {
      const t = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      if (t) {
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        const guess = p?.email || p?.preferred_username || p?.sub || p?.name;
        if (guess) setMe(String(guess));
      }
    } catch {}
  },[]);

  // Load users and infer my role/department
  useEffect(()=>{ (async()=>{
    try {
      const r = await fetch('/api/users?page=1&pageSize=200&sort=name:asc');
      const j = await r.json();
      const us: UserLite[] = j.items || [];
      setUsers(us);
      const meUser = us.find(u => u.email === me || u.id === me || u.name === me);
      if (meUser) {
        const r = String(meUser.role||'EMPLOYEE').toUpperCase() as Role;
        setRole(r);
        if (meUser.department) setDepartment(meUser.department);
      }
    } catch {}
  })(); }, [me]);

  const canDeptApprove = role === 'DEPARTMENT_HEAD';
  const canHRMApprove = role !== 'DEPARTMENT_HEAD'; // treat others (ADMIN/PLANNING/etc.) as HRM level

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      if (status !== 'ALL') qs.set('status', status);
      if (requester) qs.set('requesterId', requester);
      const [otRes, fldRes] = await Promise.all([
        fetch(`/api/workflow/overtime-requests?${qs.toString()}`),
        fetch(`/api/workflow/field-requests?${qs.toString()}`)
      ]);
      const [otJ, fldJ] = await Promise.all([otRes.json(), fldRes.json()]);
      let ot = (otJ.items||[]).map((x:any)=> ({ ...x, kind:'OVERTIME' }));
      let fld = (fldJ.items||[]).map((x:any)=> ({ ...x, kind:'FIELD' }));
      // Department Head sees only own department by default
      if (canDeptApprove && department) {
        ot = ot.filter((i: any) => (i.department||'') === department);
        fld = fld.filter((i: any) => (i.department||'') === department);
      }
      let all = [...ot, ...fld];
      if (type !== 'ALL') all = all.filter(i => i.kind === type);
      setItems(all.sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt))));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, [role, department, type, status, from, to, requester]);

  async function takeAction(id: string, kind: 'FIELD'|'OVERTIME', action: 'APPROVE'|'REJECT', comment: string) {
    const actor = canDeptApprove ? 'DEPT' : 'HRM';
    const body = { id, action, actor, by: me, comments: comment };
    const url = kind === 'OVERTIME' ? '/api/workflow/overtime-requests' : '/api/workflow/field-requests';
    const res = await apiFetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, { adminOverride: role === 'ADMIN' });
    const j = await res.json();
    if (!res.ok) throw new Error(j?.error || 'Action failed');
    try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: `${action} successful`, type: 'success' } } as any)); } catch {}
    await load();
  }

  function exportCSV() {
    const headers = ['ID','Type','Status','Requester','Department','Purpose','From/Date(s)','To','Duration','CreatedAt'];
    const rows = items.map(it => {
      if (it.kind === 'OVERTIME') {
        return [it.id,'OVERTIME',it.status,it.requesterId,it.department||'',it.purposeType||it.overtimeType, (it.dates||[]).join(' | '), '', it.durationType||'', it.createdAt];
      } else {
        return [it.id,'FIELD',it.status,it.requesterId,it.department||'',it.purposeType||'', it.fromDate, it.toDate, it.durationType||'', it.createdAt];
      }
    });
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'review-requests.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1100, margin:'0 auto', padding:16 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:12 }}>Requests Review</h1>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:8 }}>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Type</div>
            <select value={type} onChange={e=> setType(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
              <option value="ALL">All</option>
              <option value="FIELD">Field</option>
              <option value="OVERTIME">Overtime</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Status</div>
            <select value={status} onChange={e=> setStatus(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
              {(['ALL','PENDING_DEPT','PENDING_HRM','APPROVED','REJECTED'] as const).map(s=> <option key={s} value={s}>{s.replace('_',' ')}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>From</div>
            <input type="date" value={from} onChange={e=> setFrom(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>To</div>
            <input type="date" value={to} onChange={e=> setTo(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Requester</div>
            <select value={requester} onChange={e=> setRequester(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
              <option value="">All</option>
              {users.map(u=> <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'end', gap:8 }}>
            <button onClick={load} disabled={loading} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>{loading? 'Loading…' : 'Apply'}</button>
            <button onClick={exportCSV} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>Export CSV</button>
          </div>
        </div>
      </section>

      <section style={{ display:'grid', gap:8 }}>
        {items.length===0 ? (
          <div style={{ color:'#6b7280', fontSize:13 }}>No requests found.</div>
        ) : items.map(r => (
          <ReviewCard key={r.id} r={r} canDeptApprove={canDeptApprove} canHRMApprove={canHRMApprove} onAction={takeAction} />
        ))}
      </section>
    </div>
  );
}

function ReviewCard({ r, canDeptApprove, canHRMApprove, onAction }: { r: RequestAny; canDeptApprove: boolean; canHRMApprove: boolean; onAction: (id: string, kind: 'FIELD'|'OVERTIME', action: 'APPROVE'|'REJECT', comment: string)=>Promise<void> }) {
  const [comment, setComment] = useState<string>('');
  const canAct = (r.status==='PENDING_DEPT' && canDeptApprove) || (r.status==='PENDING_HRM' && canHRMApprove);

  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontWeight:800 }}>{r.id} • {r.kind} • {r.status.replace('_',' ')}</div>
          <div style={{ fontSize:12, color:'#475569' }}>{r.kind==='OVERTIME' ? (r.dates||[]).join(', ') : `${r.fromDate}${r.toDate? ' → '+r.toDate : ''}`} • {r.department||''}</div>
        </div>
        <div style={{ fontSize:12, color:'#475569' }}>{r.purposeType || r.overtimeType || ''}</div>
      </div>
      {/* History */}
      {Array.isArray(r.history) && r.history.length>0 && (
        <div style={{ marginTop:6 }}>
          <div style={{ fontSize:12, color:'#64748b' }}>History</div>
          <div style={{ display:'grid', gap:4 }}>
            {r.history.map((h:any, idx:number)=> (
              <div key={idx} style={{ fontSize:12, color:'#475569' }}>• {h.action} by {h.by || 'system'} at {h.at ? new Date(h.at).toLocaleString() : ''}{h.comments? ` — ${h.comments}`:''}</div>
            ))}
          </div>
        </div>
      )}
      {/* Action */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:10 }}>
        <input value={comment} onChange={e=> setComment(e.target.value)} placeholder="Add review comment (optional)" style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
        <button onClick={()=> onAction(r.id, r.kind, 'APPROVE', comment)} disabled={!canAct} style={{ padding:'6px 10px', background: canAct? '#16a34a':'#9ca3af', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Approve</button>
        <button onClick={()=> onAction(r.id, r.kind, 'REJECT', comment)} disabled={!canAct} style={{ padding:'6px 10px', background: canAct? '#dc2626':'#9ca3af', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Reject</button>
      </div>
    </div>
  );
}
