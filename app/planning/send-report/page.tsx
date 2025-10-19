"use client";

import React, { useEffect, useMemo, useState } from "react";

type Plan = { id: string; title: string; description?: string };

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

export default function SendReportPage() {
  const [me, setMe] = useState<string>("unknown");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansQ, setPlansQ] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");

  const [submittedTo, setSubmittedTo] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  // Reporting details
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [teamName, setTeamName] = useState<string>("");
  const [frequency, setFrequency] = useState<'Daily'|'Weekly'|'Monthly'|'Quarterly'|'Semi-Annual'|'Yearly'|'Other'>("Weekly");
  const [quarter, setQuarter] = useState<'Q1'|'Q2'|'Q3'|'Q4'|''>("");
  // Summary fields
  const [keyTasks, setKeyTasks] = useState<string>("");
  const [progressVsGoals, setProgressVsGoals] = useState<string>("");
  const [ongoing, setOngoing] = useState<string>("");
  const [challenges, setChallenges] = useState<string>("");
  const [collaboration, setCollaboration] = useState<string>("");
  const [metrics, setMetrics] = useState<string>("");
  const [learnings, setLearnings] = useState<string>("");
  const [nextWeek, setNextWeek] = useState<string>("");
  const [managerComments, setManagerComments] = useState<string>("");
  // Users for Recipient select
  const [users, setUsers] = useState<Array<{ id: string; name?: string; email?: string; role?: string; department?: string }>>([]);
  const [myRole, setMyRole] = useState<string>("");

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

  // Load users and detect my role for recipient dropdown
  useEffect(()=>{
    (async()=>{
      try {
        const res = await fetch('/api/users?page=1&pageSize=200&sort=name:asc');
        const j = await res.json();
        const list = j.items || [];
        setUsers(list);
        // try to infer my role by matching email or id
        const mine = list.find((u: any)=> [u.email, u.id, u.name].map((x:string)=> String(x||'').toLowerCase()).includes(String(me||'').toLowerCase()));
        if (mine?.role) setMyRole(String(mine.role));
      } catch {}
    })();
  }, [me]);

  const recipientLabel = useMemo(()=>{
    const r = String(myRole||'').toUpperCase();
    if (r === 'DEPARTMENT_HEAD') return 'Recipient (Planning / Strategic)';
    return 'Recipient (Team Lead / Department Head)';
  }, [myRole]);

  const filteredRecipients = useMemo(()=>{
    const r = String(myRole||'').toUpperCase();
    const all = users as any[];
    if (r === 'DEPARTMENT_HEAD') {
      // Show Planning/Strategic: role STRATEGY or department === 'Planning'
      return all.filter(u=> String(u.role||'').toUpperCase()==='STRATEGY' || String(u.department||'').toLowerCase()==='planning');
    }
    // Default (employees): Team Lead or Department Head
    return all.filter(u=> ['TEAM_LEAD','DEPARTMENT_HEAD'].includes(String(u.role||'').toUpperCase()));
  }, [users, myRole]);

  // Ensure submittedTo remains valid for filtered options, unless it came from assignment auto-fill
  useEffect(()=>{
    if (!submittedTo) return;
    const ok = filteredRecipients.some(u=> u.id === submittedTo);
    if (!ok) {
      // keep auto-filled value if set by assignment; otherwise clear
      // We cannot distinguish source reliably here; prefer keeping but allow user to change
      // Do nothing, select will include it as extra option below
    }
  }, [filteredRecipients, submittedTo]);

  async function loadPlans() {
    const res = await fetch(`/api/planning?page=1&pageSize=100${plansQ?`&q=${encodeURIComponent(plansQ)}`:''}`);
    const j = await res.json();
    setPlans(j.items || []);
    if (!selectedPlan && (j.items||[]).length>0) setSelectedPlan(j.items[0].id);
  }
  useEffect(()=>{ loadPlans(); }, [plansQ]);

  async function loadAssignments(planId: string) {
    if (!planId) { setAssignments([]); setSelectedAssignment(""); setSubmittedTo(""); return; }
    const base = `/api/workflow/assignments?planId=${encodeURIComponent(planId)}&page=1&pageSize=100`;
    const url = (me && me !== 'unknown') ? `${base}&toUserId=${encodeURIComponent(me)}` : base;
    const res = await fetch(url);
    const j = await res.json();
    const items = j.items || [];
    setAssignments(items);
    if (items.length>0) {
      setSelectedAssignment(items[0].id);
      setSubmittedTo(items[0].fromUserId || "");
    } else {
      setSelectedAssignment("");
      setSubmittedTo("");
    }
  }
  useEffect(()=>{ if (selectedPlan) loadAssignments(selectedPlan); }, [selectedPlan, me]);

  // Auto-fill current week dates when Weekly is selected and dates are empty
  useEffect(()=>{
    if (frequency !== 'Weekly') return;
    const needStart = !periodStart;
    const needEnd = !periodEnd;
    if (!needStart && !needEnd) return;
    const now = new Date();
    // Monday as start of week
    const day = now.getDay(); // 0=Sun, 1=Mon,...
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const start = new Date(now);
    start.setDate(now.getDate() + diffToMon);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const toISODate = (d: Date)=> d.toISOString().slice(0,10);
    if (needStart) setPeriodStart(toISODate(start));
    if (needEnd) setPeriodEnd(toISODate(end));
  }, [frequency, periodStart, periodEnd]);

  const validationErrors = useMemo(()=>{
    const errs: string[] = [];
    const hasContent = (
      body.trim().length>0 ||
      keyTasks.trim().length>0 ||
      progressVsGoals.trim().length>0 ||
      ongoing.trim().length>0 ||
      challenges.trim().length>0 ||
      collaboration.trim().length>0 ||
      metrics.trim().length>0 ||
      learnings.trim().length>0 ||
      nextWeek.trim().length>0 ||
      managerComments.trim().length>0 ||
      files.length>0
    );
    if (!me) errs.push('Your identity could not be detected.');
    if (!selectedPlan) errs.push('Plan is required.');
    if (!selectedAssignment) errs.push('Assignment is required.');
    if (!submittedTo) errs.push('Recipient is required.');
    if (!hasContent) errs.push('Add report content or attach files.');
    if (frequency === 'Weekly') {
      if (!periodStart) errs.push('Week start date is required.');
      if (!periodEnd) errs.push('Week end date is required.');
    }
    if (frequency === 'Quarterly' && !quarter) errs.push('Quarter is required for Quarterly reports.');
    return errs;
  }, [me, selectedPlan, selectedAssignment, submittedTo, body, files, keyTasks, progressVsGoals, ongoing, challenges, collaboration, metrics, learnings, nextWeek, managerComments, frequency, periodStart, periodEnd, quarter]);

  const canSend = useMemo(()=> validationErrors.length === 0 && !sending, [validationErrors, sending]);

  async function submit() {
    if (!canSend) return;
    setSending(true);
    try {
      if (files.length>0) {
        const form = new FormData();
        form.append('planId', selectedPlan);
        form.append('assignmentId', selectedAssignment);
        form.append('submittedBy', me);
        form.append('submittedTo', submittedTo);
        form.append('body', body.trim());
        // Extended fields
        if (periodStart) form.append('periodStart', periodStart);
        if (periodEnd) form.append('periodEnd', periodEnd);
        if (employeeName) form.append('employeeName', employeeName);
        if (teamName) form.append('teamName', teamName);
        if (frequency) form.append('frequency', frequency);
        if (quarter) form.append('quarter', quarter);
        if (keyTasks) form.append('keyTasks', keyTasks);
        if (progressVsGoals) form.append('progressVsGoals', progressVsGoals);
        if (ongoing) form.append('ongoing', ongoing);
        if (challenges) form.append('challenges', challenges);
        if (collaboration) form.append('collaboration', collaboration);
        if (metrics) form.append('metrics', metrics);
        if (learnings) form.append('learnings', learnings);
        if (nextWeek) form.append('nextWeek', nextWeek);
        if (managerComments) form.append('managerComments', managerComments);
        files.forEach(f => form.append('files', f));
        await fetch('/api/workflow/reports', { method:'POST', body: form });
      } else {
        await fetch('/api/workflow/reports', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({
          planId: selectedPlan,
          assignmentId: selectedAssignment,
          submittedBy: me,
          submittedTo,
          body: body.trim(),
          periodStart,
          periodEnd,
          employeeName,
          teamName,
          frequency,
          quarter,
          summary: {
            keyTasks,
            progressVsGoals,
            ongoing,
            challenges,
            collaboration,
            metrics,
            learnings,
            nextWeek,
            managerComments,
          }
        }) });
      }
      setBody("");
      setFiles([]);
      setPeriodStart(""); setPeriodEnd("");
      setEmployeeName(""); setTeamName("");
      setFrequency("Weekly"); setQuarter("");
      setKeyTasks(""); setProgressVsGoals(""); setOngoing(""); setChallenges(""); setCollaboration(""); setMetrics(""); setLearnings(""); setNextWeek(""); setManagerComments("");
    } finally { setSending(false); }
  }

  return (
    <div style={{ maxWidth: 900, margin:'0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Send Report</h1>
      {validationErrors.length>0 && (
        <div style={{ marginBottom:12, padding:12, border:'1px solid #fecaca', background:'#fef2f2', color:'#991b1b', borderRadius:8 }}>
          <div style={{ fontWeight:700, marginBottom:6 }}>Please fix the following:</div>
          <ul style={{ paddingLeft: '1.2rem', margin:0 }}>
            {validationErrors.map((e,i)=> (<li key={i} style={{ listStyle:'disc' }}>{e}</li>))}
          </ul>
        </div>
      )}

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:700 }}>Plan</div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <input value={plansQ} onChange={(e)=> setPlansQ(e.target.value)} placeholder="Search plans" style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
        </div>
        <div style={{ display:'grid', gap:8 }}>
          {plans.map(pl => (
            <label key={pl.id} style={{ display:'flex', gap:8, alignItems:'flex-start', border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
              <input type="radio" name="plan" value={pl.id} checked={selectedPlan===pl.id} onChange={()=> setSelectedPlan(pl.id)} />
              <div>
                <div style={{ fontWeight:700 }}>{pl.title}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{pl.description}</div>
              </div>
            </label>
          ))}
          {plans.length===0 && <div style={{ fontSize:12, color:'#6b7280' }}>No plans found.</div>}
        </div>
      </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:700 }}>Assignment</div>
        {assignments.length===0 ? (
          <div style={{ fontSize:12, color:'#6b7280' }}>No assignments for the selected plan assigned to you.</div>
        ) : (
          <div style={{ display:'grid', gap:8 }}>
            {assignments.map(a => (
              <label key={a.id} style={{ display:'flex', gap:8, alignItems:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:8 }}>
                <input type="radio" name="assignment" value={a.id} checked={selectedAssignment===a.id} onChange={()=> { setSelectedAssignment(a.id); setSubmittedTo(a.fromUserId||''); }} />
                <div style={{ fontSize:12 }}>
                  <div><strong>{a.id}</strong> • Level {a.level} • Status {a.status}</div>
                  <div style={{ color:'#6b7280' }}>From: {a.fromUserId} • Due: {a.dueDate || '—'}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:700 }}>Reporting Details</div>
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:12, color:'#374151', marginBottom:4 }}>Week/Period Start</div>
              <input type="date" value={periodStart} onChange={(e)=> setPeriodStart(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#374151', marginBottom:4 }}>Week/Period End</div>
              <input type="date" value={periodEnd} onChange={(e)=> setPeriodEnd(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <input value={employeeName} onChange={(e)=> setEmployeeName(e.target.value)} placeholder="Employee Name" style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            <input value={teamName} onChange={(e)=> setTeamName(e.target.value)} placeholder="Team Name" style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:12, color:'#374151', marginBottom:4 }}>Reporting Frequency</div>
              <select value={frequency} onChange={(e)=> setFrequency(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Semi-Annual</option>
                <option>Yearly</option>
                <option>Other</option>
              </select>
            </div>
            {frequency === 'Quarterly' && (
              <div>
                <div style={{ fontSize:12, color:'#374151', marginBottom:4 }}>Quarter</div>
                <select value={quarter} onChange={(e)=> setQuarter(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                  <option value="">—</option>
                  <option value="Q1">Q1</option>
                  <option value="Q2">Q2</option>
                  <option value="Q3">Q3</option>
                  <option value="Q4">Q4</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:700 }}>Report</div>
        <div style={{ display:'grid', gap:8 }}>
          <textarea value={body} onChange={(e)=> setBody(e.target.value)} rows={4} placeholder="Write your report" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <div>
            <input id="report-files" type="file" multiple style={{ display:'none' }} onChange={(e)=>{
              const fs = e.target.files ? Array.from(e.target.files) : [];
              setFiles(fs);
              e.currentTarget.value='';
            }} />
            <button onClick={()=> document.getElementById('report-files')?.click()} style={{ padding:'6px 10px', background:'#111827', color:'#fff', border:'none', borderRadius:6, fontWeight:700, marginRight:8 }}>Attach files</button>
            {files.length>0 && <span style={{ fontSize:12, color:'#475569' }}>{files.length} file(s) selected</span>}
          </div>
        </div>
      </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ marginBottom:8, fontWeight:700 }}>Weekly Summary</div>
        <div style={{ display:'grid', gap:8 }}>
          <textarea value={keyTasks} onChange={(e)=> setKeyTasks(e.target.value)} rows={3} placeholder="Key Tasks Completed This Week" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={progressVsGoals} onChange={(e)=> setProgressVsGoals(e.target.value)} rows={3} placeholder="Progress vs Goals" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={ongoing} onChange={(e)=> setOngoing(e.target.value)} rows={3} placeholder="Ongoing Projects/Tasks" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={challenges} onChange={(e)=> setChallenges(e.target.value)} rows={3} placeholder="Major Challenges / Resolutions" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={collaboration} onChange={(e)=> setCollaboration(e.target.value)} rows={3} placeholder="Team Collaboration Highlights" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={metrics} onChange={(e)=> setMetrics(e.target.value)} rows={3} placeholder="Performance Metrics (e.g., % goals achieved, sales, tickets closed)" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={learnings} onChange={(e)=> setLearnings(e.target.value)} rows={3} placeholder="Learnings or Insights" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={nextWeek} onChange={(e)=> setNextWeek(e.target.value)} rows={3} placeholder="Plan for Next Week" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          <textarea value={managerComments} onChange={(e)=> setManagerComments(e.target.value)} rows={3} placeholder="Manager Comments (optional)" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
        </div>
      </section>

      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12 }}>
        <div style={{ marginBottom:8, fontWeight:700 }}>{recipientLabel}</div>
        <select value={submittedTo} onChange={(e)=> setSubmittedTo(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
          <option value="">Select recipient…</option>
          {/* Ensure the auto-filled fromUserId is available even if user list doesn't include it */}
          {submittedTo && !filteredRecipients.some(u=>u.id===submittedTo) && (
            <option value={submittedTo}>{submittedTo}</option>
          )}
          {filteredRecipients.map(u=> (
            <option key={u.id} value={u.id}>
              {u.name || u.email || u.id} {u.email && u.name ? `(${u.email})` : ''}
            </option>
          ))}
        </select>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
          <button onClick={submit} disabled={!canSend} style={{ padding:'8px 12px', background: canSend? '#2563eb' : '#9ca3af', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{sending? 'Sending...' : 'Send Report'}</button>
        </div>
      </section>
    </div>
  );
}
