"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function NewAdPage() {
  const router = useRouter()
  const search = useSearchParams()
  const editId = search?.get('edit') || ''
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    title: "",
    category: "",
    postingAt: new Date().toISOString(),
    deadlineAt: "",
    body: "",
    location: "",
    featuredImage: "",
    videoUrl: "",
    media: [] as { type: 'image'|'video'; url: string; caption?: string }[],
    visibility: "public",
    status: "draft",
  })

  function set<K extends string>(k: K, v: any) { setForm((f:any)=> ({ ...f, [k]: v })) }

  useEffect(() => {
    // If editing, load existing
    if (editId) {
      (async () => {
        try {
          const res = await fetch(`/api/ads/${editId}`, { cache: 'no-store' })
          if (res.ok) {
            const j = await res.json()
            setForm({
              ...form,
              ...j,
            })
          }
        } catch {}
      })()
      return
    }
    // If creating, prefill title from query
    const t = search?.get('title')
    if (t) setForm((f:any)=> ({ ...f, title: t }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId])

  async function onUpload(file: File): Promise<string | null> {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/ads/upload', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Upload failed')
      return j.url as string
    } catch (e) {
      alert('Upload failed')
      return null
    }
  }

  async function onUploadImage(file?: File | null) {
    if (!file) return
    const okTypes = ['image/png','image/jpeg','image/jpg','image/webp','image/svg+xml']
    if (!okTypes.includes(file.type)) { alert('Please upload an image (PNG/JPG/WebP/SVG).'); return }
    const max = 5 * 1024 * 1024 // 5MB
    if (file.size > max) { alert('Image is too large. Max 5MB.'); return }
    const url = await onUpload(file)
    if (url) {
      set('media', [ ...form.media, { type: 'image', url } ])
      if (!form.featuredImage) set('featuredImage', url)
    }
  }

  async function onUploadVideo(file?: File | null) {
    if (!file) return
    const okTypes = ['video/mp4','video/webm','video/ogg']
    if (!okTypes.includes(file.type)) { alert('Please upload a video (MP4/WebM/OGG).'); return }
    const max = 50 * 1024 * 1024 // 50MB
    if (file.size > max) { alert('Video is too large. Max 50MB.'); return }
    const url = await onUpload(file)
    if (url) {
      set('media', [ ...form.media, { type: 'video', url } ])
      if (!form.videoUrl) set('videoUrl', url)
    }
  }

  function onChangeCaption(idx: number, caption: string) {
    set('media', form.media.map((m:any, i:number)=> i===idx ? { ...m, caption } : m))
  }
  function onRemoveMedia(idx: number) {
    set('media', form.media.filter((_:any,i:number)=> i!==idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Derive featured fields from gallery when empty for backward compatibility
      let featuredImage = form.featuredImage
      let videoUrl = form.videoUrl
      if (!featuredImage) {
        const firstImg = (form.media || []).find((m:any)=> m.type==='image')
        if (firstImg) featuredImage = firstImg.url
      }
      if (!videoUrl) {
        const firstVid = (form.media || []).find((m:any)=> m.type==='video')
        if (firstVid) videoUrl = firstVid.url
      }
      const payload = { ...form, featuredImage, videoUrl }
      const url = editId ? `/api/ads/${editId}` : '/api/ads'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to save')
      const j = await res.json()
      router.push(`/advertisement/${j.slug}`)
    } catch (e) {
      alert('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#135a98]">{editId ? 'Edit Advertisement' : 'Create Advertisement'}</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <input className="w-full border rounded p-2" placeholder="Title" value={form.title} onChange={e=>set('title', e.target.value)} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="Category" value={form.category} onChange={e=>set('category', e.target.value)} />
          <input type="date" className="border rounded p-2" value={form.postingAt?.slice(0,10)} onChange={e=>set('postingAt', new Date(e.target.value).toISOString())} />
          <input type="date" className="border rounded p-2" value={form.deadlineAt?.slice(0,10) || ''} onChange={e=>set('deadlineAt', e.target.value ? new Date(e.target.value).toISOString() : '')} />
        </div>
        <textarea className="w-full border rounded p-2 h-40" placeholder="Detailed Description" value={form.body} onChange={e=>set('body', e.target.value)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="border rounded p-2" placeholder="Location" value={form.location} onChange={e=>set('location', e.target.value)} />
        </div>
        {/* Media Section (multiple, captions, size checks) */}
        <section className="space-y-3 border rounded p-3">
          <div className="font-semibold text-[#135a98]">Media</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Image</label>
              <input type="file" accept="image/*" onChange={(e)=> onUploadImage(e.target.files?.[0] || null)} />
              <div className="space-y-2">
                {form.media.filter((m:any)=>m.type==='image').length === 0 && (
                  <div className="text-xs text-gray-500">No images yet.</div>
                )}
                {form.media.map((m:any, idx:number)=> m.type==='image' && (
                  <div key={idx} className="border rounded p-2 space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={`image-${idx}`} className="w-full max-h-48 object-contain" />
                    <input className="w-full border rounded p-2" placeholder="Caption (optional)" value={m.caption || ''} onChange={e=>onChangeCaption(idx, e.target.value)} />
                    <div className="flex gap-2">
                      <button type="button" className="px-3 py-1 border rounded" onClick={()=> onRemoveMedia(idx)}>Remove</button>
                      {!form.featuredImage || form.featuredImage!==m.url ? (
                        <button type="button" className="px-3 py-1 border rounded" onClick={()=> set('featuredImage', m.url)}>Set as Featured</button>
                      ) : (
                        <span className="text-xs text-green-700">Featured</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">Video</label>
              <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={(e)=> onUploadVideo(e.target.files?.[0] || null)} />
              <input className="w-full border rounded p-2" placeholder="Or paste a video URL (e.g., YouTube)" value={form.videoUrl} onChange={(e)=> set('videoUrl', e.target.value)} />
              <div className="space-y-2">
                {form.media.filter((m:any)=>m.type==='video').length === 0 && (
                  <div className="text-xs text-gray-500">No videos yet.</div>
                )}
                {form.media.map((m:any, idx:number)=> m.type==='video' && (
                  <div key={idx} className="border rounded p-2 space-y-2">
                    {m.url.match(/(\.mp4|\.webm|\.ogg)(\?|$)/i) ? (
                      <video className="w-full max-h-48 border rounded" controls src={m.url} />
                    ) : (
                      <div className="text-xs text-gray-500">External video link set.</div>
                    )}
                    <input className="w-full border rounded p-2" placeholder="Caption (optional)" value={m.caption || ''} onChange={e=>onChangeCaption(idx, e.target.value)} />
                    <div className="flex gap-2">
                      <button type="button" className="px-3 py-1 border rounded" onClick={()=> onRemoveMedia(idx)}>Remove</button>
                      {!form.videoUrl || form.videoUrl!==m.url ? (
                        <button type="button" className="px-3 py-1 border rounded" onClick={()=> set('videoUrl', m.url)}>Set as Primary</button>
                      ) : (
                        <span className="text-xs text-green-700">Primary</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select className="border rounded p-2" value={form.visibility} onChange={e=>set('visibility', e.target.value)}>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="draft">Draft</option>
          </select>
          <select className="border rounded p-2" value={form.status} onChange={e=>set('status', e.target.value)}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="px-4 py-2 bg-[#135a98] text-white rounded">{saving ? 'Saving...' : 'Publish / Save'}</button>
          <button type="button" onClick={()=>router.back()} className="px-4 py-2 border rounded">Cancel</button>
        </div>
      </form>
    </div>
  )
}
