 "use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

function NewAdForm() {
  const router = useRouter()
  const [editId, setEditId] = useState("")

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
    media: [] as { type: "image" | "video"; url: string; caption?: string }[],
    visibility: "public",
    status: "draft",
  })

  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const edit = sp.get('edit') || ''
    const titleFromQuery = sp.get('title')
    setEditId(edit)

    if (edit) {
      ;(async () => {
        try {
          const res = await fetch(`/api/ads/${edit}`, { cache: "no-store" })
          if (res.ok) {
            const j = await res.json()
            setForm((f: any) => ({ ...f, ...j }))
          }
        } catch {}
      })()
      return
    }
    if (titleFromQuery) setForm((f: any) => ({ ...f, title: titleFromQuery }))
  }, [])

  async function onUpload(file: File): Promise<string | null> {
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/ads/upload", { method: "POST", body: fd })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || "Upload failed")
      return j.url as string
    } catch {
      alert("Upload failed")
      return null
    }
  }

  async function onUploadImage(file?: File | null) {
    if (!file) return
    const okTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if (!okTypes.includes(file.type)) {
      alert("Please upload an image (PNG/JPG/WebP/SVG).")
      return
    }
    const max = 5 * 1024 * 1024 // 5MB
    if (file.size > max) {
      alert("Image is too large. Max 5MB.")
      return
    }
    const url = await onUpload(file)
    if (url) {
      set("media", [...form.media, { type: "image", url }])
      if (!form.featuredImage) set("featuredImage", url)
    }
  }

  async function onUploadVideo(file?: File | null) {
    if (!file) return
    const okTypes = ["video/mp4", "video/webm", "video/ogg"]
    if (!okTypes.includes(file.type)) {
      alert("Please upload a video (MP4/WebM/OGG).")
      return
    }
    const max = 50 * 1024 * 1024 // 50MB
    if (file.size > max) {
      alert("Video is too large. Max 50MB.")
      return
    }
    const url = await onUpload(file)
    if (url) {
      set("media", [...form.media, { type: "video", url }])
      if (!form.videoUrl) set("videoUrl", url)
    }
  }

  function onChangeCaption(idx: number, caption: string) {
    set("media", form.media.map((m: any, i: number) => (i === idx ? { ...m, caption } : m)))
  }
  function onRemoveMedia(idx: number) {
    set("media", form.media.filter((_: any, i: number) => i !== idx))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      let featuredImage = form.featuredImage
      let videoUrl = form.videoUrl
      if (!featuredImage) {
        const firstImg = (form.media || []).find((m: any) => m.type === "image")
        if (firstImg) featuredImage = firstImg.url
      }
      if (!videoUrl) {
        const firstVid = (form.media || []).find((m: any) => m.type === "video")
        if (firstVid) videoUrl = firstVid.url
      }
      const payload = { ...form, featuredImage, videoUrl }
      const url = editId ? `/api/ads/${editId}` : "/api/ads"
      const method = editId ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to save")
      const j = await res.json()
      router.push(`/advertisement/${j.slug}`)
    } catch {
      alert("Failed to save post")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#135a98]">
        {editId ? "Edit Advertisement" : "Create Advertisement"}
      </h1>
      {/* --- your full form stays exactly as-is --- */}
      {/* Keep your form code here unchanged */}
    </div>
  )
}

export default function NewAdPage() {
  return <NewAdForm />
}
