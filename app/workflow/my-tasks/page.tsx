"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

export default function MyTasksPage() {
  const [me, setMe] = useState<string>("U-005"); // assume employee
  const [items, setItems] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [reportText, setReportText] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [submittingFor, setSubmittingFor] = useState<string | null>(null);

  // Daily Task Record form state
  const todayISO = useMemo(()=> new Date().toISOString().slice(0,10), []);
  const [date, setDate] = useState<string>(todayISO);
  const [employeeName, setEmployeeName] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [team, setTeam] = useState<string>("");
  const [supervisorName, setSupervisorName] = useState<string>("");
  type TaskRow = { title: string; description?: string; startTime?: string; endTime?: string; totalMinutes?: number; priority?: 'High'|'Medium'|'Low'; status?: 'Completed'|'In Progress'|'Blocked'; remarks?: string };
  const [tasks, setTasks] = useState<TaskRow[]>([{ title: "", description:"", startTime:"", endTime:"", totalMinutes:0, priority:"Medium", status:"In Progress", remarks:"" }]);
  const [challenges, setChallenges] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string>("");
  const [submittedTo, setSubmittedTo] = useState<string>("");
  const [signature, setSignature] = useState<string>("");
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email?: string; role?: string }>>([]);
  const [savingDaily, setSavingDaily] = useState(false);
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [templateType, setTemplateType] = useState<'xls'|'csv'|'print'|'sheets'>('xls');
  // Mini tab controls
  const [miniTab, setMiniTab] = useState<'plan'|'daily'>('plan');
  const miniToday = useMemo(()=> new Date().toISOString().slice(0,10), []);
  const [miniDate, setMiniDate] = useState<string>(miniToday);
  const [miniDesc, setMiniDesc] = useState<string>("");
  const [miniSaving, setMiniSaving] = useState<boolean>(false);
  async function miniSave() {
    if (!me || !miniDate || !miniDesc.trim() || miniSaving) return;
    setMiniSaving(true);
    try {
      const payload = {
        date: miniDate,
        employeeName: me,
        tasks: [{ title: miniDesc, description: miniDesc }],
        submittedBy: me,
      };
      const res = await fetch('/api/workflow/daily-tasks', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        alert('Daily Task saved');
        setMiniDesc("");
        try { await loadDailyRecords(); } catch {}
      } else {
        alert('Failed to save');
      }
    } catch {
      alert('Error during save');
    } finally { setMiniSaving(false); }
  }
  function miniSubmit() {
    if (!miniDesc.trim()) { alert('Please enter a description'); return; }
    alert('Submitted! (wire to backend if needed)');
  }

  // CSV helpers
  function toCSVRow(values: Array<string|number|null|undefined>) {
    return values.map(v => {
      const s = v==null ? '' : String(v);
      if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }).join(',');
  }
  // Role groups for Submitted To
  const roleGroups = useMemo(()=>{
    const buckets: Record<string, Array<{ id:string; label:string }>> = {};
    const order = ['ADMIN','DEPARTMENT_HEAD','TEAM_LEAD','PLANNING','STRATEGY','EMPLOYEE','STAFF'];
    for (const u of users) {
      const label = u.name || u.email || u.id;
      const roles: string[] = [];
      const r = String(u.role||'').toUpperCase();
      if (r) roles.push(r);
      if (roles.length===0) roles.push('EMPLOYEE');
      for (const rr of roles) {
        const key = rr;
        if (!buckets[key]) buckets[key] = [];
        buckets[key].push({ id: u.id, label });
      }
    }
    const sortedKeys = Object.keys(buckets).sort((a,b)=> order.indexOf(a) - order.indexOf(b));
    return { buckets, sortedKeys };
  }, [users]);
  function handleDownloadTemplate() {
    switch (templateType) {
      case 'xls':
        downloadTemplateExcel();
        break;
      case 'csv':
        downloadTemplateCSV();
        break;
      case 'print':
        window.print();
        break;
      case 'sheets':
        // Provide CSV then open a new Google Sheet tab for user to import
        downloadTemplateCSV();
        try { window.open('https://sheets.new', '_blank'); } catch {}
        break;
    }
  }

  // Excel helpers (legacy .xls via HTML table, opens in Excel)
  function downloadExcel(filename: string, tableHtml: string) {
    const html = `\uFEFF<html><head><meta charset="utf-8" /></head><body>${tableHtml}</body></html>`;
    download(filename, html, 'application/vnd.ms-excel');
  }
  function buildTemplateTableHTML() {
    const row = [
      date, employeeName, department, team, supervisorName,
      'Update website banner','Replace hero image on homepage','09:00','10:30','90','High','Completed','N/A','None','N/A', submittedTo, signature
    ];
    const headers = ['Date','Employee Name','Department','Team','Supervisor Name','Task Title','Task Description','Start Time','End Time','Total Minutes','Priority','Status','Remarks','Challenges','Suggestions','Submitted To','Signature'];
    return `
      <table border="1">
        <thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
        <tbody><tr>${row.map(c=>`<td>${c||''}</td>`).join('')}</tr></tbody>
      </table>`;
  }
  function buildRecordsTableHTML() {
    const lines: string[] = [];
    lines.push('<table border="1">');
    lines.push('<thead><tr><th>ID</th><th>Date</th><th>Employee</th><th>Department</th><th>Team</th><th>Supervisor</th><th>Total Minutes</th><th>Challenges</th><th>Suggestions</th><th>Submitted To</th></tr></thead>');
    lines.push('<tbody>');
    for (const r of dailyRecords) {
      lines.push(`<tr><td>${r.id}</td><td>${r.date}</td><td>${r.employeeName}</td><td>${r.department||''}</td><td>${r.team||''}</td><td>${r.supervisorName||''}</td><td>${r.totalMinutes||0}</td><td>${r.challenges||''}</td><td>${r.suggestions||''}</td><td>${r.submittedTo||''}</td></tr>`);
      // tasks subtable
      lines.push('<tr><td colspan="10">');
      lines.push('<table border="1" style="width:100%"><thead><tr><th>Task Title</th><th>Description</th><th>Start</th><th>End</th><th>Total Minutes</th><th>Priority</th><th>Status</th><th>Remarks</th></tr></thead><tbody>');
      for (const t of (r.tasks||[])) {
        lines.push(`<tr><td>${t.title||''}</td><td>${t.description||''}</td><td>${t.startTime||''}</td><td>${t.endTime||''}</td><td>${t.totalMinutes||0}</td><td>${t.priority||''}</td><td>${t.status||''}</td><td>${t.remarks||''}</td></tr>`);
      }
      lines.push('</tbody></table>');
      lines.push('</td></tr>');
    }
    lines.push('</tbody></table>');
    return lines.join('');
  }
  function downloadTemplateExcel() { downloadExcel(`daily-task-template-${date}.xls`, buildTemplateTableHTML()); }
  function exportTodayRecordsExcel() { downloadExcel(`daily-task-records-${date}.xls`, buildRecordsTableHTML()); }
  function download(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  }
  function downloadTemplateCSV() {
    const headers = ['Date','Employee Name','Department','Team','Supervisor Name','Task Title','Task Description','Start Time','End Time','Total Minutes','Priority','Status','Remarks','Challenges','Suggestions','Submitted To','Signature'];
    const example = [date, employeeName, department, team, supervisorName, 'Update website banner','Replace hero image on homepage','09:00','10:30','90','High','Completed','N/A','None','N/A', submittedTo, signature];
    const csv = [toCSVRow(headers), toCSVRow(example)].join('\n');
    download(`daily-task-template-${date}.csv`, csv);
  }
  function exportTodayRecordsCSV() {
    const headers = ['ID','Date','Employee Name','Department','Team','Supervisor Name','Total Minutes','Challenges','Suggestions','Submitted To'];
    const lines = [toCSVRow(headers)];
    for (const r of dailyRecords) {
      lines.push(toCSVRow([r.id, r.date, r.employeeName, r.department||'', r.team||'', r.supervisorName||'', r.totalMinutes||0, r.challenges||'', r.suggestions||'', r.submittedTo||'']));
      // task lines
      const taskHeader = toCSVRow(['','Task Title','Description','Start Time','End Time','Total Minutes','Priority','Status','Remarks']);
      lines.push(taskHeader);
      for (const t of (r.tasks||[])) {
        lines.push(toCSVRow(['', t.title||'', t.description||'', t.startTime||'', t.endTime||'', t.totalMinutes||0, t.priority||'', t.status||'', t.remarks||'' ]));
      }
      lines.push('');
    }
    download(`daily-task-records-${date}.csv`, lines.join('\n'));
  }

  function toMinutes(hhmm?: string): number | undefined {
    if (!hhmm) return undefined;
    const m = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
    if (!m) return undefined;
    const h = parseInt(m[1],10), mi = parseInt(m[2],10);
    return h*60+mi;
  }

  async function submitDaily() {
    if (!date || !employeeName || savingDaily) return;
    setSavingDaily(true);
    try {
      const payload = {
        date,
        employeeName,
        department: department || undefined,
        team: team || undefined,
        supervisorName: supervisorName || undefined,
        tasks: tasks.map(t=> ({
          title: t.title,
          description: t.description,
          startTime: t.startTime || undefined,
          endTime: t.endTime || undefined,
          totalMinutes: t.totalMinutes,
          priority: t.priority,
          status: t.status,
          remarks: t.remarks,
        })),
        challenges: challenges || undefined,
        suggestions: suggestions || undefined,
        submittedTo: submittedTo || undefined,
        signature: signature || undefined,
        submittedBy: me,
      };
      const res = await fetch('/api/workflow/daily-tasks', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: 'Daily task record saved', type: 'success' } } as any)); } catch {}
        // notify recipient if chosen
        if (submittedTo) {
          try {
            await fetch('/api/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ from: me, to: submittedTo, text: `Daily Task Record submitted for ${date}.` })
            });
          } catch {}
        }
        await loadDailyRecords();
      }
    } finally { setSavingDaily(false); }
  }
  function fmtMinutes(min?: number) {
    const m = min||0; const h = Math.floor(m/60); const mm = m%60; return `${h}h ${String(mm).padStart(2,'0')}m`;
  }
  const totalMinutes = useMemo(()=> (tasks||[]).reduce((acc, t)=> acc + (typeof t.totalMinutes==='number' ? (t.totalMinutes||0) : (toMinutes(t.startTime)!=null && toMinutes(t.endTime)!=null && (toMinutes(t.endTime)!>=toMinutes(t.startTime)!) ? ((toMinutes(t.endTime) as number)-(toMinutes(t.startTime) as number)) : 0)), 0), [tasks]);

  function updateTask(index: number, patch: Partial<TaskRow>) {
    setTasks(prev => prev.map((t,i)=> i===index ? ({ ...t, ...patch, totalMinutes: (()=>{
      const st = ('startTime' in patch ? patch.startTime : t.startTime);
      const et = ('endTime' in patch ? patch.endTime : t.endTime);
      const tm = ('totalMinutes' in patch ? patch.totalMinutes : t.totalMinutes);
      const s = toMinutes(st); const e = toMinutes(et);
      if (s!=null && e!=null && e>=s) return e-s;
      return typeof tm==='number'? tm : 0;
    })() }) : t));
  }
  function addTask() { setTasks(prev=> [...prev, { title:"", description:"", startTime:"", endTime:"", totalMinutes:0, priority:"Medium", status:"In Progress", remarks:"" }]); }
  function removeTask(i: number) { setTasks(prev=> prev.filter((_,idx)=> idx!==i)); }

  async function loadDailyRecords() {
    const res = await fetch(`/api/workflow/daily-tasks?submittedBy=${encodeURIComponent(me)}&date=${encodeURIComponent(date)}&page=1&pageSize=20`);
    const j = await res.json();
    setDailyRecords(j.items || []);
  }

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

  // Load users for recipient select and default employeeName from token if present
  useEffect(()=>{
    (async()=>{
      try {
        const res = await fetch('/api/users?page=1&pageSize=200&sort=name:asc');
        const j = await res.json();
        setUsers(j.items || []);
        if (!employeeName && me) {
          const mine = (j.items||[]).find((u:any)=> [u.email, u.id, u.name].map((x:string)=> String(x||'').toLowerCase()).includes(String(me||'').toLowerCase()));
          if (mine?.name) setEmployeeName(String(mine.name));
          if (!submittedTo && mine && mine.role==='TEAM_LEAD' && mine?.id) setSubmittedTo(String(mine.id));
        }
      } catch {}
    })();
  }, [me]);

  useEffect(()=>{ if (me && date) loadDailyRecords(); }, [me, date]);

  async function loadAssignments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflow/assignments?level=EMPLOYEE&toUserId=${encodeURIComponent(me)}&page=${page}&pageSize=${pageSize}`);
      const j = await res.json();
      setItems(j.items || []);
    } finally { setLoading(false); }
  }

  useEffect(()=>{ loadAssignments(); }, [me, page, pageSize]);

  async function changeStatus(id: string, action: 'start'|'complete'|'reject') {
    await fetch('/api/workflow/assignments', { method:'PATCH', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ id, action, by: me }) });
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
      // clear inputs for that assignment
      setReportText(prev => ({ ...prev, [a.id]: '' }));
      setFiles(prev => ({ ...prev, [a.id]: [] }));
      try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: 'Report submitted', type: 'success' } } as any)); } catch {}
      // optional: mark started
      await changeStatus(a.id, 'start');
    } finally {
      setSubmittingFor(null);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin:'0 auto', padding:16 }}>
      {/* Top: Tab buttons for Department Plan and Daily Task Record */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <button onClick={()=> setMiniTab('plan')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: miniTab==='plan'? '#eef2ff':'#fff', fontWeight:700 }}>Department Plan</button>
          <button onClick={()=> setMiniTab('daily')} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: miniTab==='daily'? '#eef2ff':'#fff', fontWeight:700 }}>Daily Task Record</button>
        </div>
        <div>
          {miniTab==='plan' ? (
              <div style={{ display:'grid', gap:8 }}>
                <div style={{ fontWeight:700, color:'#475569' }}>Department Plan Page – view or receive plan from department head</div>
                {loading ? (
                  <div style={{ color:'#6b7280', fontSize:13 }}>Loading assignments…</div>
                ) : (items.length===0 ? (
                  <div style={{ color:'#6b7280', fontSize:13 }}>No plan items yet.</div>
                ) : (
                  <div style={{ display:'grid', gap:8 }}>
                    {items.map((a)=> (
                      <div key={a.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                        <div style={{ fontSize:12, color:'#475569' }}>
                          <strong>{a.id}</strong> • Plan {a.planId} • Status {a.status}
                        </div>
                        {a.notes && <div style={{ fontSize:12, color:'#111827', marginTop:4 }}>{a.notes}</div>}
                        {a.dueDate && <div style={{ fontSize:12, color:'#64748b' }}>Due {a.dueDate}</div>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
        </div>
      </section>
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:12 }}>
        <Link href="/workflow/general-report" style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, textDecoration:'none', color:'#111827', background:'#f9fafb' }}>
          Go to General Report
        </Link>
      </div>

      {/* Daily Task Record Form (hidden when viewing Department Plan tab) */}
      {miniTab!== 'plan' && (
        <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:8 }}>Daily Task Record</div>
          {/* Basic Info */}
          <div style={{ display:'grid', gap:8, marginBottom:8 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Date</div>
                <input type="date" value={date} onChange={e=> setDate(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
              </div>
              <div>
                <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Employee Name</div>
                <input value={employeeName} onChange={e=> setEmployeeName(e.target.value)} placeholder="Full name" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <input value={department} onChange={e=> setDepartment(e.target.value)} placeholder="Department" style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
              <input value={team} onChange={e=> setTeam(e.target.value)} placeholder="Team" style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <input value={supervisorName} onChange={e=> setSupervisorName(e.target.value)} placeholder="Supervisor Name (optional)" style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
              <select value={submittedTo} onChange={e=> setSubmittedTo(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value="">Submitted To (optional)</option>
                {roleGroups.sortedKeys.map(group=> (
                  <optgroup key={group} label={group.replace('_',' ').toLowerCase().replace(/\b\w/g, c=> c.toUpperCase())}>
                    {roleGroups.buckets[group].map(u=> (
                      <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          {/* Task Details Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f9fafb' }}>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Task Title</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Description</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Start</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>End</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Total</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Priority</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Status</th>
                  <th style={{ textAlign:'left', padding:8, borderBottom:'1px solid #e5e7eb' }}>Remarks</th>
                  <th style={{ padding:8, borderBottom:'1px solid #e5e7eb' }}></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i)=> (
                  <tr key={i}>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <input value={t.title} onChange={e=> updateTask(i, { title: e.target.value })} placeholder="Task Title" style={{ width:'100%', padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <input value={t.description||''} onChange={e=> updateTask(i, { description: e.target.value })} placeholder="Description" style={{ width:'100%', padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <input type="time" value={t.startTime||''} onChange={e=> updateTask(i, { startTime: e.target.value })} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <input type="time" value={t.endTime||''} onChange={e=> updateTask(i, { endTime: e.target.value })} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9', whiteSpace:'nowrap' }}>
                      <input value={t.totalMinutes ?? ''} onChange={e=> updateTask(i, { totalMinutes: parseInt(e.target.value||'0',10)||0 })} placeholder="mins" style={{ width:80, padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, marginRight:6 }} />
                      <span style={{ color:'#64748b' }}>{fmtMinutes(t.totalMinutes)}</span>
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <select value={t.priority||'Medium'} onChange={e=> updateTask(i, { priority: e.target.value as any })} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <select value={t.status||'In Progress'} onChange={e=> updateTask(i, { status: e.target.value as any })} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                        <option>Completed</option>
                        <option>In Progress</option>
                        <option>Blocked</option>
                      </select>
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <input value={t.remarks||''} onChange={e=> updateTask(i, { remarks: e.target.value })} placeholder="Remarks" style={{ width:'100%', padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
                    </td>
                    <td style={{ padding:6, borderBottom:'1px solid #f1f5f9' }}>
                      <button onClick={()=> removeTask(i)} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background:'#fff' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:8 }}>
              <button onClick={addTask} style={{ padding:'6px 10px', background:'#111827', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>+ Add Task</button>
            </div>
          </div>

          {/* End of day summary */}
          <div style={{ display:'grid', gap:8, marginTop:12 }}>
            <div style={{ fontWeight:700 }}>End-of-Day Summary</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Total Hours Worked</div>
                <input value={fmtMinutes(totalMinutes)} readOnly style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6, background:'#f9fafb' }} />
              </div>
              <div>
                <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Signature / Confirmation (optional)</div>
                <input value={signature} onChange={e=> setSignature(e.target.value)} placeholder="Signature" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
              </div>
            </div>
            <textarea value={challenges} onChange={e=> setChallenges(e.target.value)} rows={3} placeholder="Key Challenges" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
            <textarea value={suggestions} onChange={e=> setSuggestions(e.target.value)} rows={3} placeholder="Suggestions/Improvements (optional)" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button onClick={submitDaily} disabled={savingDaily || !employeeName || !date} style={{ padding:'8px 12px', background: savingDaily? '#9ca3af':'#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{savingDaily? 'Saving...' : 'Save Daily Record'}</button>
            </div>
          </div>
        </section>
      )}
      {/* Print styles for cleaner PDF-like layout */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          header, nav, footer { display: none !important; }
          button, select, input, textarea { appearance: none; -webkit-appearance: none; border: none; box-shadow: none; }
          a { text-decoration: none; color: black; }
          /* Keep only the Daily Records section visible if desired */
          @page { margin: 12mm; }
        }
      `}</style>

      {/* Saved records list */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontWeight:800 }}>My Daily Records ({date})</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <label style={{ fontSize:12, color:'#475569' }}>Doc template</label>
              <select value={templateType} onChange={e=> setTemplateType(e.target.value as any)} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value="xls">Excel (.xls)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="print">Printable (PDF via Print)</option>
                <option value="sheets">Google Sheets (open & import)</option>
              </select>
              <button onClick={handleDownloadTemplate} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>Get Template</button>
            </div>
            <button onClick={exportTodayRecordsCSV} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>Export Today (CSV)</button>
            <button onClick={exportTodayRecordsExcel} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>Export Today (.xls)</button>
            <button onClick={()=> window.print()} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>Print</button>
          </div>
        </div>
        {dailyRecords.length===0 ? (
          <div style={{ color:'#6b7280', fontSize:13 }}>No records yet.</div>
        ) : (
          <div style={{ display:'grid', gap:8 }}>
            {dailyRecords.map((r:any)=> (
              <div key={r.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                <div style={{ fontSize:12, color:'#475569', marginBottom:6 }}>
                  <strong>{r.id}</strong> • {r.date} • {r.employeeName} • Total: {fmtMinutes(r.totalMinutes)}
                </div>
                {(r.tasks||[]).map((t:any, idx:number)=> (
                  <div key={idx} style={{ fontSize:12, color:'#111827' }}>• {t.title} — {t.startTime||'--:--'} to {t.endTime||'--:--'} ({fmtMinutes(t.totalMinutes)}) [{t.priority}] [{t.status}]</div>
                ))}
                {r.challenges && <div style={{ fontSize:12, color:'#111827', marginTop:4 }}><strong>Challenges:</strong> {r.challenges}</div>}
                {r.suggestions && <div style={{ fontSize:12, color:'#111827' }}><strong>Suggestions:</strong> {r.suggestions}</div>}
                {r.submittedTo && <div style={{ fontSize:12, color:'#111827' }}><strong>Submitted To:</strong> {r.submittedTo}</div>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Assignment controls removed as requested */}
    </div>
  );
}
