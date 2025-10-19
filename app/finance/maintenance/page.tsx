"use client"

import React, { useEffect, useState } from "react"

export default function FinanceMaintenancePage() {
  const [batches, setBatches] = useState<any[]>([])
  const [msg, setMsg] = useState("")

  const load = async () => {
    const res = await fetch('/api/finance/maintenance', { credentials: 'include' })
    const data = await res.json()
    if (res.ok) setBatches(data?.data||[])
  }

  useEffect(() => { load() }, [])

  const markPaid = async (batchId: string) => {
    setMsg("")
    const res = await fetch('/api/finance/maintenance/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ batchId })
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data?.error||'Error'); return }
    setMsg(`Batch ${data?.data?.id} marked as PAID`)
    load()
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Finance: Maintenance Batches</h1>
        <a
          href="/finance/tco"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#2563eb',
            color: '#fff',
            fontWeight: 800,
            textDecoration: 'none'
          }}
        >
          Total Cost of Ownership
        </a>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {batches.length === 0 && <div style={{ color: '#6b7280' }}>No batches queued.</div>}
        {batches.map(b => (
          <div key={b.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div><strong>ID:</strong> {b.id} <span style={{ marginLeft: 8, color: '#6b7280' }}>({b.status})</span></div>
                <div><strong>Period:</strong> {b.period}</div>
                <div><strong>Total Amount:</strong> {b.totalAmount}</div>
                <div><strong>Requests:</strong> {b.requestIds?.join(', ')}</div>
              </div>
              <div>
                <button disabled={b.status === 'PAID'} onClick={()=>markPaid(b.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: b.status==='PAID' ? '#9ca3af' : '#16a34a', color: '#fff', fontWeight: 800, cursor: b.status==='PAID' ? 'default' : 'pointer' }}>Mark Paid</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {msg && <div style={{ fontSize: 13, color: msg.includes('PAID') ? '#16a34a' : '#b91c1c', marginTop: 10 }}>{msg}</div>}
    </div>
  )
}
