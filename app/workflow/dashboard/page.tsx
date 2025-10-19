"use client";

import React, { useEffect, useMemo, useState } from "react";

type Role = 'EMPLOYEE'|'TEAM_LEAD'|'DEPARTMENT_HEAD'|'ADMIN'|'PLANNING'|'STRATEGY'|'STAFF'|string;

type UserLite = { id: string; name?: string; email?: string; role?: string; department?: string };

type RequestAny = any & { kind: 'FIELD'|'OVERTIME' };

export default function WorkflowDashboard() {
  const [me, setMe] = useState<string>("");
  const [users, setUsers] = useState<UserLite[]>([]);
  const [role, setRole] = useState<Role>('EMPLOYEE');
  const [department, setDepartment] = useState<string>('');

  const [pendingDept, setPendingDept] = useState<RequestAny[]>([]);
  const [pendingHRM, setPendingHRM] = useState<RequestAny[]>([]);
  const [mine, setMine] = useState<RequestAny[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Users
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

  async function loadData() {
    setLoading(true);
    try {
      // Pending for dept and HRM
      const [otDept, fldDept, otHRM, fldHRM, otMine, fldMine] = await Promise.all([
        fetch('/api/workflow/overtime-requests?status=PENDING_DEPT').then(r=> r.json()).catch(()=>({items:[]})),
        fetch('/api/workflow/field-requests?status=PENDING_DEPT').then(r=> r.json()).catch(()=>({items:[]})),
        fetch('/api/workflow/overtime-requests?status=PENDING_HRM').then(r=> r.json()).catch(()=>({items:[]})),
        fetch('/api/workflow/field-requests?status=PENDING_HRM').then(r=> r.json()).catch(()=>({items:[]})),
        me ? fetch(`/api/workflow/overtime-requests?requesterId=${encodeURIComponent(me)}`).then(r=> r.json()).catch(()=>({items:[]})) : Promise.resolve({items:[]}),
        me ? fetch(`/api/workflow/field-requests?requesterId=${encodeURIComponent(me)}`).then(r=> r.json()).catch(()=>({items:[]})) : Promise.resolve({items:[]}),
      ]);
      let dept = [...(otDept.items||[]).map((x:any)=> ({...x, kind:'OVERTIME'})), ...(fldDept.items||[]).map((x:any)=> ({...x, kind:'FIELD'}))];
      let hrm = [...(otHRM.items||[]).map((x:any)=> ({...x, kind:'OVERTIME'})), ...(fldHRM.items||[]).map((x:any)=> ({...x, kind:'FIELD'}))];
      let my = [...(otMine.items||[]).map((x:any)=> ({...x, kind:'OVERTIME'})), ...(fldMine.items||[]).map((x:any)=> ({...x, kind:'FIELD'}))];
      if (role === 'DEPARTMENT_HEAD' && department) {
        dept = dept.filter(i => (i.department||'') === department);
      }
      setPendingDept(dept.sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt))));
      setPendingHRM(hrm.sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt))));
      setMine(my.sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt))));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ loadData(); }, [role, department, me]);

  const cards = [
    { title: 'Pending Dept Approval', count: pendingDept.length, href: '/workflow/review' },
    { title: 'Pending HRM Approval', count: pendingHRM.length, href: '/workflow/review' },
    { title: 'My Requests', count: mine.length, href: '/workflow/field-overtime' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin:'0 auto', padding:16 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:12 }}>Workflow Dashboard</h1>

      <section style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:12 }}>
        {cards.map(c => (
          <a key={c.title} href={c.href} style={{ textDecoration:'none', color:'inherit' }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:16 }}>
              <div style={{ fontSize:12, color:'#64748b' }}>{c.title}</div>
              <div style={{ fontSize:26, fontWeight:800 }}>{loading? '…' : c.count}</div>
            </div>
          </a>
        ))}
      </section>

      {/* Quick Actions */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', gap:8 }}>
          <a href="/workflow/field-overtime"><button style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6 }}>New Field/Overtime Request</button></a>
          <a href="/workflow/review"><button style={{ padding:'8px 12px', border:'1px solid #e5e7eb', borderRadius:6 }}>Review Requests</button></a>
        </div>
      </section>

      {/* Lists */}
      {role === 'DEPARTMENT_HEAD' && (
        <List title="Pending Dept Approval" items={pendingDept} />
      )}
      {role !== 'DEPARTMENT_HEAD' && (
        <List title="Pending HRM Approval" items={pendingHRM} />
      )}
      <List title="My Recent Requests" items={mine.slice(0,5)} />
    </div>
  );
}

function List({ title, items }: { title: string; items: RequestAny[] }) {
  return (
    <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
      <div style={{ fontWeight:800, marginBottom:8 }}>{title}</div>
      {items.length===0 ? (
        <div style={{ color:'#6b7280', fontSize:13 }}>No items.</div>
      ) : (
        <div style={{ display:'grid', gap:8 }}>
          {items.map((r:any)=> (
            <div key={r.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, background:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{r.id} • {r.kind} • {r.status.replace('_',' ')}</div>
                  <div style={{ fontSize:12, color:'#475569' }}>{r.kind==='OVERTIME' ? (r.dates||[]).join(', ') : `${r.fromDate}${r.toDate? ' → '+r.toDate : ''}`} • {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ fontSize:12, color:'#475569' }}>{r.purposeType || r.overtimeType || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
