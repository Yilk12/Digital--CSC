"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Badge } from "@/app/components/ui/badge"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { CheckCircle2, Plus, Send } from "lucide-react"

type Ad = {
  id: string
  title: string
  type: "Job" | "Notice" | "Tender" | "Event"
  status: "Draft" | "Pending Review" | "Published" | "Archived"
  createdBy: string
  createdAt: string
}

function useHrAccess() {
  const roles = (getCurrentUserRoles?.() || []).map(r => r.toLowerCase())
  const isAdmin = roles.includes("admin")
  const isHr = roles.includes("hr") || roles.includes("human resources") || roles.includes("hr manager") || roles.includes("recruitment")
  return { isAdmin, isHr }
}

export default function HrAdvertisementWorkspace() {
  const { isAdmin, isHr } = useHrAccess()
  const [title, setTitle] = useState("")
  const [type, setType] = useState<Ad["type"]>("Job")
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/advertisement', { credentials: 'include' })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to load')
        setAds(Array.isArray(data.ads) ? data.ads : [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const drafts = useMemo(() => ads.filter(a => a.status === 'Draft' || a.status === 'Pending Review'), [ads])

  const canUse = isAdmin || isHr
  const roleBadge = isAdmin ? 'Admin' : isHr ? 'HR' : 'No Access'

  const submitNew = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    try {
      setSubmitting(true)
      setError(null)
      const res = await fetch('/api/advertisement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to create')
      if (data.ad) setAds(prev => [data.ad, ...prev])
      setTitle("")
      setType('Job')
    } catch (e: any) {
      setError(e?.message || 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  const publish = async (id: string) => {
    try {
      const prev = ads
      setAds(p => p.map(a => a.id === id ? { ...a, status: 'Published' } : a))
      const res = await fetch('/api/advertisement', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Published' }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to publish')
      if (data.ad) setAds(p => p.map(a => a.id === id ? data.ad : a))
    } catch (e: any) {
      setError(e?.message || 'Failed to publish')
    }
  }

  if (!canUse) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Advertisement HR Workspace</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{roleBadge}</Badge>
          <div className="text-sm text-muted-foreground mt-2">You don’t have permission to access this workspace.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Advertisement HR Workspace</span>
            <Badge variant="secondary">{roleBadge}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Senior Accountant" />
              <Label>Type</Label>
              <select className="w-full border rounded h-9 px-2" value={type} onChange={e => setType(e.target.value as Ad["type"]) }>
                <option value="Job">Job</option>
                <option value="Notice">Notice</option>
                <option value="Tender">Tender</option>
                <option value="Event">Event</option>
              </select>
              <div className="pt-2">
                <Button disabled={submitting} onClick={submitNew} className="flex items-center gap-2"><Plus className="w-4 h-4"/>Create Draft</Button>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Workflow</div>
              <ol className="list-decimal pl-4 text-sm space-y-1">
                <li>Create draft with title and type.</li>
                <li>Review content internally.</li>
                <li>Publish when ready.</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drafts & Pending Review</CardTitle>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 && <div className="text-sm text-muted-foreground">No drafts yet.</div>}
          <div className="space-y-2">
            {drafts.map(d => (
              <div key={d.id} className="flex items-center justify-between border rounded px-3 py-2">
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground">{d.type} • {d.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => publish(d.id)} className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>Publish</Button>
                  <Button size="sm" variant="secondary" className="flex items-center gap-1" disabled><Send className="w-4 h-4"/>Submit for Review</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
