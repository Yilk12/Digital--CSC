"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUserRoles } from "@/app/lib/auth"

type Ad = {
  id: string
  slug: string
  title: string
  category: string
  postingAt: string
  deadlineAt?: string
  referenceNo?: string
  body: string
  eligibility?: string
  application?: string
  importantDates?: string
  location?: string
  featuredImage?: string
  videoUrl?: string
  tags: string[]
  metaDescription?: string
  author?: string
  status: string
  visibility: string
  views: number
  likes: number
}

function getCommentAuthorName(author: any): string {
  // Backend for /api/ads stores author as a simple string; if it's present, use it.
  if (typeof author === 'string' && author.trim()) return author.trim()
  if (!author) return 'Anonymous'
  try {
    const firstName = author.firstName || author.first_name || ''
    const lastName = author.lastName || author.last_name || ''
    const full = `${firstName} ${lastName}`.trim()
    if (full) return full
    if (author.email) return String(author.email)
  } catch {
    // ignore and fallback
  }
  return 'Anonymous'
}

export default function AdDetailPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const router = useRouter()
  const [ad, setAd] = useState<Ad | null>(null)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [branding, setBranding] = useState<{ companyName?: string; logoUrl?: string; slogan?: string } | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const fallbackBranding = {
    companyName: 'የፌደራል ሲቪል ሰርቪስ ኮሚሽን\nCivil Service Commission',
    logoUrl: '/gallery/ecsc.jpg',
    slogan: undefined as string | undefined,
  }

  useEffect(() => { load(); loadBranding() }, [slug])
  useEffect(() => {
    const roles = getCurrentUserRoles().map(r=>String(r).toLowerCase())
    const creator = roles.includes('ads_admin') || roles.includes('ads_editor') || roles.includes('admin')
    setCanEdit(creator)
  }, [])

  // Determine current logged-in user's display name for comments
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('user')
      if (!raw) return
      const u = JSON.parse(raw)
      const firstName =
        u?.firstName ||
        u?.first_name ||
        u?.givenName ||
        u?.given_name ||
        ''
      const fatherName =
        u?.fatherName ||
        u?.father_name ||
        u?.lastName ||
        u?.last_name ||
        ''
      const combined = `${firstName} ${fatherName}`.trim()
      const full = (u?.displayName || combined || '').trim()
      if (full) setCurrentUserName(full)
    } catch {
      // ignore
    }
  }, [])

  const resolveCommentAuthor = (author: any): string => {
    // For ad comments, the backend stores a per-comment author string.
    // Use that directly (via getCommentAuthorName) so each comment shows
    // the real commenter, not just the current logged-in user.
    return getCommentAuthorName(author)
  }

  async function load() {
    // list to find by slug
    const res = await fetch('/api/ads', { cache: 'no-store' })
    const j: Ad[] = await res.json()
    const found = j.find((x)=> x.slug === slug) || null
    setAd(found || null)
    if (found) {
      // increment server-side view counter
      fetch(`/api/ads/${found.id}/view`, { method: 'POST' }).catch(()=>{})
      const cs = await fetch(`/api/ads/${found.id}/comments`, { cache: 'no-store' }).then(r=>r.json())
      setComments(cs)
    }
  }

  async function loadBranding() {
    try {
      const res = await fetch('/api/ads/branding', { cache: 'no-store' })
      if (res.ok) setBranding(await res.json())
    } catch {}
  }

  async function onLike() {
    if (!ad) return
    const res = await fetch(`/api/ads/${ad.id}/like`, { method: 'POST' })
    if (res.ok) load()
  }
  async function onPostComment() {
    if (!ad || !newComment.trim()) return

    // Derive a robust display name from the logged-in user
    let authorName = 'Anonymous'
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('user')
      if (raw) {
        try {
          const u = JSON.parse(raw)

          // Try a wide range of possible fields
          const firstName =
            u?.firstName ||
            u?.first_name ||
            u?.givenName ||
            u?.given_name ||
            ''

          const fatherName =
            u?.fatherName ||
            u?.father_name ||
            u?.lastName ||
            u?.last_name ||
            ''

          const combined = `${firstName} ${fatherName}`.trim()

          const singleName =
            u?.displayName ||
            combined ||
            u?.fullName ||
            u?.full_name ||
            u?.name ||
            u?.username ||
            u?.userName ||
            ''

          const emailFallback = u?.email || u?.mail || ''

          const finalName = (singleName || emailFallback || '').trim()
          if (finalName) authorName = finalName
        } catch {
          // keep Anonymous
        }
      }
    }

    const res = await fetch(`/api/ads/${ad.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment, author: authorName }),
    })
    if (res.ok) { setNewComment(''); load() }
  }

  async function onVoteComment(id: string, dir: 'up'|'down') {
    await fetch(`/api/ads/comments/${id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dir }) })
    load()
  }
  async function onReportComment(id: string) {
    await fetch(`/api/ads/comments/${id}/report`, { method: 'POST' })
    load()
  }

  async function onSetStatus(newStatus: 'draft'|'published'|'archived'|'pending') {
    if (!ad) return
    try {
      const payload: any = {
        title: ad.title,
        category: ad.category,
        postingAt: ad.postingAt,
        deadlineAt: ad.deadlineAt,
        body: ad.body,
        location: ad.location,
        featuredImage: (ad as any).featuredImage,
        videoUrl: (ad as any).videoUrl,
        media: (ad as any).media,
        visibility: ad.visibility,
        status: newStatus,
      }
      const res = await fetch(`/api/ads/${ad.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) load()
    } catch {
      // ignore
    }
  }

  if (!ad) { return null }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Branding header (with fallback) */}
      <div className="flex items-center gap-3">
        {(branding?.logoUrl || fallbackBranding.logoUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding?.logoUrl || fallbackBranding.logoUrl} alt="logo" className="w-10 h-10 object-contain" />
        ) : null}
        <div>
          <div className="text-xl font-extrabold text-[#135a98] whitespace-pre-line">{branding?.companyName || fallbackBranding.companyName}</div>
          {(branding?.slogan || fallbackBranding.slogan) && <div className="text-sm text-gray-600">{branding?.slogan || fallbackBranding.slogan}</div>}
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-[#135a98]">{ad.title}</h1>
          {isNew(ad) && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs self-center">New</span>}
          {isHot(ad) && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs self-center">Hot</span>}
          {isExpiringSoon(ad) && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs self-center">Expiring Soon</span>}
        </div>
        <div className="flex gap-2 items-center">
          {canEdit && (
            <>
              <button className="px-3 py-1 border rounded" onClick={()=>router.push(`/advertisement/new?edit=${ad.id}`)}>Edit</button>
              {ad.status !== 'published' && (
                <button className="px-3 py-1 border rounded" onClick={()=> onSetStatus('published')}>Publish</button>
              )}
              {ad.status === 'published' && (
                <button className="px-3 py-1 border rounded" onClick={()=> onSetStatus('draft')}>Unpublish</button>
              )}
            </>
          )}
          <button className="px-3 py-1 border rounded" onClick={onLike}>👍 Like ({ad.likes})</button>
          <button className="px-3 py-1 border rounded" onClick={()=>navigator.clipboard.writeText(window.location.href)}>Copy Link</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-gray-700">
        {ad.category && ad.category !== 'General' && (
          <span className="px-2 py-0.5 border rounded">{ad.category}</span>
        )}
        {ad.tags?.map((t)=> <span key={t} className="px-2 py-0.5 border rounded">#{t}</span>)}
        {ad.deadlineAt && <span className="px-2 py-0.5 border rounded bg-yellow-50">Deadline: {new Date(ad.deadlineAt).toLocaleDateString()}</span>}
        <span className="ml-auto">👁️ {ad.views}</span>
      </div>

      {ad.featuredImage && (
        <div className="overflow-hidden rounded group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.featuredImage}
            alt="featured"
            className="w-full max-h-96 object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>
      )}

      <article className="prose max-w-none">
        <p className="whitespace-pre-wrap">{ad.body}</p>
        {ad.eligibility && (<><h3>Eligibility</h3><p className="whitespace-pre-wrap">{ad.eligibility}</p></>)}
        {ad.application && (<><h3>Application</h3><p className="whitespace-pre-wrap">{ad.application}</p></>)}
        {ad.importantDates && (<><h3>Important Dates</h3><p className="whitespace-pre-wrap">{ad.importantDates}</p></>)}
        {ad.location && (<><h3>Location</h3><p>{ad.location}</p></>)}
        {ad.videoUrl && (
          <div className="aspect-video w-full">
            <iframe className="w-full h-full" src={ad.videoUrl} title="video" allowFullScreen />
          </div>
        )}
      </article>

      {/* Comments */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Comments</h2>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2"
            placeholder="Write a comment"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
          />
          <button
            className="px-3 py-2 bg-[#135a98] text-white rounded"
            onClick={onPostComment}
          >
            Post
          </button>
        </div>
        <div className="space-y-3">
          {comments.map((c: any) => (
            <div key={c.id} className="pb-3 border-b border-gray-200">
              {/* Name and time row */}
              <div className="flex items-center justify-between mb-1 text-sm text-gray-600">
                <span className="font-semibold">{resolveCommentAuthor(c.author)}</span>
                <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</span>
              </div>

              {/* Comment text */}
              <div className="whitespace-pre-wrap">{c.content}</div>

              {/* Actions */}
              <div className="flex gap-2 items-center mt-2 text-sm">
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={() => onVoteComment(c.id, 'up')}
                >
                  ⬆️ {c.up}
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={() => onVoteComment(c.id, 'down')}
                >
                  ⬇️ {c.down}
                </button>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700"
                  onClick={() => onReportComment(c.id)}
                >
                  {c.reported ? 'Reported' : 'Report'}
                </button>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-gray-600">No comments yet.</div>
          )}
        </div>
      </section>

      {/* Share */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Share</h2>
        <div className="flex gap-2 flex-wrap">
          <a className="px-3 py-1 border rounded" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">Facebook</a>
          <a className="px-3 py-1 border rounded" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">Twitter</a>
          <a className="px-3 py-1 border rounded" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">LinkedIn</a>
          <a className="px-3 py-1 border rounded" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">WhatsApp</a>
          <a className="px-3 py-1 border rounded" href={`mailto:?subject=${encodeURIComponent(ad.title)}&body=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`}>Email</a>
        </div>
      </section>

    </div>
  )
}

function isNew(ad: any) {
  const days = 7
  const created = new Date(ad.createdAt || ad.postingAt).getTime()
  return Date.now() - created <= days * 86400000
}
function isHot(ad: any) { return (ad.likes || 0) >= 10 }
function isExpiringSoon(ad: any) {
  if (!ad.deadlineAt) return false
  const diff = new Date(ad.deadlineAt).getTime() - Date.now()
  return diff > 0 && diff <= 3 * 86400000
}
