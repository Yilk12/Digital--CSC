"use client";

import React, { useEffect, useMemo, useState } from "react";
import AttachmentUploader from "../../../components/attachment-uploader";

type Plan = { id: string; title: string; description?: string; owner?: string; status?: string; attachments?: Array<{ id?: string; name?: string; url?: string; dataUrl?: string; size?: number; type?: string; uploadedAt?: string; by?: string }> };
type PlanWithFlow = Plan & { route?: { chain: string[]; current?: string }; approvals?: Array<{ stage: string; by?: string; at?: string; decision?: string; comments?: string }> };
type User = { id: string; name: string; email?: string; role?: string };

export default function DistributePlanPage() {
  const [plans, setPlans] = useState<PlanWithFlow[]>([]);
  const [plansQ, setPlansQ] = useState("");
  const [planPage, setPlanPage] = useState(1);
  const [planTotal, setPlanTotal] = useState(0);
  const [planPageSize, setPlanPageSize] = useState(10);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const [heads, setHeads] = useState<User[]>([]);
  const [headsQ, setHeadsQ] = useState("");
  const [selectedHeads, setSelectedHeads] = useState<string[]>([]);

  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [created, setCreated] = useState<any[]>([]);
  const [createdPage, setCreatedPage] = useState(1);
  const [createdPageSize, setCreatedPageSize] = useState(10);

  const me = "U-002"; // TODO: map from JWT if needed

  const selectedPlanObj = useMemo(()=> plans.find(p=> p.id === selectedPlan), [plans, selectedPlan]);

  async function loadPlans() {
    const url = `/api/planning?page=${planPage}&pageSize=${planPageSize}${plansQ ? `&q=${encodeURIComponent(plansQ)}` : ''}`;
    const res = await fetch(url);
    const j = await res.json();
    setPlans(j.items || []);
    setPlanTotal(j.total || 0);
    if (!selectedPlan && (j.items||[]).length>0) setSelectedPlan(j.items[0].id);
  }

  async function loadHeads() {
    const url = `/api/users?page=1&pageSize=100&role=DEPARTMENT_HEAD${headsQ ? `&q=${encodeURIComponent(headsQ)}` : ''}`;
    const res = await fetch(url);
    const j = await res.json();
    setHeads(j.items || []);
  }

  useEffect(()=>{ loadPlans(); }, [plansQ, planPage, planPageSize]);
  useEffect(()=>{ loadHeads(); }, [headsQ]);

  const canSubmit = useMemo(()=> !!selectedPlan && selectedHeads.length>0 && !submitting, [selectedPlan, selectedHeads, submitting]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/workflow/plans/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, toUsers: selectedHeads, by: me, dueDate: dueDate || undefined, notes: notes || undefined })
      });
      const j = await res.json();
      if (j?.ok) {
        setCreated(j.items || []);
        setCreatedPage(1);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const createdPaged = useMemo(()=>{
    const start = (createdPage-1)*createdPageSize;
    return created.slice(start, start+createdPageSize);
  }, [created, createdPage, createdPageSize]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Distribute Plan</h1>

      <div style={{ display:'grid', gap: 12 }}>
        {/* Select Plan */}
        <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Select Plan</div>
          <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 8 }}>
            <input value={plansQ} onChange={(e)=> setPlansQ(e.target.value)} placeholder="Search plans" style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius: 6 }} />
            <label style={{ fontSize: 12, color:'#475569' }}>Rows</label>
            <select value={planPageSize} onChange={(e)=>{ setPlanPageSize(parseInt(e.target.value,10)||10); setPlanPage(1); }} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <button onClick={()=> setPlanPage(p=> Math.max(1, p-1))} disabled={planPage<=1} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: planPage<=1?'#e5e7eb':'#f3f4f6' }}>Prev</button>
            <button onClick={()=> setPlanPage(p=> (p*planPageSize<planTotal? p+1 : p))} disabled={planPage*planPageSize>=planTotal} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: planPage*planPageSize>=planTotal?'#e5e7eb':'#f3f4f6' }}>Next</button>
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {plans.map(pl => (
              <label key={pl.id} style={{ display:'flex', gap:8, alignItems:'flex-start', border:'1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                <input type="radio" name="plan" value={pl.id} checked={selectedPlan===pl.id} onChange={()=> setSelectedPlan(pl.id)} />
                <div>
                  <div style={{ fontWeight: 700 }}>{pl.title}</div>
                  <div style={{ fontSize: 12, color:'#6b7280' }}>{pl.description}</div>
                  {pl.route?.current && (
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize:11, background:'#e0f2fe', color:'#0369a1', border:'1px solid #bae6fd', borderRadius:999, padding:'2px 8px' }}>Stage: {pl.route.current}</span>
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Plan Attachments */
        }
        <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Attach Files to Selected Plan</div>
          {!selectedPlan ? (
            <div style={{ color:'#6b7280', fontSize:13 }}>Select a plan first to enable attachments.</div>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <AttachmentUploader
                action="/api/planning/attachments"
                method="multipart"
                fieldName="files"
                extraFields={{ id: selectedPlan }}
                buttonLabel="Choose files"
                multiple
                onUploaded={(j)=>{ /* refresh current list so attachments render */ loadPlans(); }}
              />
              <div style={{ fontSize:12, color:'#6b7280' }}>Uploads go to <code>/api/planning/attachments</code> and are linked with plan <strong>{selectedPlan}</strong>.</div>
            </div>
          )}
          {selectedPlanObj && Array.isArray(selectedPlanObj.attachments) && selectedPlanObj.attachments.length>0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Existing Attachments</div>
              <div style={{ display:'grid', gap:6 }}>
                {selectedPlanObj.attachments.map((a, idx)=> (
                  <div key={a.id || idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px' }}>
                    <div>
                      <div style={{ fontWeight:600 }}>{a.name || a.id || 'File'}</div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>{a.type || ''} {a.size?`• ${(a.size/1024).toFixed(1)} KB`:''} {a.by?`• by ${a.by}`:''} {a.uploadedAt?`• ${new Date(a.uploadedAt).toLocaleString()}`:''}</div>
                    </div>
                    {(a.url || a.dataUrl) && (
                      <a href={a.url || a.dataUrl} target="_blank" rel="noreferrer" style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, textDecoration:'none', color:'#2563eb' }}>Open</a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedPlanObj && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight:700, marginBottom:6 }}>Approvals</div>
              {(!selectedPlanObj.approvals || selectedPlanObj.approvals.length===0) ? (
                <div style={{ fontSize:12, color:'#6b7280' }}>No approvals yet.</div>
              ) : (
                <div style={{ display:'grid', gap:6 }}>
                  {selectedPlanObj.approvals!.map((ap, i)=> (
                    <div key={i} style={{ border:'1px solid #e5e7eb', borderRadius:6, padding:'6px 8px', fontSize:12 }}>
                      <strong>{ap.stage}</strong> • {ap.decision || 'REVIEW'} by {ap.by || 'unknown'} at {ap.at ? new Date(ap.at).toLocaleString() : '—'} {ap.comments?`• ${ap.comments}`:''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Choose Department Heads */}
        <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Choose Department Heads</div>
          <div style={{ display:'flex', gap: 8, alignItems:'center', marginBottom: 8 }}>
            <input value={headsQ} onChange={(e)=> setHeadsQ(e.target.value)} placeholder="Search department heads" style={{ flex:1, padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius: 6 }} />
          </div>
          <div style={{ display:'grid', gap:8 }}>
            {heads.map(h => (
              <label key={h.id} style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="checkbox" checked={selectedHeads.includes(h.id)} onChange={(e)=>{
                  setSelectedHeads(prev=> e.target.checked ? Array.from(new Set([...prev, h.id])) : prev.filter(x=> x!==h.id));
                }} />
                <span>{h.name} {h.email?`(${h.email})`:''}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Meta */}
        <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Meta</div>
          <div style={{ display:'flex', gap: 12, alignItems:'center', flexWrap:'wrap' }}>
            <div>
              <label style={{ display:'block', fontSize: 12, color:'#475569', marginBottom: 4 }}>Due date</label>
              <input type="date" value={dueDate} onChange={(e)=> setDueDate(e.target.value)} style={{ padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:'block', fontSize: 12, color:'#475569', marginBottom: 4 }}>Notes</label>
              <input value={notes} onChange={(e)=> setNotes(e.target.value)} placeholder="Optional notes" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div style={{ marginLeft:'auto' }}>
              <button onClick={onSubmit} disabled={!canSubmit} style={{ padding:'8px 12px', background: canSubmit? '#2563eb':'#9ca3af', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{submitting? 'Sending...' : 'Distribute'}</button>
            </div>
          </div>
        </section>

        {/* Created assignments */}
        <section style={{ border:'1px solid #e5e7eb', borderRadius: 8, background:'#fff', padding: 12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700 }}>Created Assignments</div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <label style={{ fontSize: 12, color:'#475569' }}>Rows</label>
              <select value={createdPageSize} onChange={(e)=>{ setCreatedPageSize(parseInt(e.target.value,10)||10); setCreatedPage(1); }} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
              <button onClick={()=> setCreatedPage(p=> Math.max(1, p-1))} disabled={createdPage<=1} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: createdPage<=1?'#e5e7eb':'#f3f4f6' }}>Prev</button>
              <button onClick={()=> setCreatedPage(p=> ((p*createdPageSize)<created.length ? p+1 : p))} disabled={createdPage*createdPageSize>=created.length} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6, background: createdPage*createdPageSize>=created.length?'#e5e7eb':'#f3f4f6' }}>Next</button>
            </div>
          </div>
          {created.length===0 ? (
            <div style={{ color:'#6b7280', fontSize:13 }}>Nothing created yet.</div>
          ) : (
            <div style={{ display:'grid', gap:8 }}>
              {createdPaged.map(a=> (
                <div key={a.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10 }}>
                  <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>
                    <strong>{a.id}</strong> • Plan {a.planId} • Level {a.level}
                  </div>
                  <div style={{ fontSize:12 }}>To: {a.toUserId}</div>
                  {a.dueDate && <div style={{ fontSize:12 }}>Due: {a.dueDate}</div>}
                  {a.notes && <div style={{ fontSize:12 }}>Notes: {a.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
