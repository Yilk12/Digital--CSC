"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/http";

// Shared enums
const FIELD_PURPOSES_IN = [
  "Meeting",
  "Field Visit",
  "Training",
  "Official Duties",
  "Daily Commute",
  "Support Institutions",
];
const FIELD_PURPOSES_OUT = [
  "Meeting",
  "Field Visit",
  "Training",
  "Official Duties",
  "Daily Commute",
];

const OVERTIME_TYPES = ["Extra Time", "Weekend"] as const;
const DURATION_TYPES_FIELD = ["Half Day", "Full Day"] as const;
const DURATION_TYPES_OT = ["Half Time", "Full Day"] as const;

type UserLite = { id: string; name?: string; email?: string; role?: string; department?: string; team?: string };

type RequestType = "FIELD" | "OVERTIME";

export default function FieldOvertimePage() {
  // Identity & directory
  const [me, setMe] = useState<string>("");
  const [meName, setMeName] = useState<string>("");
  const [users, setUsers] = useState<UserLite[]>([]);

  // Shared fields
  const [requestType, setRequestType] = useState<RequestType>("FIELD");
  const [department, setDepartment] = useState<string>("");
  const [departmentHeadId, setDepartmentHeadId] = useState<string>("");
  const [purposeType, setPurposeType] = useState<string>("");
  const [justification, setJustification] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string>("");

  // Overtime specific
  const [overtimeType, setOvertimeType] = useState<typeof OVERTIME_TYPES[number]>("Extra Time");
  const [otDatesText, setOtDatesText] = useState<string>(""); // comma-separated yyyy-mm-dd list
  const [otStartTime, setOtStartTime] = useState<string>("");
  const [otEndTime, setOtEndTime] = useState<string>("");
  const [otDurationType, setOtDurationType] = useState<typeof DURATION_TYPES_OT[number]>("Half Time");

  // Field specific
  const [location, setLocation] = useState<"In Addis Ababa" | "Out of Addis Ababa">("In Addis Ababa");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [totalTime, setTotalTime] = useState<string>("");
  const [durationType, setDurationType] = useState<typeof DURATION_TYPES_FIELD[number]>("Full Day");
  const [remarks, setRemarks] = useState<string>("");

  // Load user identity from token & hydrate meName/department defaults
  useEffect(() => {
    try {
      const t = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null;
      if (t) {
        const p = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        const guess = p?.email || p?.preferred_username || p?.sub || p?.name;
        if (guess) setMe(String(guess));
        if (p?.name) setMeName(String(p.name));
      }
    } catch {}
  }, []);

  // Directory of users for department head select
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/users?page=1&pageSize=200&sort=name:asc");
        const j = await r.json();
        const items: UserLite[] = j.items || [];
        setUsers(items);
        // Infer my department
        const meUser = items.find(u => u.email === me || u.id === me || u.name === meName);
        if (meUser?.department) setDepartment(meUser.department);
        // Auto-pick dept head
        const dh = items.find(u => (u.role || "").toUpperCase() === "DEPARTMENT_HEAD" && (!meUser?.department || u.department === meUser?.department));
        if (dh) setDepartmentHeadId(dh.id);
      } catch {}
    })();
  }, [me, meName]);

  const deptHeads = useMemo(() => users.filter(u => String(u.role || "").toUpperCase() === "DEPARTMENT_HEAD"), [users]);
  const fieldPurposes = useMemo(() => (location === "In Addis Ababa" ? FIELD_PURPOSES_IN : FIELD_PURPOSES_OUT), [location]);

  // Utils
  function calcDays(a?: string, b?: string) {
    if (!a || !b) return 0;
    try {
      const A = new Date(a + "T00:00:00Z").getTime();
      const B = new Date(b + "T00:00:00Z").getTime();
      if (isNaN(A) || isNaN(B)) return 0;
      const diff = Math.round((B - A) / (24 * 60 * 60 * 1000));
      return diff >= 0 ? diff + 1 : 0;
    } catch {
      return 0;
    }
  }
  const numberOfDays = useMemo(() => calcDays(fromDate, toDate), [fromDate, toDate]);

  

  // Validation helpers
  function isHHMM(v?: string) {
    if (!v) return true;
    return /^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(v);
  }

  function validate(): string | null {
    if (!me) return "Missing requester identity";
    if (!departmentHeadId) return "Department Head is required";
    if (!purposeType) return "Purpose Type is required";
    if (!justification.trim()) return "Justification is required";

    if (requestType === "OVERTIME") {
      const dates = otDatesText.split(",").map(s => s.trim()).filter(Boolean);
      if (dates.length === 0) return "At least one date is required for overtime";
      if (!isHHMM(otStartTime) || !isHHMM(otEndTime)) return "Start/End time must be HH:MM";
    } else {
      if (!fromDate || !toDate) return "From and To dates are required";
      if (fromDate > toDate) return "From Date must be before or equal to To Date";
      if (!isHHMM(startTime) || !isHHMM(endTime)) return "Start/End time must be HH:MM";
    }
    return null;
  }

  async function submit() {
    setMessage("");
    const err = validate();
    if (err) { setMessage(err); return; }
    setSending(true);
    try {
      if (requestType === "OVERTIME") {
        const dates = otDatesText.split(",").map(s => s.trim()).filter(Boolean);
        const payload = {
          requesterId: me,
          requesterName: meName || undefined,
          department: department || undefined,
          departmentHeadId: departmentHeadId || undefined,
          requestType: "OVERTIME",
          purposeType: purposeType || undefined,
          overtimeType,
          dates,
          startTime: otStartTime || undefined,
          endTime: otEndTime || undefined,
          durationType: otDurationType,
          justification,
        };
        const res = await apiFetch("/api/workflow/overtime-requests", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Submit failed");
        setMessage(`Overtime request submitted. ID: ${j.item?.id || ""}`);
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: 'Overtime request submitted', type: 'success' } } as any)); } catch {}
        // Optional: notify department head
        if (departmentHeadId) {
          try { await fetch('/api/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ from: me, to: departmentHeadId, text: `New Overtime Request submitted (${dates.join(', ')})` }) }); } catch {}
        }
      } else {
        const payload = {
          requesterId: me,
          requesterName: meName || undefined,
          department: department || undefined,
          departmentHeadId: departmentHeadId || undefined,
          requestType: "FIELD",
          purposeType: purposeType || undefined,
          location,
          fromDate,
          toDate,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          totalTime: totalTime || undefined,
          durationType,
          justification,
          remarks: remarks || undefined,
        };
        const res = await apiFetch("/api/workflow/field-requests", { method: "POST", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const j = await res.json();
        if (!res.ok) throw new Error(j?.error || "Submit failed");
        setMessage(`Field request submitted. ID: ${j.item?.id || ""}`);
        try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: 'Field request submitted', type: 'success' } } as any)); } catch {}
        // Optional: notify department head
        if (departmentHeadId) {
          try { await fetch('/api/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ from: me, to: departmentHeadId, text: `New Field Request submitted (${fromDate}${toDate? ' → ' + toDate : ''})` }) }); } catch {}
        }
      }
      // Reset some inputs
      setJustification("");
    } catch (e: any) {
      setMessage(e?.message || "Submit failed");
    } finally { setSending(false); }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Field & Overtime Requests</h1>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={()=> setRequestType('FIELD')} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: requestType==='FIELD'? '#eef2ff' : '#fff', fontWeight: 700 }}>Field Registration</button>
        <button onClick={()=> setRequestType('OVERTIME')} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e7eb', background: requestType==='OVERTIME'? '#eef2ff' : '#fff', fontWeight: 700 }}>Overtime Registration</button>
      </div>

      {/* Shared Section */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Requester</div>
            <input value={meName || me} onChange={e=> setMeName(e.target.value)} placeholder="Auto-filled" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Department</div>
            <input value={department} onChange={e=> setDepartment(e.target.value)} placeholder="Department" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Department Head / Supervisor</div>
            <select value={departmentHeadId} onChange={e=> setDepartmentHeadId(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
              <option value="">Select</option>
              {deptHeads.map(u => (
                <option key={u.id} value={u.id}>{u.name || u.email || u.id}{u.department? ` (${u.department})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Request Type</div>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="radio" checked={requestType==='OVERTIME'} onChange={()=> setRequestType('OVERTIME')} /> Overtime
              </label>
              <label style={{ display:'flex', gap:6, alignItems:'center' }}>
                <input type="radio" checked={requestType==='FIELD'} onChange={()=> setRequestType('FIELD')} /> Field
              </label>
            </div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Purpose Type</div>
            {requestType === 'OVERTIME' ? (
              <select value={purposeType} onChange={e=> setPurposeType(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value="">Select purpose</option>
                <option value="Extra Time">Extra Time</option>
                <option value="Weekend">Weekend</option>
              </select>
            ) : (
              <select value={purposeType} onChange={e=> setPurposeType(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option value="">Select purpose</option>
                {(fieldPurposes).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Justification / Description</div>
            <textarea value={justification} onChange={e=> setJustification(e.target.value)} rows={3} placeholder="Required" style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
          </div>
        </div>
      </section>

      {/* Overtime Section */}
      {requestType === 'OVERTIME' && (
        <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Overtime Type</div>
              <select value={overtimeType} onChange={e=> setOvertimeType(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                {OVERTIME_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Date(s)</div>
              <input value={otDatesText} onChange={e=> setOtDatesText(e.target.value)} placeholder="yyyy-mm-dd[, yyyy-mm-dd]" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
              <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Enter one or more dates separated by comma.</div>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Start Time</div>
              <input type="time" value={otStartTime} onChange={e=> setOtStartTime(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>End Time</div>
              <input type="time" value={otEndTime} onChange={e=> setOtEndTime(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Duration Type</div>
              <select value={otDurationType} onChange={e=> setOtDurationType(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                {DURATION_TYPES_OT.map(t=> <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Field Section */}
      {requestType === 'FIELD' && (
        <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginBottom:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Field Location</div>
              <select value={location} onChange={e=> setLocation(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                <option>In Addis Ababa</option>
                <option>Out of Addis Ababa</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>From Date</div>
              <input type="date" value={fromDate} onChange={e=> setFromDate(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>To Date</div>
              <input type="date" value={toDate} onChange={e=> setToDate(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Number of Days</div>
              <input value={String(numberOfDays)} readOnly style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6, background:'#f3f4f6' }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Start Time (optional)</div>
              <input type="time" value={startTime} onChange={e=> setStartTime(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>End Time (optional)</div>
              <input type="time" value={endTime} onChange={e=> setEndTime(e.target.value)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Total Time (optional)</div>
              <input value={totalTime} onChange={e=> setTotalTime(e.target.value)} placeholder="e.g., 6h 00m" style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }} />
            </div>
            <div>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Duration Type</div>
              <select value={durationType} onChange={e=> setDurationType(e.target.value as any)} style={{ width:'100%', padding:'8px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>
                {DURATION_TYPES_FIELD.map(t=> <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>Remarks (optional)</div>
              <textarea value={remarks} onChange={e=> setRemarks(e.target.value)} rows={3} style={{ width:'100%', padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8 }} />
            </div>
          </div>
        </section>
      )}

      {/* Submit */}
      <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12 }}>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
          <button onClick={submit} disabled={sending || !me} style={{ padding:'8px 12px', background: sending ? '#9ca3af' : '#2563eb', color:'#fff', border:'none', borderRadius:6, fontWeight:700 }}>{sending? 'Submitting...' : (requestType==='OVERTIME'? 'Submit Overtime Request' : 'Submit Field Request')}</button>
        </div>
        {message && (
          <div style={{ marginTop:8, fontSize:13, color: message.toLowerCase().includes('submitted') ? '#047857' : '#b91c1c' }}>{message}</div>
        )}
      </section>

      {/* My Requests: status lists and export */}
      <MyRequests me={me} />
    </div>
  );
}

// --- Subcomponent: MyRequests ---
function MyRequests({ me }: { me: string }) {
  const [tab, setTab] = useState<'ALL'|'PENDING_DEPT'|'PENDING_HRM'|'APPROVED'|'REJECTED'>('ALL');
  const [type, setType] = useState<'ALL'|'FIELD'|'OVERTIME'>('ALL');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!me) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('requesterId', me);
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const [otRes, fldRes] = await Promise.all([
        fetch(`/api/workflow/overtime-requests?${qs.toString()}`),
        fetch(`/api/workflow/field-requests?${qs.toString()}`)
      ]);
      const [otJ, fldJ] = await Promise.all([otRes.json(), fldRes.json()]);
      const ot = (otJ.items||[]).map((x:any)=> ({ ...x, kind:'OVERTIME' }));
      const fld = (fldJ.items||[]).map((x:any)=> ({ ...x, kind:'FIELD' }));
      setItems([...ot, ...fld].sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt))));
    } finally { setLoading(false); }
  }

  useEffect(()=>{ load(); }, [me, from, to]);

  const filtered = items.filter(it => (tab==='ALL' ? true : it.status === tab) && (type==='ALL' ? true : it.kind === type));

  function exportCSV() {
    const headers = ['ID','Type','Status','Requester','Department','Purpose','From/Date(s)','To','Duration','CreatedAt'];
    const rows = filtered.map(it => {
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
    a.href = url; a.download = 'my-requests.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section style={{ border:'1px solid #e5e7eb', borderRadius:8, background:'#fff', padding:12, marginTop:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ fontWeight:800 }}>My Requests</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input type="date" value={from} onChange={e=> setFrom(e.target.value)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          <input type="date" value={to} onChange={e=> setTo(e.target.value)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }} />
          <select value={type} onChange={e=> setType(e.target.value as any)} style={{ padding:'6px 8px', border:'1px solid #e5e7eb', borderRadius:6 }}>
            <option value="ALL">All Types</option>
            <option value="FIELD">Field</option>
            <option value="OVERTIME">Overtime</option>
          </select>
          <button onClick={exportCSV} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>Export CSV</button>
        </div>
      </div>
      <div style={{ display:'flex', gap:6, marginBottom:8 }}>
        {(['ALL','PENDING_DEPT','PENDING_HRM','APPROVED','REJECTED'] as const).map(x=> (
          <button key={x} onClick={()=> setTab(x)} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6, background: tab===x? '#eef2ff':'#fff' }}>{x.replace('_',' ')}</button>
        ))}
        <button onClick={load} disabled={loading} style={{ marginLeft:'auto', padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:6 }}>{loading? 'Refreshing…' : 'Refresh'}</button>
      </div>
      {filtered.length===0 ? (
        <div style={{ color:'#6b7280', fontSize:13 }}>No requests.</div>
      ) : (
        <div style={{ display:'grid', gap:8 }}>
          {filtered.map((r:any)=> (
            <div key={r.id} style={{ border:'1px solid #e5e7eb', borderRadius:8, padding:10, background:'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700 }}>{r.id} • {r.kind} • {r.status.replace('_',' ')}</div>
                  <div style={{ fontSize:12, color:'#475569' }}>{r.kind==='OVERTIME' ? (r.dates||[]).join(', ') : `${r.fromDate}${r.toDate? ' → '+r.toDate : ''}`} • {new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ fontSize:12, color:'#475569' }}>{r.purposeType || r.overtimeType || ''}</div>
              </div>
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
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
