"use client";

import React, { useEffect, useMemo, useState } from "react";

type Plan = { id: string; title: string; description?: string };
type Report = {
  id: string;
  planId: string;
  assignmentId: string;
  submittedBy: string;
  submittedTo: string;
  body: string;
  attachments: Array<{ url: string; name: string; type: string; size?: number }>;
  status: 'SUBMITTED'|'REVIEWED'|'APPROVED'|'REJECTED';
  createdAt: string;
  history: Array<{ by: string; action: string; at: string; comments?: string }>;
  route?: { chain: Array<'EMPLOYEE'|'TEAM'|'DEPARTMENT'|'PLANNING'>; current?: 'EMPLOYEE'|'TEAM'|'DEPARTMENT'|'PLANNING' };
  approvals?: Array<{ stage: 'EMPLOYEE'|'TEAM'|'DEPARTMENT'|'PLANNING'; by?: string; at?: string; decision?: 'REVIEW'|'APPROVE'|'REJECT'; comments?: string }>;
};

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

export default function PlanReportsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansQ, setPlansQ] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [me, setMe] = useState<string>("U-002");

  // My Tasks state
  const [myTasks, setMyTasks] = useState<Assignment[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksPage, setTasksPage] = useState(1);
  const [tasksPageSize, setTasksPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<'reports' | 'tasks'>('reports');

  useEffect(() => {
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
        if (!token) return;
        const p = JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        const guess = p?.email || p?.preferred_username || p?.sub;
        if (guess) setMe(String(guess));
      } catch {}
    })();
  }, []);

  async function loadPlans() {
    const res = await fetch(`/api/planning?page=1&pageSize=50${plansQ ? `&q=${encodeURIComponent(plansQ)}` : ''}`);
    const j = await res.json();
    setPlans(j.items || []);
    if (!selectedPlan && (j.items||[]).length>0) setSelectedPlan(j.items[0].id);
  }

  async function loadReports() {
    if (!selectedPlan) { setReports([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/workflow/reports?planId=${encodeURIComponent(selectedPlan)}&page=${page}&pageSize=${pageSize}`);
      const j = await res.json();
      setReports(j.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyTasks() {
    setTasksLoading(true);
    try {
      const res = await fetch(`/api/workflow/assignments?level=EMPLOYEE&toUserId=${encodeURIComponent(me)}&page=${tasksPage}&pageSize=${tasksPageSize}`);
      const j = await res.json();
      setMyTasks(j.items || []);
    } finally {
      setTasksLoading(false);
    }
  }

  useEffect(()=>{ loadPlans(); }, [plansQ]);
  useEffect(()=>{ loadReports(); }, [selectedPlan, page, pageSize]);
  useEffect(()=>{ loadMyTasks(); }, [me, tasksPage, tasksPageSize]);

  const paged = reports; // API already paginates

  async function onReview(id: string, action: 'review'|'approve'|'reject') {
    await fetch('/api/workflow/reports', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id, action, by: me }) });
    await loadReports();
  }

  async function changeTaskStatus(id: string, action: 'start'|'complete'|'reject') {
    await fetch('/api/workflow/assignments', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id, action, by: me }) });
    await loadMyTasks();
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Plan and Reports</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
        <button 
          onClick={() => setActiveTab('reports')}
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'reports' ? '#2563eb' : 'transparent',
            color: activeTab === 'reports' ? '#fff' : '#6b7280',
            borderRadius: '6px 6px 0 0',
            fontWeight: activeTab === 'reports' ? 700 : 400,
            cursor: 'pointer'
          }}
        >
          Reports
        </button>
        <button 
          onClick={() => setActiveTab('tasks')}
          style={{ 
            padding: '8px 16px', 
            border: 'none', 
            background: activeTab === 'tasks' ? '#2563eb' : 'transparent',
            color: activeTab === 'tasks' ? '#fff' : '#6b7280',
            borderRadius: '6px 6px 0 0',
            fontWeight: activeTab === 'tasks' ? 700 : 400,
            cursor: 'pointer'
          }}
        >
          My Tasks
        </button>
      </div>

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <>
          <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12, marginBottom: 12 }}>
            <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 8 }}>
              <input value={plansQ} onChange={(e)=> setPlansQ(e.target.value)} placeholder="Search plans" style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius: 6 }} />
              <select value={selectedPlan} onChange={(e)=> setSelectedPlan(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius: 6 }}>
                <option value="">Select a plan</option>
                {plans.map(p=> (<option key={p.id} value={p.id}>{p.title}</option>))}
              </select>
              <label style={{ fontSize: 12, color:'#475569' }}>Rows</label>
              <select value={pageSize} onChange={(e)=>{ setPageSize(parseInt(e.target.value,10)||10); setPage(1); }} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <button onClick={()=> setPage(p=> Math.max(1,p-1))} disabled={page<=1} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: page<=1?'#e5e7eb':'#f3f4f6' }}>Prev</button>
              <button onClick={()=> setPage(p=> p+1)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>Next</button>
            </div>
          </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Reports</div>
        {loading ? (
          <div>Loading...</div>
        ) : paged.length === 0 ? (
          <div style={{ color:'#6b7280', fontSize: 13 }}>No reports.</div>
        ) : (
          <div style={{ display:'grid', gap: 8 }}>
            {paged.map(r=> (
              <div key={r.id} style={{ border:'1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                <div style={{ fontSize: 12, color:'#475569', marginBottom: 4 }}>
                  <strong>{r.id}</strong> • Assignment {r.assignmentId} • {new Date(r.createdAt).toLocaleString()} • Status {r.status}
                  {r.route?.current && (
                    <span style={{ marginLeft:8, fontSize:11, background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd', borderRadius:999, padding:'2px 8px' }}>Stage: {r.route.current}</span>
                  )}
                </div>
                <div style={{ whiteSpace:'pre-wrap' }}>{r.body}</div>
                {Array.isArray(r.attachments) && r.attachments.length>0 && (
                  <div style={{ marginTop: 6, display:'flex', flexWrap:'wrap', gap: 8 }}>
                    {r.attachments.map((a, idx)=> (
                      <a key={idx} href={a.url} target="_blank" rel="noreferrer" style={{ padding: 6, border:'1px solid #e5e7eb', borderRadius:6, textDecoration:'none', color:'#2563eb', fontSize: 12 }}>{a.name}</a>
                    ))}
                  </div>
                )}
                {Array.isArray(r.approvals) && r.approvals.length>0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight:700, marginBottom:4 }}>Approvals</div>
                    <div style={{ display:'grid', gap:4 }}>
                      {r.approvals.map((ap, i)=> (
                        <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', fontSize:12 }}>
                          <strong>{ap.stage}</strong> • {ap.decision || 'REVIEW'} by {ap.by || 'unknown'} at {ap.at ? new Date(ap.at).toLocaleString() : '—'} {ap.comments?`• ${ap.comments}`:''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop: 8, display:'flex', gap: 8 }}>
                  <button onClick={()=> onReview(r.id, 'review')} style={{ padding:'6px 10px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:6 }}>Mark Reviewed</button>
                  <button onClick={()=> onReview(r.id, 'approve')} style={{ padding:'6px 10px', background:'#10b981', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Approve</button>
                  <button onClick={()=> onReview(r.id, 'reject')} style={{ padding:'6px 10px', background:'#b91c1c', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </>
      )}

      {/* My Tasks Tab Content */}
      {activeTab === 'tasks' && (
        <>
          <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12, marginBottom: 12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <label style={{ fontSize: 12, color:'#475569' }}>Rows</label>
              <select value={tasksPageSize} onChange={e=>{ setTasksPageSize(parseInt(e.target.value,10)||10); setTasksPage(1); }} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <button onClick={()=> setTasksPage(p=> Math.max(1,p-1))} disabled={tasksPage<=1} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: tasksPage<=1?'#e5e7eb':'#f3f4f6' }}>Prev</button>
              <button onClick={()=> setTasksPage(p=> p+1)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>Next</button>
            </div>
          </section>

          <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>My Tasks</div>
            {tasksLoading ? (
              <div>Loading...</div>
            ) : myTasks.length === 0 ? (
              <div style={{ color:'#6b7280', fontSize: 13 }}>No tasks assigned to you.</div>
            ) : (
              <div style={{ display:'grid', gap: 12 }}>
                {myTasks.map(task => (
                  <div key={task.id} style={{ border:'1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12, color:'#475569', marginBottom: 6 }}>
                      <strong>{task.id}</strong> • Plan {task.planId} • Status {task.status}
                      {task.dueDate && (
                        <span style={{ marginLeft: 8, fontSize: 11, background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a', borderRadius:999, padding:'2px 8px' }}>
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {task.notes && (
                      <div style={{ marginBottom: 8, fontSize: 13, color: '#374151' }}>
                        {task.notes}
                      </div>
                    )}
                    <div style={{ display:'flex', gap: 8 }}>
                      <button 
                        onClick={()=> changeTaskStatus(task.id, 'start')} 
                        disabled={task.status === 'IN_PROGRESS' || task.status === 'COMPLETED' || task.status === 'REJECTED'}
                        style={{ 
                          padding:'6px 10px', 
                          border:'1px solid #e5e7eb', 
                          borderRadius:6, 
                          background: task.status === 'PENDING' ? '#f3f4f6' : '#e5e7eb',
                          cursor: task.status === 'PENDING' ? 'pointer' : 'not-allowed',
                          opacity: task.status === 'PENDING' ? 1 : 0.6
                        }}
                      >
                        Start
                      </button>
                      <button 
                        onClick={()=> changeTaskStatus(task.id, 'complete')} 
                        disabled={task.status === 'COMPLETED' || task.status === 'REJECTED'}
                        style={{ 
                          padding:'6px 10px', 
                          background: task.status === 'IN_PROGRESS' ? '#10b981' : '#e5e7eb', 
                          color: task.status === 'IN_PROGRESS' ? '#fff' : '#6b7280', 
                          border:'none', 
                          borderRadius:6, 
                          fontWeight:700,
                          cursor: task.status === 'IN_PROGRESS' ? 'pointer' : 'not-allowed',
                          opacity: task.status === 'IN_PROGRESS' ? 1 : 0.6
                        }}
                      >
                        Complete
                      </button>
                      <button 
                        onClick={()=> changeTaskStatus(task.id, 'reject')} 
                        disabled={task.status === 'COMPLETED' || task.status === 'REJECTED'}
                        style={{ 
                          padding:'6px 10px', 
                          background: (task.status === 'PENDING' || task.status === 'IN_PROGRESS') ? '#b91c1c' : '#e5e7eb', 
                          color: (task.status === 'PENDING' || task.status === 'IN_PROGRESS') ? '#fff' : '#6b7280', 
                          border:'none', 
                          borderRadius:6, 
                          fontWeight:700,
                          cursor: (task.status === 'PENDING' || task.status === 'IN_PROGRESS') ? 'pointer' : 'not-allowed',
                          opacity: (task.status === 'PENDING' || task.status === 'IN_PROGRESS') ? 1 : 0.6
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
