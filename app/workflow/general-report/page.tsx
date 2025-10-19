"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function GeneralReportPage() {
  const [me, setMe] = useState<string>("");
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email?: string; role?: string; department?: string }>>([]);

  type PeriodType = 'Daily'|'Weekly'|'Monthly'|'Quarterly'|'Yearly'|'Custom'|'Real-time';
  const [periodType, setPeriodType] = useState<PeriodType>('Weekly');
  const today = useMemo(()=> new Date(), []);
  const todayISO = useMemo(()=> new Date().toISOString().slice(0,10), []);
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittedTo, setSubmittedTo] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState<any|null>(null);
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  // Group users by role for Recipient select
  const roleGroups = useMemo(()=>{
    const buckets: Record<string, Array<{ id:string; label:string }>> = {};
    const order = ['ADMIN','DEPARTMENT_HEAD','TEAM_LEAD','PLANNING','STRATEGY','EMPLOYEE','STAFF'];
    for (const u of users) {
      const label = u.name || u.email || u.id;
      const r = String(u.role||'').toUpperCase() || 'EMPLOYEE';
      const key = order.includes(r) ? r : 'EMPLOYEE';
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push({ id: u.id, label });
    }
    const sortedKeys = Object.keys(buckets).sort((a,b)=> order.indexOf(a) - order.indexOf(b));
    return { buckets, sortedKeys };
  }, [users]);

  // Identity from token
  useEffect(()=>{
    try {
      const t = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
      if (t) {
        const p = JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
        const guess = p?.email || p?.preferred_username || p?.sub || p?.name;
        if (guess) setMe(String(guess));
      }
    } catch {}
  }, []);

  // Users for recipient select
  useEffect(()=>{ (async()=>{ try { const r = await fetch('/api/users?page=1&pageSize=200&sort=name:asc'); const j = await r.json(); setUsers(j.items||[]); } catch {} })(); }, []);

  // Derive default periodStart/periodEnd from periodType
  useEffect(()=>{
    const d = new Date();
    function toISO(x: Date) { return x.toISOString().slice(0,10); }
    if (periodType === 'Daily') { setPeriodStart(toISO(d)); setPeriodEnd(toISO(d)); return; }
    if (periodType === 'Weekly') {
      const day = d.getDay(); // 0=Sun
      const diffToMon = (day === 0 ? -6 : 1 - day);
      const start = new Date(d); start.setDate(d.getDate() + diffToMon);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      setPeriodStart(toISO(start)); setPeriodEnd(toISO(end)); return;
    }
    if (periodType === 'Monthly') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth()+1, 0);
      setPeriodStart(toISO(start)); setPeriodEnd(toISO(end)); return;
    }
    if (periodType === 'Quarterly') {
      const month = d.getMonth(); // 0-11
      const q = Math.floor(month / 3); // 0..3
      const start = new Date(d.getFullYear(), q * 3, 1);
      const end = new Date(d.getFullYear(), q * 3 + 3, 0);
      setPeriodStart(toISO(start)); setPeriodEnd(toISO(end)); return;
    }
    if (periodType === 'Yearly') {
      const start = new Date(d.getFullYear(), 0, 1);
      const end = new Date(d.getFullYear(), 11, 31);
      setPeriodStart(toISO(start)); setPeriodEnd(toISO(end)); return;
    }
    if (periodType === 'Real-time') {
      const start = new Date(d);
      start.setDate(d.getDate() - 1); // last 24h (date-granularity)
      setPeriodStart(toISO(start)); setPeriodEnd(toISO(d)); return;
    }
    // Custom: keep as-is
  }, [periodType]);

  // Load daily task records for me (client-side filter by date range)
  async function loadRecords() {
    if (!me) return;
    setLoading(true);
    try {
      // fetch without date to get batch
      const res = await fetch(`/api/workflow/daily-tasks?submittedBy=${encodeURIComponent(me)}&page=1&pageSize=100`);
      const j = await res.json();
      const items = j.items || [];
      const inRange = (dt: string)=> {
        if (!periodStart && !periodEnd) return true;
        if (periodStart && dt < periodStart) return false;
        if (periodEnd && dt > periodEnd) return false;
        return true;
      };
      setRecords(items.filter((r: any)=> inRange(r.date)));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ if (me) loadRecords(); }, [me]);
  useEffect(()=>{ if (me) loadRecords(); }, [periodStart, periodEnd]);

  // Load existing General Reports for me
  async function loadSavedReports() {
    if (!me) return;
    setLoadingSaved(true);
    try {
      const res = await fetch(`/api/workflow/general-reports?submittedBy=${encodeURIComponent(me)}&page=1&pageSize=50`);
      const j = await res.json();
      const items = (j.items||[]) as any[];
      setSavedReports(items);
      if (!selectedId && items.length>0) setSelectedId(items[0].id);
    } finally { setLoadingSaved(false); }
  }
  useEffect(()=>{ if (me) loadSavedReports(); }, [me]);

  // Stats
  const stats = useMemo(()=>{
    const totalTasks = records.reduce((acc, r)=> acc + (r.tasks?.length||0), 0);
    const totalMinutes = records.reduce((acc, r)=> acc + (r.totalMinutes||0), 0);
    let completed = 0, inProgress = 0, blocked = 0;
    for (const r of records) {
      for (const t of (r.tasks||[])) {
        const s = String(t.status||'').toLowerCase();
        if (s === 'completed') completed++;
        else if (s === 'in progress') inProgress++;
        else if (s === 'blocked') blocked++;
      }
    }
    return { totalTasks, totalMinutes, completed, inProgress, blocked };
  }, [records]);

  function fmtMinutes(min: number) { const m = min||0; const h = Math.floor(m/60); const mm = m%60; return `${h}h ${String(mm).padStart(2,'0')}m`; }

  async function submit() {
    if (!me || sending) return;
    setSending(true);
    try {
      const payload = {
        periodType,
        periodStart: periodStart || undefined,
        periodEnd: periodEnd || undefined,
        submittedBy: me,
        submittedTo: submittedTo || undefined,
        title: title || undefined,
        notes: notes || undefined,
        stats,
      };
      const res = await fetch('/api/workflow/general-reports', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const j = await res.json();
      if (res.ok) {
        setSaved(j.item);
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: 'General report submitted', type: 'success' } } as any)); } catch {}
        // notify recipient if chosen
        if (submittedTo) {
          try {
            await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: me, to: submittedTo, text: `${periodType} General Report submitted${periodStart? ` (${periodStart}${periodEnd? ' → '+periodEnd : ''})`: ''}.` })
            });
          } catch {}
        }
        // refresh saved reports list
        loadSavedReports();
      }
    } finally { setSending(false); }
  }

  return (
    <div style={{ maxWidth: 1000, margin:'0 auto', padding:16 }}>
      <h1 style={{ fontSize:22, fontWeight:800, marginBottom:12 }}>General Report</h1>

      {/* Period selection */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Period Type</div>
            <select value={periodType} onChange={e=> setPeriodType(e.target.value as PeriodType)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Yearly">Yearly</option>
              <option value="Custom">Custom</option>
              <option value="Real-time">Real-time / On-demand</option>
            </select>
            <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>
              {periodType === 'Daily' && 'Report includes data for a single day.'}
              {periodType === 'Weekly' && 'Report covers one week (e.g., Monday–Sunday).'}
              {periodType === 'Monthly' && 'Covers an entire month.'}
              {periodType === 'Quarterly' && 'Covers a 3-month quarter (Q1–Q4).'}
              {periodType === 'Yearly' && 'Covers a full calendar or fiscal year.'}
              {periodType === 'Custom' && 'Covers a user-defined date range.'}
              {periodType === 'Real-time' && 'Generated whenever requested (e.g., last 24 hours).'}
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Start</div>
            <input type="date" value={periodStart} onChange={e=> setPeriodStart(e.target.value)} disabled={periodType!=='Custom'} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: (periodType!=='Custom')? '#f3f4f6':'' }} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>End</div>
            <input type="date" value={periodEnd} onChange={e=> setPeriodEnd(e.target.value)} disabled={periodType!=='Custom'} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: (periodType!=='Custom')? '#f3f4f6':'' }} />
          </div>
        </div>
      </section>

      {/* Preview */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ fontWeight:800, marginBottom:8 }}>Aggregation Preview</div>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#64748b' }}>Total Tasks</div>
              <div style={{ fontSize:18, fontWeight:800 }}>{stats.totalTasks}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#64748b' }}>Total Time</div>
              <div style={{ fontSize:18, fontWeight:800 }}>{fmtMinutes(stats.totalMinutes)}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#64748b' }}>Completed</div>
              <div style={{ fontSize:18, fontWeight:800 }}>{stats.completed}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#64748b' }}>In Progress</div>
              <div style={{ fontSize:18, fontWeight:800 }}>{stats.inProgress}</div>
            </div>
            <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#64748b' }}>Blocked</div>
              <div style={{ fontSize:18, fontWeight:800 }}>{stats.blocked}</div>
            </div>
          </div>
        )}
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Title (optional)</div>
          <input value={title} onChange={e=> setTitle(e.target.value)} placeholder={`General ${periodType} Report`} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
        </div>
        <div style={{ marginTop:8 }}>
          <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Notes (optional)</div>
          <textarea value={notes} onChange={e=> setNotes(e.target.value)} rows={3} placeholder="Additional notes" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
        </div>
      </section>

      {/* Recipient & Submit */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12 }}>
        <div style={{ fontWeight:800, marginBottom:8 }}>Send Report</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <select value={submittedTo} onChange={e=> setSubmittedTo(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
            <option value="">Recipient (optional)</option>
            {roleGroups.sortedKeys.map(group=> (
              <optgroup key={group} label={group.replace('_',' ').toLowerCase().replace(/\b\w/g, c=> c.toUpperCase())}>
                {roleGroups.buckets[group].map(u=> (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={submit} disabled={sending || !me} style={{ padding:'8px 12px', background: sending ? '#9ca3af' : '#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{sending? 'Sending...' : 'Send General Report'}</button>
        </div>
        {saved && (
          <div style={{ marginTop:8, fontSize:12, color:'#047857' }}>Saved as {saved.id}</div>
        )}
      </section>

      {/* Saved Reports */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginTop:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:800 }}>Saved Reports</div>
          <button onClick={loadSavedReports} disabled={loadingSaved} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>{loadingSaved? 'Refreshing…' : 'Refresh'}</button>
        </div>
        {savedReports.length===0 ? (
          <div style={{ color:'#6b7280', fontSize:13 }}>No saved reports yet.</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12 }}>
            <div style={{ borderRight:'1px solid #e5e7eb', paddingRight:8 }}>
              <div style={{ display:'grid', gap:6 }}>
                {savedReports.map((r)=> (
                  <button key={r.id}
                    onClick={()=> setSelectedId(r.id)}
                    style={{ textAlign:'left', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: selectedId===r.id? '#eef2ff':'#fff' }}>
                    <div style={{ fontWeight:700 }}>{r.title || (r.periodType + ' Report')}</div>
                    <div style={{ fontSize:12, color:'#475569' }}>{r.id} • {r.periodType}{r.periodStart? ` • ${r.periodStart}`:''}{r.periodEnd? ` → ${r.periodEnd}`:''}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              {(() => {
                const r = savedReports.find(x=> x.id===selectedId);
                if (!r) return <div style={{ color:'#6b7280', fontSize:13 }}>Select a report to view content.</div>;
                return (
                  <div style={{ display:'grid', gap:10 }}>
                    <div>
                      <div style={{ fontSize:12, color:'#64748b' }}>Report</div>
                      <div style={{ fontSize:18, fontWeight:800 }}>{r.title || (r.periodType + ' Report')}</div>
                      <div style={{ fontSize:12, color:'#475569' }}>{r.id} • {r.periodType}{r.periodStart? ` • ${r.periodStart}`:''}{r.periodEnd? ` → ${r.periodEnd}`:''} • Created {new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
                      <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ fontSize:12, color:'#64748b' }}>Total Tasks</div>
                        <div style={{ fontSize:18, fontWeight:800 }}>{r.stats?.totalTasks||0}</div>
                      </div>
                      <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ fontSize:12, color:'#64748b' }}>Total Minutes</div>
                        <div style={{ fontSize:18, fontWeight:800 }}>{r.stats?.totalMinutes||0}</div>
                      </div>
                      <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ fontSize:12, color:'#64748b' }}>Completed</div>
                        <div style={{ fontSize:18, fontWeight:800 }}>{r.stats?.completed||0}</div>
                      </div>
                      <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ fontSize:12, color:'#64748b' }}>In Progress</div>
                        <div style={{ fontSize:18, fontWeight:800 }}>{r.stats?.inProgress||0}</div>
                      </div>
                      <div style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ fontSize:12, color:'#64748b' }}>Blocked</div>
                        <div style={{ fontSize:18, fontWeight:800 }}>{r.stats?.blocked||0}</div>
                      </div>
                    </div>
                    {r.notes && (
                      <div>
                        <div style={{ fontSize:12, color:'#64748b' }}>Notes</div>
                        <div style={{ whiteSpace:'pre-wrap' }}>{r.notes}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
