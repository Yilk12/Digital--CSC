"use client"

import React from "react"
import Link from "next/link"
import { decodeJwt } from "@/app/lib/auth"

function getRolesFromToken(): string[] {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
    if (!token) return []
    const p: any = decodeJwt(token)
    const roles: string[] = []
    if (typeof p?.role === 'string') roles.push(p.role)
    if (Array.isArray(p?.role)) roles.push(...p.role)
    if (Array.isArray(p?.roles)) roles.push(...p.roles)
    if (p?.realm_access?.roles) roles.push(...p.realm_access.roles)
    if (p?.resource_access) { for (const v of Object.values(p.resource_access)) { const rr = (v as any)?.roles; if (Array.isArray(rr)) roles.push(...rr) } }
    return roles.map(r=>String(r).toLowerCase())
  } catch { return [] }
}

function getDepartmentFromToken(): string | null {
  try {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
    if (!token) return null
    const p: any = decodeJwt(token)
    const fields = ["department","dept","department_name","organization","org","ou"]
    for (const f of fields) {
      const v = p?.[f]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return null
  } catch { return null }
}

export function FleetInboxToggle() {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<any[]>([])
  const roles = React.useMemo(() => getRolesFromToken(), [])
  const myDept = React.useMemo(() => getDepartmentFromToken(), [])

  const isUser = roles.includes('user') || roles.includes('employee')
  const isDeptHead = roles.includes('department_head') || roles.includes('head')
  const isDriver = roles.includes('driver') || roles.includes('drivers')
  const isManager = roles.includes('manager') || roles.includes('fleet_manager') || roles.includes('admin')

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/fleet/requests')
      const d = await r.json()
      const arr = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : []
      setItems(arr)
    } catch { setItems([]) } finally { setLoading(false) }
  }

  React.useEffect(() => { if (open) load() }, [open])

  // Filters per role
  const userList = React.useMemo(() => {
    if (!isUser) return []
    const uid = (() => { try { return localStorage.getItem('userId') || '' } catch { return '' } })()
    return items.filter((r:any) => (r.ownerId === uid || r.userId === uid) && !['CANCELED','REJECTED','SCHEDULED','COMPLETED'].includes(String(r.status).toUpperCase()))
  }, [items, isUser])

  const deptList = React.useMemo(() => {
    if (!isDeptHead) return []
    const dept = myDept?.toLowerCase()
    return items.filter((r:any) => String(r.status).toUpperCase() === 'CONFIRMED' && (!dept || String(r.department||'').toLowerCase() === dept))
  }, [items, isDeptHead, myDept])

  const managerList = React.useMemo(() => {
    if (!isManager) return []
    return items.filter((r:any) => String(r.status).toUpperCase() === 'APPROVED')
  }, [items, isManager])

  const driverList = React.useMemo(() => {
    if (!isDriver) return []
    return items.filter((r:any) => String(r.status).toUpperCase() === 'SCHEDULED')
  }, [items, isDriver])

  const total = userList.length + deptList.length + managerList.length + driverList.length

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(v=>!v)}
        title="Fleet Inbox"
        style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontWeight: 700, color: '#135a98' }}
      >
        🚗 {total > 0 ? `(${total})` : ''}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: 360, maxWidth: '86vw', padding: 8, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px' }}>
            <div style={{ fontWeight: 700, color: '#135a98' }}>Fleet Requests</div>
            <div>
              <button onClick={load} style={{ background: 'transparent', border: 'none', color: '#135a98', cursor: 'pointer', fontWeight: 700 }}>Refresh</button>
              <button onClick={() => setOpen(false)} style={{ marginLeft: 8, background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}>Close</button>
            </div>
          </div>

          {loading && <div style={{ padding: 8, fontSize: 12, color: '#666' }}>Loading...</div>}

          {!loading && (
            <div style={{ display: 'grid', gap: 10 }}>
              {isUser && (
                <section>
                  <div style={{ fontWeight: 600, margin: '6px 0' }}>My Pending</div>
                  {userList.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>No items</div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {userList.slice(0,5).map((r:any) => (
                        <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.purpose || r.title || r.id}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{r.date?.slice(0,10) || r.datetime?.slice(0,10)} • {String(r.status)}</div>
                          </div>
                          <Link href="/fleet/user" className="nav-link">Open</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {isDeptHead && (
                <section>
                  <div style={{ fontWeight: 600, margin: '6px 0' }}>Department Approvals</div>
                  {deptList.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>No items</div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {deptList.slice(0,5).map((r:any) => (
                        <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.purpose || r.title || r.id}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{r.department || '-'} • {r.date?.slice(0,10) || r.datetime?.slice(0,10)}</div>
                          </div>
                          <Link href="/fleet/department" className="nav-link">Open</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {isManager && (
                <section>
                  <div style={{ fontWeight: 600, margin: '6px 0' }}>Manager Scheduling</div>
                  {managerList.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>No items</div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {managerList.slice(0,5).map((r:any) => (
                        <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.purpose || r.title || r.id}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{r.destination || '-'} • {r.date?.slice(0,10) || r.datetime?.slice(0,10)}</div>
                          </div>
                          <Link href="/fleet/department" className="nav-link">Open</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {isDriver && (
                <section>
                  <div style={{ fontWeight: 600, margin: '6px 0' }}>Driver Assignments</div>
                  {driverList.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#666' }}>No items</div>
                  ) : (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                      {driverList.slice(0,5).map((r:any) => (
                        <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 4px', borderBottom: '1px solid #f3f4f6' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.purpose || r.title || r.id}</div>
                            <div style={{ fontSize: 12, color: '#666' }}>{r.destination || '-'} • {r.date?.slice(0,10) || r.datetime?.slice(0,10)}</div>
                          </div>
                          <span style={{ fontSize: 12, color: '#135a98', fontWeight: 700 }}>View</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
