"use client"

import React from "react"
import { useSearchParams } from "next/navigation"

type TCOForm = {
  requestId: string
  purchase: number
  fuel: number
  maintenance: number
  insurance: number
  depreciation: number
  taxes: number
  financing: number
  resale: number
}

export default function FinanceTCOPage() {
  const params = useSearchParams()
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<string>("")
  const [recent, setRecent] = React.useState<any[]>([])
  const [form, setForm] = React.useState<TCOForm>({
    requestId: "",
    purchase: 0,
    fuel: 0,
    maintenance: 0,
    insurance: 0,
    depreciation: 0,
    taxes: 0,
    financing: 0,
    resale: 0,
  })

  const num = (v: any) => (isNaN(Number(v)) ? 0 : Number(v))
  const update = (k: keyof TCOForm, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const totalCosts = num(form.purchase) + num(form.fuel) + num(form.maintenance) + num(form.insurance) + num(form.depreciation) + num(form.taxes) + num(form.financing)
  const netTCO = totalCosts - num(form.resale)

  // Prefill by requestId
  React.useEffect(() => {
    const rid = params.get('requestId') || ''
    if (!rid) return
    setForm(prev => ({ ...prev, requestId: rid }))
    setLoading(true)
    fetch(`/api/fleet/requests/${encodeURIComponent(rid)}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) return
        const item = d?.item || {}
        // Basic heuristic prefill
        setForm(prev => ({
          ...prev,
          maintenance: prev.maintenance || (item?.type === 'MAINTENANCE' && typeof item?.cost === 'number' ? Number(item.cost) : prev.maintenance),
          fuel: prev.fuel || (item?.type === 'FUEL' && typeof item?.amount === 'number' && typeof item?.cost === 'number' ? Number(item.cost) : prev.fuel),
        }))
      })
      .finally(() => setLoading(false))
  }, [params])

  // Load recent TCO records
  const loadRecent = React.useCallback(() => {
    fetch('/api/finance/tco')
      .then(r => r.json())
      .then(d => setRecent(Array.isArray(d?.items) ? d.items : []))
      .catch(() => setRecent([]))
  }, [])

  React.useEffect(() => { loadRecent() }, [loadRecent])

  async function onSave() {
    try {
      setSaving(true)
      setMessage("")
      const res = await fetch('/api/finance/tco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setMessage(`Saved TCO: ${data?.item?.id}`)
      loadRecent()
    } catch (e: any) {
      setMessage(e?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function exportCSV() {
    const headers = ['id','createdAt','requestId','purchase','fuel','maintenance','insurance','depreciation','taxes','financing','resale','totalCosts','netTCO']
    const rows = [headers.join(',')]
    for (const r of recent) {
      rows.push(headers.map(h => JSON.stringify(r?.[h] ?? '')).join(','))
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tco_records.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 16, maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Finance: Total Cost of Ownership (TCO)</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#111827', fontWeight: 700 }}>Print</button>
          <button onClick={exportCSV} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#111827', fontWeight: 700 }}>Export CSV</button>
          <a href="/finance/maintenance" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#111827', fontWeight: 700, textDecoration: 'none' }}>← Back</a>
        </div>
      </div>

      {loading && <div style={{ color: '#6b7280', marginBottom: 8 }}>Loading request context…</div>}
      {message && <div style={{ marginBottom: 8, color: message.startsWith('Saved') ? '#16a34a' : '#b91c1c' }}>{message}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label style={{ fontWeight: 700 }}>Fleet Request ID (optional)</label>
          <input
            value={form.requestId}
            onChange={e => update('requestId', e.target.value)}
            placeholder="e.g. R-001"
            style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
          <small style={{ color: '#6b7280' }}>Link this calculation to a fleet manager request if applicable. You can also pass ?requestId=R-001 in the URL.</small>
        </div>

        <fieldset style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontWeight: 700 }}>1. Purchase / Lease Cost</label>
            <input type="number" min={0} value={form.purchase} onChange={e => update('purchase', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Initial cost incl. upfit/accessories.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>2. Fuel Costs</label>
            <input type="number" min={0} value={form.fuel} onChange={e => update('fuel', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Based on expected consumption and mileage.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>3. Maintenance & Repairs</label>
            <input type="number" min={0} value={form.maintenance} onChange={e => update('maintenance', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Scheduled and unexpected repairs, parts and labor.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>4. Insurance</label>
            <input type="number" min={0} value={form.insurance} onChange={e => update('insurance', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Liability, collision, comprehensive premiums.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>5. Depreciation</label>
            <input type="number" min={0} value={form.depreciation} onChange={e => update('depreciation', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Reduction in value over time.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>6. Taxes & Fees</label>
            <input type="number" min={0} value={form.taxes} onChange={e => update('taxes', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Registration, road taxes, inspections.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>7. Financing Costs</label>
            <input type="number" min={0} value={form.financing} onChange={e => update('financing', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Interest and admin charges.</small>
          </div>
          <div>
            <label style={{ fontWeight: 700 }}>8. Disposal / Resale Value</label>
            <input type="number" min={0} value={form.resale} onChange={e => update('resale', num(e.target.value))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d1d5db' }} />
            <small style={{ color: '#6b7280' }}>Revenue recovered at end of life (subtracts).</small>
          </div>
        </fieldset>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div><strong>Total Costs:</strong> {totalCosts.toLocaleString()}</div>
            <div><strong>Minus Resale:</strong> -{num(form.resale).toLocaleString()}</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>
              Net TCO: {netTCO.toLocaleString()}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <button onClick={onSave} disabled={saving} style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: saving ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 800 }}>
              {saving ? 'Saving…' : 'Save TCO Record'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Recent TCO Records</h2>
        {recent.length === 0 ? (
          <div style={{ color: '#6b7280' }}>No records yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID','Created','Request ID','Net TCO','Total Costs','Depreciation','Insurance','Maintenance','Fuel','Purchase'].map(h => (
                    <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 6px', color: '#6b7280', fontWeight: 700, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((r: any) => (
                  <tr key={r.id}>
                    <td style={{ padding: '8px 6px' }}>
                      <a href={`/finance/tco/${encodeURIComponent(r.id)}`} className="text-blue-600 hover:underline">{r.id}</a>
                    </td>
                    <td style={{ padding: '8px 6px' }}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '8px 6px' }}>{r.requestId || '-'}</td>
                    <td style={{ padding: '8px 6px', fontWeight: 800 }}>{r.netTCO}</td>
                    <td style={{ padding: '8px 6px' }}>{r.totalCosts}</td>
                    <td style={{ padding: '8px 6px' }}>{r.depreciation}</td>
                    <td style={{ padding: '8px 6px' }}>{r.insurance}</td>
                    <td style={{ padding: '8px 6px' }}>{r.maintenance}</td>
                    <td style={{ padding: '8px 6px' }}>{r.fuel}</td>
                    <td style={{ padding: '8px 6px' }}>{r.purchase}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
