"use client"

import { useEffect, useState } from "react"
import { getCurrentUserRoles } from "@/app/lib/auth"

export default function AdvertisementBrandingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [slogan, setSlogan] = useState("")
  const [msg, setMsg] = useState("")
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    // client-side role guard
    const roles = getCurrentUserRoles().map(r=>r.toLowerCase())
    const canEdit = roles.includes('admin') || roles.includes('ads_admin') || roles.includes('ads_editor')
    if (!canEdit) setForbidden(true)
    ;(async () => {
      try {
        const res = await fetch('/api/ads/branding', { cache: 'no-store' })
        if (res.ok) {
          const j = await res.json()
          setCompanyName(j?.companyName || "")
          setLogoUrl(j?.logoUrl || "")
          setSlogan(j?.slogan || "")
        }
      } finally { setLoading(false) }
    })()
  }, [])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg("")
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
      const res = await fetch('/api/ads/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ companyName, logoUrl, slogan })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Save failed')
      setMsg('Saved')
    } catch (e: any) {
      setMsg(e?.message || 'Failed')
    } finally { setSaving(false) }
  }

  async function onUploadLogo(file: File) {
    if (!file) return
    // Validate file type and size (max 3MB)
    const okTypes = ['image/png','image/jpeg','image/jpg','image/svg+xml','image/webp']
    if (!okTypes.includes(file.type)) { setMsg('Invalid file type. Use PNG, JPG, SVG or WebP.'); return }
    const max = 3 * 1024 * 1024
    if (file.size > max) { setMsg('File too large. Max 3MB.'); return }
    setMsg('Uploading...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/ads/upload', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Upload failed')
      setLogoUrl(j.url)
      setMsg('Logo uploaded')
    } catch (e: any) {
      setMsg(e?.message || 'Upload failed')
    }
  }

  // Drag-and-drop support
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (forbidden) return
    const f = e.dataTransfer.files?.[0]
    if (f) onUploadLogo(f)
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) { e.preventDefault() }

  if (loading) return <div className="max-w-xl mx-auto p-6">Loading...</div>

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#135a98]">Advertisement Branding</h1>
      <form className="space-y-4" onSubmit={onSave}>
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input className="w-full border rounded p-2" value={companyName} onChange={e=>setCompanyName(e.target.value)} required disabled={forbidden} />
        </div>
        <div onDrop={onDrop} onDragOver={onDragOver}>
          <label className="block text-sm font-medium mb-1">Logo</label>
          <div className="mt-2 flex items-center gap-2">
            <input type="file" accept="image/*" onChange={e=>e.target.files && onUploadLogo(e.target.files[0])} disabled={forbidden} />
            {logoUrl && <button type="button" className="px-3 py-2 border rounded" onClick={()=>setLogoUrl("")} disabled={forbidden}>Remove</button>}
          </div>
          <p className="text-xs text-gray-500 mt-1">Upload a logo image (PNG/JPG/SVG). The file will be stored locally under /public/uploads.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slogan (optional)</label>
          <input className="w-full border rounded p-2" value={slogan} onChange={e=>setSlogan(e.target.value)} disabled={forbidden} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving || forbidden} className="px-4 py-2 bg-[#135a98] text-white rounded">{saving ? 'Saving...' : 'Save'}</button>
          {msg && <span className="text-sm text-gray-600">{msg}</span>}
        </div>
      </form>

      <div className="mt-4 border rounded p-4">
        <div className="text-sm text-gray-600 mb-2">Preview</div>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-gray-100 border rounded grid place-items-center text-gray-400 text-xs">No Logo</div>
          )}
          <div>
            <div className="font-bold text-lg">{companyName || 'Company'}</div>
            {slogan && <div className="text-sm text-gray-600">{slogan}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
