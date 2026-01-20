"use client"

import { useEffect, useState } from "react"
import { getCurrentUserRoles, decodeJwt } from "@/app/lib/auth"
import { DEPARTMENTS } from "@/backend/lib/fleet"

export default function FleetDepartmentPage() {
  const roles = getCurrentUserRoles().map(r => r.toLowerCase())
  const canDeptApprove = roles.includes("department_head") || roles.includes("manager") || roles.includes("admin")
  const isDeptHead = roles.includes("department_head") || roles.includes("admin")
  const isManager = roles.includes("manager") || roles.includes("admin")

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const [deptFilter, setDeptFilter] = useState("")
  const [myDept, setMyDept] = useState<string>("")
  const [restrictToMine, setRestrictToMine] = useState<boolean>(false)
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MAINTENANCE" | "FUEL" | "ISSUE" | "OTHER">("ALL")

  // Initialize from URL ?dept=Finance if provided
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const d = sp.get('dept') || ''
    if (d) {
      setDeptFilter(d)
      // if matches a known department, also set myDept so restrict toggle can apply
      const match = DEPARTMENTS.find(x => x.toLowerCase() === d.toLowerCase())
      if (match) setMyDept(match)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async () => {
    try {
      const r = await fetch("/api/fleet/requests")
      const d = await r.json()
      setRequests(Array.isArray(d?.items) ? d.items : [])
    } catch {
      setRequests([])
    }
  }
  useEffect(() => {
    // restore my department preference
    try {
      const savedDept = localStorage.getItem("my-department") || ""
      const savedRestrict = localStorage.getItem("restrict-to-my-dept") === "1"
      if (savedDept) setMyDept(savedDept)
      setRestrictToMine(savedRestrict)
      // If no saved department, try to infer from JWT claims
      if (!savedDept) {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token") ||
          null
        if (token) {
          const claims = decodeJwt(token as string) as any
          const rawDept =
            claims?.department ||
            claims?.dept ||
            claims?.department_name ||
            claims?.org ||
            claims?.organization ||
            claims?.ou ||
            ""
          if (rawDept && typeof rawDept === "string") {
            // try to match one of DEPARTMENTS by case-insensitive contains
            const found = DEPARTMENTS.find(d => rawDept.toLowerCase().includes(d.toLowerCase()))
            if (found) {
              setMyDept(found)
              // default to restrict when inferred
              setRestrictToMine(true)
              try { localStorage.setItem("my-department", found); localStorage.setItem("restrict-to-my-dept", "1") } catch {}
            }
          }
        }
      }
    } catch {}
    load()
  }, [])

  const act = async (url: string, body: any) => {
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Failed")
      setMsg("Action completed")
      await load()
    } catch(e:any) { setMsg(e?.message || "Failed") } finally { setLoading(false) }
  }

  const confirmUser = (r:any) => act("/api/fleet/approvals/user", { requestId: r.id, status: "CONFIRMED" })
  const approveDept = (r:any) => act("/api/fleet/approvals/department", { requestId: r.id, status: "APPROVED" })
  const rejectDept = (r:any) => act("/api/fleet/approvals/department", { requestId: r.id, status: "REJECTED" })
  const scheduleMgr = (r:any) => act("/api/fleet/approvals/manager", { requestId: r.id, status: "SCHEDULED" })
  const rejectMgr = (r:any) => act("/api/fleet/approvals/manager", { requestId: r.id, status: "REJECTED" })

  const filtered = requests.filter(r => {
    const dept = (r.department || "")
    const byFilter = !deptFilter || dept === deptFilter
    const byMine = !restrictToMine || !myDept || dept === myDept
    // type filter logic
    const t = String(r.type || r.category || "").toUpperCase()
    const byType =
      typeFilter === "ALL" ? true :
      typeFilter === "MAINTENANCE" ? t.includes("MAINTENANCE") :
      typeFilter === "FUEL" ? t.includes("FUEL") :
      typeFilter === "ISSUE" ? t.includes("ISSUE") :
      // OTHER = anything not matched above
      (!t.includes("MAINTENANCE") && !t.includes("FUEL") && !t.includes("ISSUE"))
    return byFilter && byMine && byType
  })

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold">Department – Requests Approval</h1>
      <div className="text-sm text-gray-600">Use this page for both users (confirm) and department heads (approve/reject).</div>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="border rounded p-4">
        <div className="font-semibold mb-2">Requests</div>
        <div className="flex items-end gap-3 mb-3">
          <div>
            <label className="block text-xs">Department</label>
            <select className="border rounded p-2" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
              <option value="">All</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          {canDeptApprove && (
            <>
              <div>
                <label className="block text-xs">My Department</label>
                <select
                  className="border rounded p-2"
                  value={myDept}
                  onChange={e=>{
                    const v = e.target.value; setMyDept(v); try { localStorage.setItem("my-department", v) } catch {}
                  }}
                >
                  <option value="">-- Select --</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input id="restrict" type="checkbox" checked={restrictToMine} onChange={e=>{ const v = e.target.checked; setRestrictToMine(v); try { localStorage.setItem("restrict-to-my-dept", v ? "1" : "0") } catch {} }} />
                <label htmlFor="restrict" className="text-sm">Restrict to my department</label>
              </div>
            </>
          )}
          <button type="button" className="px-3 py-2 border rounded" onClick={()=>setDeptFilter("")}>Clear</button>
          {/* Type tabs for Finance: Maintenance, Fuel, Issues */}
          <div className="ml-auto flex items-center gap-2">
            {(["ALL","MAINTENANCE","FUEL","ISSUE","OTHER"] as const).map(t => (
              <button
                key={t}
                type="button"
                className={`px-3 py-1.5 rounded border text-sm ${typeFilter===t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                onClick={()=>setTypeFilter(t)}
                title={t === 'OTHER' ? 'Other requests' : t}
              >{t}</button>
            ))}
          </div>
        </div>
        {/* Type-specific interfaces */}
        {filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">No requests</div>
        ) : (
          <>
            {typeFilter === 'MAINTENANCE' && (
              <div className="overflow-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border">ID</th>
                      <th className="text-left p-2 border">Date</th>
                      <th className="text-left p-2 border">Vehicle</th>
                      <th className="text-left p-2 border">Severity</th>
                      <th className="text-left p-2 border">Est. Cost</th>
                      <th className="text-left p-2 border">Description</th>
                      <th className="text-left p-2 border">Status</th>
                      <th className="text-left p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td className="p-2 border">{r.id}</td>
                        <td className="p-2 border">{r.date || r.datetime?.slice(0,10)}</td>
                        <td className="p-2 border">{r.vehicleId || '-'}</td>
                        <td className="p-2 border">{r.severity ?? '-'}</td>
                        <td className="p-2 border">{typeof r.cost !== 'undefined' ? r.cost : '-'}</td>
                        <td className="p-2 border">{r.description || '-'}</td>
                        <td className="p-2 border">{r.status}</td>
                        <td className="p-2 border whitespace-nowrap">
                          {r.status === "PENDING" && (
                            <button className="px-2 py-1 border rounded" disabled={loading} onClick={()=>confirmUser(r)}>Confirm</button>
                          )}
                          {isDeptHead && r.status === "CONFIRMED" && (
                            <>
                              <button className="ml-2 px-2 py-1 border rounded" disabled={loading} onClick={()=>approveDept(r)}>Approve</button>
                              <button className="ml-2 px-2 py-1 border rounded text-red-700" disabled={loading} onClick={()=>rejectDept(r)}>Reject</button>
                            </>
                          )}
                          {isManager && r.status === "APPROVED" && (
                            <>
                              <button className="ml-2 px-2 py-1 border rounded" disabled={loading} onClick={()=>scheduleMgr(r)}>Schedule</button>
                              <button className="ml-2 px-2 py-1 border rounded text-red-700" disabled={loading} onClick={()=>rejectMgr(r)}>Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {typeFilter === 'FUEL' && (
              <div className="overflow-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border">ID</th>
                      <th className="text-left p-2 border">Date</th>
                      <th className="text-left p-2 border">Vehicle</th>
                      <th className="text-left p-2 border">Fuel Type</th>
                      <th className="text-left p-2 border">Amount</th>
                      <th className="text-left p-2 border">Cost</th>
                      <th className="text-left p-2 border">Status</th>
                      <th className="text-left p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td className="p-2 border">{r.id}</td>
                        <td className="p-2 border">{r.date || r.datetime?.slice(0,10)}</td>
                        <td className="p-2 border">{r.vehicleId || '-'}</td>
                        <td className="p-2 border">{r.fuelType || '-'}</td>
                        <td className="p-2 border">{r.fuelAmount ?? r.liters ?? '-'}</td>
                        <td className="p-2 border">{typeof r.cost !== 'undefined' ? r.cost : '-'}</td>
                        <td className="p-2 border">{r.status}</td>
                        <td className="p-2 border whitespace-nowrap">
                          {r.status === "PENDING" && (
                            <button className="px-2 py-1 border rounded" disabled={loading} onClick={()=>confirmUser(r)}>Confirm</button>
                          )}
                          {isDeptHead && r.status === "CONFIRMED" && (
                            <>
                              <button className="ml-2 px-2 py-1 border rounded" disabled={loading} onClick={()=>approveDept(r)}>Approve</button>
                              <button className="ml-2 px-2 py-1 border rounded text-red-700" disabled={loading} onClick={()=>rejectDept(r)}>Reject</button>
                            </>
                          )}
                          {isManager && r.status === "APPROVED" && (
                            <>
                              <button className="ml-2 px-2 py-1 border rounded" disabled={loading} onClick={()=>scheduleMgr(r)}>Schedule</button>
                              <button className="ml-2 px-2 py-1 border rounded text-red-700" disabled={loading} onClick={()=>rejectMgr(r)}>Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {(typeFilter === 'ISSUE' || typeFilter === 'OTHER') && (
              <div className="overflow-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 border">ID</th>
                      <th className="text-left p-2 border">Date</th>
                      <th className="text-left p-2 border">Department</th>
                      <th className="text-left p-2 border">Details</th>
                      <th className="text-left p-2 border">Status</th>
                      <th className="text-left p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id}>
                        <td className="p-2 border">{r.id}</td>
                        <td className="p-2 border">{r.date || r.datetime?.slice(0,10)}</td>
                        <td className="p-2 border">{r.department || '-'}</td>
                        <td className="p-2 border">
                          <div className="font-medium">{r.purpose || r.title || '-'}</div>
                          <div className="text-gray-600">{r.description || r.details || '-'}</div>
                        </td>
                        <td className="p-2 border">{r.status}</td>
                        <td className="p-2 border whitespace-nowrap">
                          {r.status === "PENDING" && (
                            <button className="px-2 py-1 border rounded" disabled={loading} onClick={()=>confirmUser(r)}>Confirm</button>
                          )}
                          {isDeptHead && r.status === "CONFIRMED" && (
                            <>
                              <button className="ml-2 px-2 py-1 border rounded" disabled={loading} onClick={()=>approveDept(r)}>Approve</button>
                              <button className="ml-2 px-2 py-1 border rounded text-red-700" disabled={loading} onClick={()=>rejectDept(r)}>Reject</button>
                            </>
                          )}
                          {isManager && r.status === "APPROVED" && (
                            <>
                              <button className="ml-2 px-2 py-1 border rounded" disabled={loading} onClick={()=>scheduleMgr(r)}>Schedule</button>
                              <button className="ml-2 px-2 py-1 border rounded text-red-700" disabled={loading} onClick={()=>rejectMgr(r)}>Reject</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
