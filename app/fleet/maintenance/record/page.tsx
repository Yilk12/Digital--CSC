"use client"

import React, { useState } from "react"

export default function DriverMaintenanceRecordPage() {
  const [form, setForm] = useState({
    driverId: "",
    vehicleId: "",
    incidentId: "",
    incidentDate: "",
    incidentSeverity: "LOW" as "HIGH"|"LOW",
    description: "",
    organization: "",
    receiptPeriod: "Daily" as "Daily"|"Weekly"|"Monthly"|"Yearly",
  })
  const [receipts, setReceipts] = useState<Array<{organization: string; number?: string; date?: string; amount: number; currency?: string; fileName?: string; fileUrl?: string}>>([])
  const [msg, setMsg] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const addReceipt = () => setReceipts(r => [...r, { organization: form.organization || "", amount: 0, currency: "ETB" }])
  const updateReceipt = (idx: number, patch: any) => setReceipts(r => r.map((x,i)=> i===idx ? { ...x, ...patch } : x))
  const removeReceipt = (idx: number) => setReceipts(r => r.filter((_,i)=>i!==idx))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch("/api/fleet/maintenance/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          receipts,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed")
      setMsg("Saved maintenance record " + data?.data?.id)
      setReceipts([])
    } catch (e: any) {
      setMsg(e?.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Driver Maintenance Record</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 800 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input placeholder="Driver ID" value={form.driverId} onChange={e=>setForm({...form, driverId: e.target.value})} required style={s.input} />
          <input placeholder="Vehicle ID" value={form.vehicleId} onChange={e=>setForm({...form, vehicleId: e.target.value})} style={s.input} />
          <input type="date" placeholder="Incident Date" value={form.incidentDate} onChange={e=>setForm({...form, incidentDate: e.target.value})} style={s.input} />
          <select value={form.incidentSeverity} onChange={e=>setForm({...form, incidentSeverity: e.target.value as any})} style={s.input}>
            <option value="LOW">Low</option>
            <option value="HIGH">High</option>
          </select>
          <input placeholder="Incident ID (optional)" value={form.incidentId} onChange={e=>setForm({...form, incidentId: e.target.value})} style={s.input} />
          <select value={form.receiptPeriod} onChange={e=>setForm({...form, receiptPeriod: e.target.value as any})} style={s.input}>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Yearly</option>
          </select>
        </div>
        <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} style={s.textarea} />
        <input placeholder="Organization (garage/vendor)" value={form.organization} onChange={e=>setForm({...form, organization: e.target.value})} style={s.input} />

        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong>Receipts</strong>
            <button type="button" onClick={addReceipt} style={s.btnAdd}>+ Add receipt</button>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {receipts.map((r, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr auto', gap: 6 }}>
                <input placeholder="Organization" value={r.organization} onChange={e=>updateReceipt(idx, { organization: e.target.value })} style={s.input} />
                <input placeholder="Number" value={r.number||''} onChange={e=>updateReceipt(idx, { number: e.target.value })} style={s.input} />
                <input type="date" value={r.date||''} onChange={e=>updateReceipt(idx, { date: e.target.value })} style={s.input} />
                <input type="number" placeholder="Amount" value={r.amount} onChange={e=>updateReceipt(idx, { amount: Number(e.target.value||0) })} style={s.input} />
                <input placeholder="Currency" value={r.currency||'ETB'} onChange={e=>updateReceipt(idx, { currency: e.target.value })} style={s.input} />
                <input placeholder="Receipt URL (optional)" value={r.fileUrl||''} onChange={e=>updateReceipt(idx, { fileUrl: e.target.value })} style={s.input} />
                <button type="button" onClick={()=>removeReceipt(idx)} style={s.btnRemove}>Remove</button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} style={s.btnPrimary}>{loading ? 'Saving...' : 'Save Record'}</button>
        {msg && <div style={{ fontSize: 13, color: msg.startsWith('Saved') ? '#16a34a' : '#b91c1c' }}>{msg}</div>}
      </form>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' },
  textarea: { padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 },
  btnAdd: { padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' },
  btnRemove: { padding: '6px 10px', borderRadius: 6, border: '1px solid #ef4444', background: '#fff', color: '#b91c1c', cursor: 'pointer' },
  btnPrimary: { padding: '10px 12px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, cursor: 'pointer', width: 200 }
}
