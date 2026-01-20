"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Separator } from "@/app/components/ui/separator"
import { listFleetRequests, approveFleetRequest, rejectFleetRequest, type FleetRequestDTO } from "@/app/lib/fleet-api"
import { getCurrentUserPrimaryRole } from "@/app/lib/auth"

export default function FleetApprovalsPage() {
  const [requests, setRequests] = useState<FleetRequestDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  const [q, setQ] = useState("")
  const role = getCurrentUserPrimaryRole()

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const items = await listFleetRequests({ status: statusFilter })
      setRequests(items || [])
    } catch (e: any) {
      setError(e?.message || "Failed to load requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const filtered = useMemo(() => {
    const t = (q || "").toLowerCase()
    if (!t) return requests
    return requests.filter(r =>
      (r.type || "").toLowerCase().includes(t) ||
      (r.vehicleId || "").toLowerCase().includes(t) ||
      (r.description || "").toLowerCase().includes(t)
    )
  }, [q, requests])

  async function act(id: string, action: "approve" | "reject") {
    try {
      setError(null)
      // optimistic update
      setRequests(prev => prev.map(r => (r.id === id ? { ...r, status: action === "approve" ? "APPROVED" : "REJECTED" } : r)))
      if (action === "approve") await approveFleetRequest(id)
      else await rejectFleetRequest(id)
    } catch (e: any) {
      setError(e?.message || `Failed to ${action}`)
      // reload to ensure consistency
      load()
    }
  }

  const canModerate = role === "admin" || role === "manager" || role === "department_head" || role === "commissioner" || role === "finance"

  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fleet Requests Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Search</label>
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by type, vehicleId, description" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select className="w-full border rounded h-9 px-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="">All</option>
              </select>
            </div>
            <div className="flex gap-2 md:justify-end">
              <Button asChild>
                <Link href="/fleet/requests">New Request</Link>
              </Button>
              <Button variant="outline" onClick={load}>Refresh</Button>
            </div>
          </div>
          {loading && <div className="text-sm text-muted-foreground mt-3">Loading requests…</div>}
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-3">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            <div className="hidden md:grid grid-cols-12 px-4 py-2 text-xs text-muted-foreground">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Vehicle</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {filtered.map((r) => (
              <div key={r.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-4 py-3 items-center">
                <div className="md:col-span-2 text-sm">
                  {r.date ? new Date(r.date).toLocaleDateString() : "—"}
                </div>
                <div className="md:col-span-2 text-sm flex items-center gap-2">
                  <Badge>{r.type || "—"}</Badge>
                  {r.status && <span className="text-xs text-muted-foreground">{r.status}</span>}
                </div>
                <div className="md:col-span-2 text-sm">
                  {r.vehicleId || "—"}
                </div>
                <div className="md:col-span-4 text-sm truncate">
                  {r.description || "—"}
                </div>
                <div className="md:col-span-2 flex md:justify-end gap-2">
                  <Button size="sm" variant="outline" disabled={!canModerate || r.status === "APPROVED"} onClick={() => act(r.id, "approve")}>Approve</Button>
                  <Button size="sm" variant="destructive" disabled={!canModerate || r.status === "REJECTED"} onClick={() => act(r.id, "reject")}>Reject</Button>
                </div>
              </div>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">No requests found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
