"use client"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { decodeJwt } from "@/app/lib/auth"

// Types
interface Ad {
  id: string | number
  slug: string
  title: string
  postingAt: string
  deadlineAt?: string | null
  createdAt?: string | null
  category: string
  tags?: string[]
  likes: number
  views: number
  status: string
}

// Derive roles from locally stored JWT (aligned with header parsing)
function getCurrentUserRoles(): string[] {
  try {
    const token = typeof window !== 'undefined'
      ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token'))
      : null
    if (!token) return []
    const payload: any = decodeJwt(token)
    const roles: string[] = []
    const p: any = payload || {}
    if (typeof p.role === 'string') roles.push(p.role)
    if (Array.isArray(p.role)) roles.push(...p.role)
    if (Array.isArray(p.roles)) roles.push(...p.roles)
    if (p.realm_access?.roles) roles.push(...p.realm_access.roles)
    if (p.resource_access) {
      for (const v of Object.values(p.resource_access)) {
        const rr = (v as any)?.roles
        if (Array.isArray(rr)) roles.push(...rr)
      }
    }
    return roles
  } catch {
    return []
  }
}

// Page

export default function AdsListPage() {
  const [items, setItems] = useState<Ad[]>([])
  const [q, setQ] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [branding, setBranding] = useState<{ companyName?: string; logoUrl?: string; slogan?: string } | null>(null)
  const fallbackBranding = {
    companyName: 'የፌደራል ሲቪል ሰርቪስ ኮሚሽን\nCivil Service Commission',
    logoUrl: '/gallery/ecsc.jpg',
    slogan: undefined as string | undefined,
  }
  const [canCreate, setCanCreate] = useState(false)

  useEffect(() => { load(); loadBranding() }, [])
  useEffect(() => {
    // derive capability from JWT roles
    const roles = getCurrentUserRoles().map(r=>String(r).toLowerCase())
    const creator = roles.includes('ads_admin') || roles.includes('ads_editor') || roles.includes('admin')
    setCanCreate(creator)
  }, [])
  async function load() {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (category) p.set('category', category)
    if (status) p.set('status', status)
    const res = await fetch(`/api/ads?${p.toString()}`, { cache: 'no-store' })
    const j = await res.json()
    setItems(j)
  }
  async function loadBranding() {
    try {
      const res = await fetch('/api/ads/branding', { cache: 'no-store' })
      if (res.ok) setBranding(await res.json())
    } catch {}
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {(branding?.logoUrl || fallbackBranding.logoUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(branding?.logoUrl) || fallbackBranding.logoUrl} alt="logo" className="w-10 h-10 object-contain" />
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-[#135a98] whitespace-pre-line">{branding?.companyName || fallbackBranding.companyName}</h1>
            {(branding?.slogan || fallbackBranding.slogan) && <div className="text-sm text-gray-600">{branding?.slogan || fallbackBranding.slogan}</div>}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {canCreate && (
            <Link href="/advertisement/new" className="px-3 py-2 bg-[#135a98] text-white rounded">Create Post</Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input className="border rounded p-2 w-full" placeholder="Search title, body, tags" value={q} onChange={e=>setQ(e.target.value)} />
        <input className="border rounded p-2 w-full" placeholder="Category" value={category} onChange={e=>setCategory(e.target.value)} />
        <select className="border rounded p-2 w-full" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
          <option value="pending">Pending</option>
        </select>
        <button className="px-3 py-2 bg-gray-100 rounded border" onClick={load}>Apply</button>
      </div>

      {/* Subscribe */}
      <SubscribeBox />

      <div className="space-y-3">
        {items.map((ad)=> (
          <Link key={ad.id} href={`/advertisement/${ad.slug}`} className="block border rounded p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-semibold text-lg">{ad.title}</div>
              <div className="text-sm text-gray-600">{new Date(ad.postingAt).toLocaleDateString()} {ad.deadlineAt ? ` • Deadline: ${new Date(ad.deadlineAt).toLocaleDateString()}` : ''}</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <span className="px-2 py-0.5 border rounded">{ad.category}</span>
              {ad.tags?.slice(0,3).map(t=> <span key={t} className="px-2 py-0.5 border rounded">#{t}</span>)}
              <span>👍 {ad.likes}</span>
              <span>👁️ {ad.views}</span>
              <span className="ml-auto text-xs uppercase">{ad.status}</span>
              {/* Labels */}
              {isNew(ad) && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">New</span>}
              {isHot(ad) && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Hot</span>}
              {isExpiringSoon(ad) && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Expiring Soon</span>}
            </div>
          </Link>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-gray-600">No posts yet.</div>
        )}
      </div>
    </div>
  )
}

function isNew(ad: Ad) {
  const days = 7
  const created = new Date(ad.createdAt || ad.postingAt).getTime()
  return Date.now() - created <= days * 86400000
}
function isHot(ad: Ad) { return (ad.likes || 0) >= 10 }
function isExpiringSoon(ad: Ad) {
  if (!ad.deadlineAt) return false
  const diff = new Date(ad.deadlineAt).getTime() - Date.now()
  return diff > 0 && diff <= 3 * 86400000
}

function SubscribeBox() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")
  async function onSubscribe() {
    setMsg("")
    try {
      const res = await fetch('/api/ads/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Subscribe failed')
      setMsg('Subscribed')
      setEmail("")
    } catch (e: any) { setMsg(e?.message || 'Failed') }
  }
  return (
    <div className="border rounded p-3 flex gap-2 items-center">
      <input className="flex-1 border rounded p-2" placeholder="Subscribe for alerts (email)" value={email} onChange={e=>setEmail(e.target.value)} />
      <button className="px-3 py-2 bg-[#135a98] text-white rounded" onClick={onSubscribe}>Subscribe</button>
      {msg && <span className="text-sm text-gray-600">{msg}</span>}
    </div>
  )
}
