"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUserRoles } from "../lib/auth"
import AddAnouncmetPage from "./AddAnouncmetPage"
import { useLocalization } from "@/app/hooks/use-localization"

interface Announcement {
  id: string
  title: string
  description?: string | null
  date: string
  likeCount: number
  dislikeCount: number
  imageUrl?: string | null
  status?: string
  category?: string
  createdAt: string
  updatedAt: string
}

// Helper to safely render author information from API responses
const formatAuthor = (author: any): string => {
  if (!author) return ""
  if (typeof author === "string") return author
  try {
    const firstName = (author as any).firstName || (author as any).first_name || ""
    const lastName = (author as any).lastName || (author as any).last_name || ""
    const fullName = `${firstName} ${lastName}`.trim()
    if (fullName) return fullName
    if ((author as any).email) return String((author as any).email)
  } catch {
    // ignore and fallback
  }
  return ""
}

export default function AnnouncementsPage() {
  const { t } = useLocalization()
  const LIST_COMMENTS_ENABLED = true
  const DETAIL_COMMENTS_ENABLED = true
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [comments, setComments] = useState<Array<{ id: string; author?: string; content: string; createdAt: string }>>([])
  const [newComment, setNewComment] = useState("")
  const [postingComment, setPostingComment] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({})
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({})
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replies, setReplies] = useState<Record<string, Array<{ id: string; author?: string; content: string; createdAt: string }>>>({})
  const [previewComments, setPreviewComments] = useState<Record<string, { items: Array<{ id: string; author?: string; content: string; createdAt: string }>; total: number }>>({})
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({})
  const [inlineComment, setInlineComment] = useState<Record<string, string>>({})
  const [inlinePosting, setInlinePosting] = useState<Record<string, boolean>>({})
  const [inlineOpen, setInlineOpen] = useState<Record<string, boolean>>({})
  const [descModalOpen, setDescModalOpen] = useState(false)
  const [descModalTitle, setDescModalTitle] = useState("")
  const [descModalText, setDescModalText] = useState("")
  const [descModalFullscreen, setDescModalFullscreen] = useState(false)
  const [descModalAnnouncement, setDescModalAnnouncement] = useState<Announcement | null>(null)
  const [descModalShareOpen, setDescModalShareOpen] = useState(false)
  const [detailShareOpen, setDetailShareOpen] = useState(false)
  const [hiddenDetailCommentIds, setHiddenDetailCommentIds] = useState<Record<string, boolean>>({})
  const [hiddenPreviewCommentIds, setHiddenPreviewCommentIds] = useState<Record<string, boolean>>({})
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [category, setCategory] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 3

  const router = useRouter()
  const [createParam, setCreateParam] = useState<string | null>(null)
  const [openCreate, setOpenCreate] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  const formatRelativeTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()

    if (Number.isNaN(diffMs)) return ''

    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000))
    const daysTotal = Math.floor(totalSeconds / 86400)
    const years = Math.floor(daysTotal / 365)
    const daysAfterYears = daysTotal % 365
    const months = Math.floor(daysAfterYears / 30)
    const days = daysAfterYears % 30
    const hours = Math.floor((totalSeconds % 86400) / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (years > 0) {
      const m = months > 0 ? `${months}month` : ''
      return `${years}year${years > 1 ? 's' : ''}${m ? ` ${m}${months > 1 ? 's' : ''}` : ''} ago`
    }

    if (months > 0) {
      const d = days > 0 ? `${days}d` : ''
      return `${months}month${months > 1 ? 's' : ''}${d ? ` ${d}` : ''} ago`
    }

    if (days > 0) {
      const h = hours > 0 ? `${hours}h` : ''
      return `${days}d${h ? ` ${h}` : ''} ago`
    }

    if (hours > 0) {
      const m = minutes > 0 ? `${minutes}m` : ''
      return `${hours}h${m ? ` ${m}` : ''} ago`
    }

    if (minutes > 0) {
      const s = seconds > 0 ? `${seconds}s` : ''
      return `${minutes}m${s ? ` ${s}` : ''} ago`
    }

    return `${seconds}s ago`
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    const create = sp.get('create')
    setCreateParam(create)
    setOpenCreate(create === '1')
  }, [])

  const handleShare = () => {
    if (typeof window === 'undefined') return
    try {
      const url = window.location.href
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(url)
        alert('Link copied to clipboard')
      } else {
        prompt('Copy this link:', url)
      }
    } catch {
      // ignore
    }
  }

  const deleteAnnouncementComment = async (announcementId: string, commentId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/announcements/${announcementId}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) return
      await refreshPreviewFor(announcementId)
    } catch {
      // ignore
    }
  }

  const deleteDetailComment = async (commentId: string) => {
    if (!selectedAnnouncement) return
    if (typeof window !== 'undefined') {
      const ok = window.confirm('Are you sure you want to delete this comment?')
      if (!ok) return
    }
    try {
      const res = await fetch(`http://localhost:4000/api/announcements/${selectedAnnouncement.id}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (!res.ok) return

      // reload comments
      const cr = await fetch(`http://localhost:4000/api/announcements/${selectedAnnouncement.id}/comments`, { cache: 'no-store' })
      if (cr.ok) {
        const cj = await cr.json()
        const arr = Array.isArray(cj) ? cj : (Array.isArray(cj.data) ? cj.data : [])
        setComments(arr.map((c: any) => ({ id: String(c.id), author: resolveApiCommentAuthor(c), content: c.content, createdAt: c.createdAt || c.created_at || new Date().toISOString() })))
      }
    } catch {
      // ignore
    }
  }

  const scrollToDetailComments = () => {
    if (typeof document === 'undefined') return
    const el = document.getElementById('announcement-detail-comments')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Determine if current user can edit (from JWT in localStorage)
  useEffect(() => {
    try {
      const roles = getCurrentUserRoles().map(r => String(r).toLowerCase())
      const can = roles.includes('ads_admin') || roles.includes('ads_editor') || roles.includes('admin')
      setIsAdmin(can)
    } catch {
      setIsAdmin(false)
    }
  }, [])

  // Determine current user's display name for comment ownership
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('user');
      console.log(raw);
      if (!raw) return
      const u = JSON.parse(raw)
      const uid = u?.id || u?.userId || null
      if (uid) setCurrentUserId(String(uid))
      // Try multiple common field names for first and father name
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

      const full = `${firstName} ${fatherName}`.trim()
      if (full) {
        setCurrentUserName(full)
      }
    } catch {
      // ignore
    }
  }, [])

  // Helper: resolve a clean author display name for comments coming from the API
  const resolveApiCommentAuthor = (c: any): string => {
    // 1) Prefer known backend user-like fields
    const tryFields = [c?.author, c?.user, c?.createdBy, c?.created_by, c?.commenter]
    for (const field of tryFields) {
      const n = formatAuthor(field)
      if (n) return n
    }

    // 2) Some APIs return name strings on other properties
    const altName = c?.authorName || c?.author_name || c?.name || c?.displayName || c?.display_name || c?.username || c?.user_name
    if (altName && String(altName).trim()) return String(altName).trim()

    // 3) If this comment belongs to the currently logged-in user (by authorId),
    //    use their current display name from localStorage-derived state
    if (c?.authorId && currentUserId && String(c.authorId) === String(currentUserId) && currentUserName) {
      return currentUserName
    }

    // 4) If there's an email-like fallback
    if (c?.email) return String(c.email)

    // 5) No reliable name found
    return 'Visitor'
  }

  useEffect(() => {
    loadAnnouncements()
  }, [page])

  // Load preview comments (first 2) for listed announcements
  useEffect(() => {
    if (!LIST_COMMENTS_ENABLED) return
    let cancelled = false
    async function run() {
      const ids = (announcements || []).map(a => a.id)
      await Promise.all(ids.map(async (id) => {
        setPreviewLoading(prev => ({ ...prev, [id]: true }))
        try {
          const r = await fetch(`http://localhost:4000/api/announcements/${id}/comments?limit=2`, { cache: 'no-store' })
          if (r.ok) {
            const j = await r.json()
            const arr: any[] = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : [])
            const total = (j?.pagination?.total) ?? (j?.total) ?? arr.length
            const mapped = arr.slice(0, 2).map(c => ({ id: String(c.id), author: resolveApiCommentAuthor(c), content: c.content, createdAt: c.createdAt || c.created_at || new Date().toISOString() }))
            if (!cancelled) setPreviewComments(prev => ({ ...prev, [id]: { items: mapped, total } }))
          } else {
            if (!cancelled) setPreviewComments(prev => ({ ...prev, [id]: { items: [], total: 0 } }))
          }
        } catch {
          if (!cancelled) setPreviewComments(prev => ({ ...prev, [id]: { items: [], total: 0 } }))
        } finally {
          if (!cancelled) setPreviewLoading(prev => ({ ...prev, [id]: false }))
        }
      }))
    }
    if (announcements.length) run()
    return () => { cancelled = true }
  }, [announcements, LIST_COMMENTS_ENABLED])

  async function refreshPreviewFor(id: string) {
    setPreviewLoading(prev => ({ ...prev, [id]: true }))
    try {
      const r = await fetch(`http://localhost:4000/api/announcements/${id}/comments?limit=2`, { cache: 'no-store' })
      if (r.ok) {
        const j = await r.json()
        const arr: any[] = Array.isArray(j) ? j : (Array.isArray(j?.data) ? j.data : [])
        const total = (j?.pagination?.total) ?? (j?.total) ?? arr.length
        const mapped = arr.slice(0, 2).map(c => ({ id: String(c.id), author: resolveApiCommentAuthor(c), content: c.content, createdAt: c.createdAt || c.created_at || new Date().toISOString() }))
        setPreviewComments(prev => ({ ...prev, [id]: { items: mapped, total } }))
      } else {
        setPreviewComments(prev => ({ ...prev, [id]: { items: [], total: 0 } }))
      }
    } catch {
      setPreviewComments(prev => ({ ...prev, [id]: { items: [], total: 0 } }))
    } finally {
      setPreviewLoading(prev => ({ ...prev, [id]: false }))
    }
  }

  const postInlineComment = async (id: string) => {
    const content = (inlineComment[id] || '').trim()
    if (!content) return
    setInlinePosting(prev => ({ ...prev, [id]: true }))
    try {
      let authorId: string | undefined = undefined
      // Default to Visitor if we cannot resolve a real name
      let authorName: string | undefined = 'Visitor'
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('user')
        if (raw) {
          try {
            const u = JSON.parse(raw)
            authorId = u?.id || u?.userId
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
            authorId = undefined
            authorName = 'Visitor'
          }
        }
      }
      const res = await fetch(`http://localhost:4000/api/announcements/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorId, author: authorName })
      })
      if (res.ok) {
        setInlineComment(prev => ({ ...prev, [id]: '' }))
        await refreshPreviewFor(id)
      }
    } finally {
      setInlinePosting(prev => ({ ...prev, [id]: false }))
    }
  }

  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append("search", search)
      if (status) params.append("status", status)
      if (category) params.append("category", category)

      const res = await fetch(`http://localhost:4000/api/announcements?${params.toString()}`,
      {
        cache: "no-store",
      })
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const payload = await res.json()
      setAnnouncements((payload && Array.isArray(payload.data)) ? payload.data : [])
      setTotalPages(payload?.meta?.totalPages ?? 1)
    } catch (err) {
      console.error("Failed to load announcements:", err)
      setAnnouncements([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    await loadAnnouncements()
  }

  const resetFilters = () => {
    setSearch("")
    setStatus("")
    setCategory("")
    setPage(1)
  }

  const openDescriptionModal = (announcement: Announcement, text: string) => {
    setDescModalAnnouncement(announcement)
    setDescModalTitle(announcement.title)
    setDescModalText(text)
    setDescModalFullscreen(false)
    setDescModalOpen(true)
  }

  const closeDescriptionModal = () => {
    setDescModalOpen(false)
    setDescModalTitle("")
    setDescModalText("")
  }

  // Create announcement handlers
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    imageUrl: "",
    status: "published",
    category: "",
  })

  const closeCreateSheet = () => {
    setOpenCreate(false)
    router.replace("/advertisement", { scroll: false })
  }

  const openEditSheet = (a: Announcement) => {
    setEditingAnnouncement(a)
    setOpenEdit(true)
  }
  const closeEditSheet = () => {
    setOpenEdit(false)
    setEditingAnnouncement(null)
  }

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("http://localhost:4000/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          date: form.date, // ISO string from datetime-local
          imageUrl: form.imageUrl || undefined,
          status: form.status || undefined,
          category: form.category || undefined,
        }),
      })
      if (!res.ok) throw new Error(`Create failed: ${res.status}`)
      closeCreateSheet()
      // Refresh list
      await loadAnnouncements()
    } catch (err) {
      console.error("Failed to create announcement:", err)
      alert("Failed to create announcement. Please try again.")
    }
  }

  // Auto-refresh when filters change (optional)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadAnnouncements()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [search, status, category])

  const handleLike = async (id: string) => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('announcementVotes') || '{}'
        const votes: Record<string, 'like' | 'dislike'> = JSON.parse(raw)
        // Prevent multiple votes: if user has already liked or disliked this announcement, do nothing
        if (votes[id]) {
          return
        }
        const res = await fetch(`http://localhost:4000/api/announcements/${id}/like`, {
          method: 'POST',
        })
        if (res.ok) {
          votes[id] = 'like'
          window.localStorage.setItem('announcementVotes', JSON.stringify(votes))
          loadAnnouncements()
        }
      }
    } catch (err) {
      console.error('Failed to like announcement:', err)
    }
  }

  const handleDislike = async (id: string) => {
    try {
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('announcementVotes') || '{}'
        const votes: Record<string, 'like' | 'dislike'> = JSON.parse(raw)
        // Prevent multiple votes: if user has already liked or disliked this announcement, do nothing
        if (votes[id]) {
          return
        }
        const res = await fetch(`http://localhost:4000/api/announcements/${id}/dislike`, {
          method: 'POST',
        })
        if (res.ok) {
          votes[id] = 'dislike'
          window.localStorage.setItem('announcementVotes', JSON.stringify(votes))
          loadAnnouncements()
        }
      }
    } catch (err) {
      console.error('Failed to dislike announcement:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) return
    try {
      const res = await fetch(`http://localhost:4000/api/announcements/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error(`Delete failed: ${res.status}`)
      }
      await loadAnnouncements()
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      alert('Failed to delete announcement. Please try again.')
    }
  }

  // Detail sheet controls
  const openDetail = async (id: string) => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const res = await fetch(`http://localhost:4000/api/announcements/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to load details: ${res.status}`)
      const data = await res.json()
      setSelectedAnnouncement(data)
      // Comments for detail based on flag
      if (!DETAIL_COMMENTS_ENABLED) { setComments([]) }
      else {
        try {
          const cr = await fetch(`http://localhost:4000/api/announcements/${id}/comments`, { cache: 'no-store' })
          if (cr.ok) {
            const cj = await cr.json()
            const arr = Array.isArray(cj) ? cj : (Array.isArray(cj.data) ? cj.data : [])
            setComments(
              arr.map((c: any) => ({
                id: String(c.id),
                // Use the robust resolver so we show a name even when backend only sends ids
                author: resolveApiCommentAuthor(c),
                content: c.content,
                createdAt: c.createdAt || c.created_at || new Date().toISOString(),
              })),
            )
          } else {
            setComments([])
          }
        } catch { setComments([]) }
      }
    } catch (err) {
      console.error('Failed to load announcement details:', err)
      alert('Failed to load announcement details.')
      setSelectedAnnouncement(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setSelectedAnnouncement(null)
    setComments([])
    setNewComment("")
  }

  const stripImageLinksFromDescription = (desc: string | undefined | null) => {
    if (!desc) return ""
    const lines = desc.split(/\r?\n/)
    const urlRegex = /^https?:\/\/[^\s]+$/i
    const imageExtRegex = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i
    const filtered = lines.filter((line) => {
      const trimmed = line.trim()
      if (!trimmed) return true
      if (!urlRegex.test(trimmed)) return true
      if (!imageExtRegex.test(trimmed)) return true
      return false
    })
    return filtered.join("\n").trim()
  }

  const renderTextWithLinks = (text: string) => {
    if (!text) return null
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return (
      <>
        {parts.map((part, idx) => {
          if (urlRegex.test(part)) {
            return (
              <a
                key={idx}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline break-all"
              >
                {part}
              </a>
            )
          }
          return <span key={idx}>{part}</span>
        })}
      </>
    )
  }

  const extractFirstImageUrl = (desc: string | undefined | null): string | null => {
    if (!desc) return null
    const match = desc.match(/https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg)(?:\?[^\s]*)?/i)
    return match ? match[0] : null
  }

  const postComment = async () => {
        console.log('postComment');

    if (!selectedAnnouncement) return
    const content = newComment.trim()
    if (!content) return
    setPostingComment(true)
    try {
      let authorId: string | undefined = undefined
      // Default to Visitor if we cannot resolve a real name
      let authorName: string | undefined = 'Visitor'
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('user');
        console.log('postComment2', raw);
        if (raw) {
          try {
            const u = JSON.parse(raw)
            authorId = u?.id || u?.userId
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
            authorId = undefined
            authorName = 'Visitor'
          }
        }
      }
      const res = await fetch(`http://localhost:4000/api/announcements/${selectedAnnouncement.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, authorId, author: authorName })
      })
      if (res.ok) {
        setNewComment("")
        // reload comments
        try {
          const cr = await fetch(`http://localhost:4000/api/announcements/${selectedAnnouncement.id}/comments`, { cache: 'no-store' })
          if (cr.ok) {
            const cj = await cr.json()
            const arr = Array.isArray(cj) ? cj : (Array.isArray(cj.data) ? cj.data : [])
            setComments(
              arr.map((c: any) => ({
                id: String(c.id),
                author: resolveApiCommentAuthor(c),
                content: c.content,
                createdAt: c.createdAt || c.created_at || new Date().toISOString(),
              })),
            )
          }
        } catch {}
      }
    } finally {
      setPostingComment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <header className="flex items-center gap-4 bg-white rounded-2xl p-6 shadow-sm border border-blue-100 flex-1">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/gallery/ecsc.jpg" 
              alt="logo" 
              className="w-12 h-12 object-contain rounded-lg"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#135a98] mb-1">
              የፌደራል ሲቪል ሰርቪስ ኮሚሽን
            </h1>
            <h2 className="text-sm sm:text-base text-gray-600 font-medium">
              Federal Civil Service Commission
            </h2>
            <a
              href="https://civilservice.lmis.gov.et/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              https://civilservice.lmis.gov.et/
            </a>
          </div>
        </header>

        {/* Add Announcement Button (Admin only) */}
        {isAdmin && (
          <button
            onClick={() => { setOpenCreate(true); router.push('/advertisement?create=1') }}
            className="px-6 py-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("announcement.add")}
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 mb-8">
        <form onSubmit={handleFilter} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <input
                  type="text"
                  placeholder={t("announcement.search_ph")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#135a98] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
            
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#135a98] focus:border-transparent outline-none"
            >
              <option value="">{t("announcement.status.all")}</option>
              <option value="published">{t("announcement.status.published")}</option>
              <option value="draft">{t("announcement.status.draft")}</option>
              <option value="archived">{t("announcement.status.archived")}</option>
              <option value="pending">{t("announcement.status.pending")}</option>
            </select>

            <input
              type="text"
              placeholder={t("announcement.category_ph")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-[#135a98] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-[#135a98] text-white rounded-xl hover:bg-[#104a7f] transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {t("announcement.apply_filters")}
            </button>
            
            <button
              type="button"
              onClick={resetFilters}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
            >
              {t("announcement.reset_all")}
            </button>
          </div>
        </form>
      </div>

      {/* Active Filters Display */}
      {(search || status || category) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {t("announcement.active_filters")}
          </div>
          <div className="flex flex-wrap gap-2">
            {search && (
              <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {t("announcement.filter.search")} "{search}"
                <button onClick={() => setSearch("")} className="hover:text-blue-900">
                  ×
                </button>
              </span>
            )}
            {status && (
              <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {t("announcement.filter.status")} {status}
                <button onClick={() => setStatus("")} className="hover:text-green-900">
                  ×
                </button>
              </span>
            )}
            {category && (
              <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {t("announcement.filter.category")} {category}
                <button onClick={() => setCategory("")} className="hover:text-purple-900">
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Edit Announcement Sheet */}
      {openEdit && editingAnnouncement && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeEditSheet}
            aria-hidden
          />

          {/* Sheet Panel */}
          <div className="ml-auto h-full w-full max-w-xl bg-white shadow-2xl border-l rounded-l-2xl p-6 overflow-y-auto">
            <AddAnouncmetPage
              onClose={closeEditSheet}
              onSuccess={async () => {
                await loadAnnouncements()
                closeEditSheet()
              }}
              announcement={editingAnnouncement}
              mode="edit"
            />
          </div>
        </div>
      )}

      {/* Announcement Detail Sheet */}
{detailOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    {/* Backdrop with blur */}
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
      onClick={closeDetail} 
      aria-hidden="true" 
    />
    
    {/* Modal Container */}
    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl transform transition-all duration-300 scale-100 hover:scale-[1.02] overflow-hidden">
      
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-3xl font-bold text-white mb-2">ማስታወቂያ</h3>
            <p className="text-blue-100 text-lg"></p>
          </div>
          <button 
            onClick={closeDetail} 
            className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 group"
            aria-label="Close"
          >
            <svg 
              className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[80vh] overflow-y-auto">
        {detailLoading ? (
          // Loading State
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">{t("announcement.details.loading")}</p>
            </div>
          </div>
        ) : selectedAnnouncement ? (
          <div className="p-8 space-y-8">
            
            {/* Image Section */}
            {selectedAnnouncement.imageUrl && (
              <div className="relative group overflow-hidden rounded-2xl bg-black/5 flex items-center justify-center">
                <div className="absolute top-4 left-4 z-10 inline-flex items-center px-4 py-1.5 rounded-full bg-white/95 shadow-md border border-gray-200 text-sm font-medium text-gray-800">
                </div>
                <img
                  src={selectedAnnouncement.imageUrl}
                  alt={selectedAnnouncement.title}
                  className="max-w-full h-auto object-contain rounded-2xl shadow-lg mx-auto"
                />
                <div className="pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-2xl"></div>
              </div>
            )}

            {/* More Images Gallery (parsed from description) */}
            {(() => {
              const desc = selectedAnnouncement.description || ''
              const urls = Array.from(desc.matchAll(/https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg)/gi)).map(m => m[0])
              if (!urls.length) return null

              const maxVisible = 4
              const visible = urls.slice(0, maxVisible)
              const extraCount = urls.length - maxVisible

              return (
                <div className="mt-6">
                  <div className="mb-2 text-sm font-semibold text-gray-700"></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {visible.map((u, i) => {
                      const isLastVisible = i === visible.length - 1 && extraCount > 0
                      return (
                        <a
                          key={i}
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block rounded-xl overflow-hidden group cursor-zoom-in"
                          title="Open image"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={u}
                            alt={`gallery-${i}`}
                            className="w-full h-28 object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                          />
                          {isLastVisible && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-lg font-semibold">+{extraCount}</span>
                            </div>
                          )}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Title and Date */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <h2 className="text-4xl font-bold text-gray-900 leading-tight flex-1">
                {selectedAnnouncement.title}
              </h2>
              <div className="flex items-center gap-3 bg-gray-50 rounded-2xl px-6 py-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <time 
                  className="text-lg font-semibold text-gray-700 whitespace-nowrap" 
                  dateTime={selectedAnnouncement.date}
                >
                  {formatRelativeTime(selectedAnnouncement.date)}
                </time>
              </div>
            </div>

          {/* Description */}
            {stripImageLinksFromDescription(selectedAnnouncement.description) && (
              <div className="bg-gray-50 rounded-2xl p-8">
                <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="flex-1">{t("announcement.description")}</span>
                </h4>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                  {renderTextWithLinks(stripImageLinksFromDescription(selectedAnnouncement.description))}
                </p>
              </div>
            )}

            {/* Action bar: Like / Comment / Share */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => handleLike(selectedAnnouncement.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 border border-gray-200"
                >
                  <span>👍</span>
                  <span className="font-semibold">Like</span>
                  <span className="text-xs text-gray-500">{selectedAnnouncement.likeCount}</span>
                </button>

                <button
                  type="button"
                  onClick={scrollToDetailComments}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200"
                >
                  <span>💬</span>
                  <span className="font-semibold">አስተያየት መስጫ</span>
                  <span className="text-xs text-gray-500">{comments.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDetailShareOpen(prev => !prev)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200"
                >
                  <span>🔗</span>
                  <span className="font-semibold">አጋራ</span>
                </button>
              </div>

              {detailShareOpen && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                  <span className="font-semibold mr-2">Share:</span>
                  <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">Facebook</a>
                  <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">Twitter</a>
                  <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">LinkedIn</a>
                  <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">WhatsApp</a>
                  <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`mailto:?subject=${encodeURIComponent(selectedAnnouncement.title)}&body=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`}>Email</a>
                </div>
              )}
            </div>

            {/* Comments in detail modal */}
            <div id="announcement-detail-comments" className="mt-8 space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>💬</span>
                <span>አስተያየት መስጫ</span>
                {comments.length > 0 && (
                  <span className="text-sm text-gray-500">({comments.length})</span>
                )}
              </h4>

              {/* Comment input */}
              <div className="flex flex-col gap-2">
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={postComment}
                    disabled={postingComment || !newComment.trim() || !selectedAnnouncement}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {postingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {comments.filter(c => !hiddenDetailCommentIds[c.id]).map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-lg p-3 text-sm bg-gray-50">
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                      <span>{c.author || currentUserName}</span>
                      <span>{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <div className="text-gray-800 whitespace-pre-wrap mb-2">{c.content}</div>

                    <div className="flex items-center gap-3 mb-2 text-[11px]">
                      {currentUserName && c.author === currentUserName && (
                        <button
                          type="button"
                          onClick={() => deleteDetailComment(c.id)}
                          className="text-red-600 hover:underline"
                        >
                          አጥፋ
                        </button>
                      )}
                      {currentUserName && c.author === currentUserName && (
                        <button
                          type="button"
                          onClick={() => setHiddenDetailCommentIds(prev => ({ ...prev, [c.id]: true }))}
                          className="text-gray-500 hover:underline"
                        >
                          ደብቅ
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setCommentLikes(prev => ({ ...prev, [c.id]: (prev[c.id] || 0) + 1 }))}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-300 text-[11px] text-gray-700 hover:bg-blue-50"
                      >
                        <span>👍</span>
                        <span>Like</span>
                        <span className="text-gray-500">{commentLikes[c.id] || 0}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplyOpen(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        {replyOpen[c.id] ? 'Cancel' : 'Reply'}
                      </button>
                    </div>

                    {replyOpen[c.id] && (
                      <div className="mb-2">
                        <textarea
                          rows={2}
                          value={replyText[c.id] || ''}
                          onChange={(e) =>
                            setReplyText(prev => ({ ...prev, [c.id]: e.target.value }))
                          }
                          placeholder="Write a reply..."
                          className="w-full border border-gray-300 rounded-lg px-2 py-1 text-[12px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none mb-1"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={!(replyText[c.id] || '').trim()}
                            onClick={() => {
                              const content = (replyText[c.id] || '').trim()
                              if (!content) return
                              const reply = {
                                id: `${c.id}-reply-${Date.now()}`,
                                author: 'You',
                                content,
                                createdAt: new Date().toISOString(),
                              }
                              setReplies(prev => ({
                                ...prev,
                                [c.id]: [...(prev[c.id] || []), reply],
                              }))
                              setReplyText(prev => ({ ...prev, [c.id]: '' }))
                              setReplyOpen(prev => ({ ...prev, [c.id]: false }))
                            }}
                            className="px-3 py-0.5 rounded-lg bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 disabled:opacity-60"
                          >
                            ሪፕላይ አድርግ
                          </button>
                        </div>
                      </div>
                    )}

                    {replies[c.id]?.length ? (
                      <div className="mt-2 space-y-2 border-l border-gray-300 pl-3">
                        {replies[c.id].map(r => (
                          <div key={r.id} className="text-[12px] bg-white rounded-md border border-gray-200 p-2">
                            <div className="flex justify-between items-center text-[11px] text-gray-500 mb-0.5">
                              <span>{currentUserName}</span>
                              <span>{formatRelativeTime(r.createdAt)}</span>
                            </div>
                            <div className="text-gray-800 whitespace-pre-wrap">{r.content}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="text-xs text-gray-500">No comments yet. Be the first to comment.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Error State
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{t("announcement.details.not_found")}</h3>
            <p className="text-gray-600 text-lg mb-6">{t("announcement.details.not_found_desc")}</p>
            <button
              onClick={closeDetail}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
            >
              {t("announcement.close")}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}
      {/* Create Announcement Sheet (rendered globally, not inside filters) */}
      {openCreate && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={closeCreateSheet}
            aria-hidden
          />

          {/* Sheet Panel */}
          <div className="ml-auto h-full w-full max-w-xl bg-white shadow-2xl border-l rounded-l-2xl p-6 overflow-y-auto">
            <AddAnouncmetPage
              onClose={closeCreateSheet}
              onSuccess={async () => {
                await loadAnnouncements()
                closeCreateSheet()
              }}
            />
          </div>
        </div>
      )}

      {/* Description-only modal for text "More" */}
      {descModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
          <div
            className={
              "bg-white shadow-xl p-0 overflow-hidden " +
              (descModalFullscreen
                ? "rounded-none w-full h-full"
                : "rounded-2xl max-w-xl w-full mx-4")
            }
          >
            {/* Header with window-style controls */}
            <div className="flex items-center justify-between px-4 py-2 bg-pink-100 border-b">
              <span className="text-xs text-gray-600 truncate pr-2">{descModalTitle}</span>
              <div className="flex items-center gap-4 text-gray-700">
                <button
                  type="button"
                  className="text-sm leading-none hover:text-black"
                  aria-label="Minimize"
                >
                  -
                </button>
                <button
                  type="button"
                  className="text-xs leading-none hover:text-black border border-gray-700 px-1"
                  aria-label="Maximize"
                  onClick={() => setDescModalFullscreen(prev => !prev)}
                >
                  □
                </button>
                <button
                  type="button"
                  onClick={closeDescriptionModal}
                  className="text-sm leading-none hover:text-red-600"
                  aria-label="Close"
                >
                  X
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-80 overflow-y-auto">
                {renderTextWithLinks(descModalText)}
              </div>

              {descModalAnnouncement && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleLike(descModalAnnouncement.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700 border border-gray-200"
                    >
                      <span>👍</span>
                      <span className="font-semibold">Like</span>
                      <span className="text-xs text-gray-500">{descModalAnnouncement.likeCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDetail(descModalAnnouncement.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-gray-200"
                    >
                      <span>💬</span>
                      <span className="font-semibold">አስተያየት መስጫ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDescModalShareOpen(prev => !prev)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-purple-50 text-gray-700 hover:text-purple-700 border border-gray-200"
                    >
                      <span>🔗</span>
                      <span className="font-semibold">አጋራ</span>
                    </button>
                  </div>

                  {descModalShareOpen && (
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-700">
                      <span className="font-semibold mr-2">Share:</span>
                      <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">Facebook</a>
                      <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">Twitter</a>
                      <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">LinkedIn</a>
                      <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`https://api.whatsapp.com/send?text=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`} target="_blank">WhatsApp</a>
                      <a className="px-2 py-1 border rounded-full hover:bg-blue-50" href={`mailto:?subject=${encodeURIComponent(descModalAnnouncement.title)}&body=${encodeURIComponent(typeof window!== 'undefined' ? window.location.href : '')}`}>Email</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Announcements Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#135a98]"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-blue-100">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t("announcement.empty.title")}</h3>
          <p className="text-gray-500 mb-4">{t("announcement.empty.desc")}</p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-[#135a98] text-white rounded-lg hover:bg-[#104a7f] transition-colors"
          >
            {t("announcement.clear_filters")}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group flex"
            >
              {/* Image (Left) */}
              <div
                className="w-40 sm:w-48 md:w-56 h-40 sm:h-48 md:h-40 flex-shrink-0 bg-gray-100 relative overflow-hidden cursor-zoom-in"
                role="button"
                aria-label={t("announcement.view_details")}
                onClick={() => openDetail(a.id)}
                title={t("announcement.view_details")}
              >
                {(() => {
                  const thumbUrl = a.imageUrl || extractFirstImageUrl(a.description)
                  if (!thumbUrl) {
                    return (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 4 4 4-4 4 4" />
                        </svg>
                      </div>
                    )
                  }

                  // Count total image URLs in description (same logic as detail gallery)
                  const desc = a.description || ''
                  const urls = Array.from(desc.matchAll(/https?:\/\/[^\s]+\.(?:png|jpe?g|gif|webp|svg)/gi)).map(m => m[0])
                  const totalImages = urls.length || (thumbUrl ? 1 : 0)
                  const extraCount = Math.max(0, totalImages - 1)

                  return (
                    <>
                      {/* Main thumbnail image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbUrl}
                        alt={a.title}
                        className="w-full h-full object-contain bg-black/5"
                      />
                      {/* Overlay +N when there are extra images, similar to detail gallery style */}
                      {extraCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="text-white text-lg font-semibold">+{extraCount}</span>
                        </div>
                      )}
                    </>
                  )
                })()}
                {a.category && a.category !== 'General' && (
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full text-gray-700 border">
                      {a.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Content (Right) */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {a.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditSheet(a)}
                          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-[#135a98] transition-colors"
                          title="Edit announcement"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-colors"
                          title="Delete announcement"
                          aria-label="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openDetail(a.id)}
                      className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-[#135a98] transition-colors"
                      title={t("announcement.view_details")}
                      aria-label="View details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 border" title="Comments count">
                        {previewComments[a.id]?.total ?? 0} አስተያየት መስጫ
                      </span>
                      <time className="text-sm text-gray-500 whitespace-nowrap" dateTime={a.date} aria-label="Published date">
                        {formatRelativeTime(a.date)}
                      </time>
                    </div>
                  </div>
                </div>

                {stripImageLinksFromDescription(a.description) && (
                  <div className="mb-4 max-w-xl">
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-28 overflow-hidden">
                      {renderTextWithLinks(stripImageLinksFromDescription(a.description))}
                    </p>
                    <button
                      type="button"
                      onClick={() => openDescriptionModal(a, stripImageLinksFromDescription(a.description) || "")}
                      className="mt-1 text-xs font-semibold text-[#135a98] hover:underline"
                    >
                      More
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4" aria-label="Reactions">
                    <button
                      onClick={() => handleLike(a.id)}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-green-600 transition-colors group/like"
                      aria-label="Like"
                    >
                      <div className="p-1.5 rounded-lg group-hover/like:bg-green-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{a.likeCount}</span>
                    </button>

                    <button
                      onClick={() => handleDislike(a.id)}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-red-600 transition-colors group/dislike"
                      aria-label="Dislike"
                    >
                      <div className="p-1.5 rounded-lg group-hover/dislike:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">{a.dislikeCount}</span>
                    </button>

                    <button
                      onClick={() => setInlineOpen(prev => ({ ...prev, [a.id]: !prev[a.id] }))}
                      className="flex items-center gap-1 text-[12px] text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-full shadow-sm"
                      title="Comment"
                      aria-label="Comment"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h8M8 14h5m-9 6l2.5-2.5H19a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2" />
                      </svg>
                      አስተያየት መስጫ
                    </button>
                  </div>

                  {a.status && (
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        a.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : a.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : a.status === 'archived'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      aria-label={`Status ${a.status}`}
                    >
                      {a.status}
                    </span>
                  )}
                </div>
                {/* Preview Comments under post (compact) */}
                <div className="mt-2 space-y-1">
                  <div className="text-xs font-semibold text-gray-700">አስተያየት መስጫ</div>
                  {previewLoading[a.id] ? (
                    <div className="text-[11px] text-gray-500">Loading comments...</div>
                  ) : (previewComments[a.id]?.items?.length ? (
                    <div className="space-y-1">
                      {previewComments[a.id].items
                        .filter(pc => !hiddenPreviewCommentIds[pc.id])
                        .map(pc => (
                          <div key={pc.id} className="text-xs">
                            <div className="text-[11px] text-gray-500 flex justify-between">
                              <span>{pc.author || currentUserName}</span>
                              <span>{formatRelativeTime(pc.createdAt)}</span>
                            </div>
                            <div className="mt-0.5 text-gray-800 line-clamp-2 text-xs">{pc.content}</div>
                            {currentUserName && pc.author === currentUserName && (
                              <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => deleteAnnouncementComment(a.id, pc.id)}
                                  className="text-red-600 hover:underline"
                                >
                                  አጥፋ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHiddenPreviewCommentIds(prev => ({ ...prev, [pc.id]: true }))}
                                  className="text-gray-500 hover:underline"
                                >
                                  ደብቅ
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500">No comments yet.</div>
                  ))}
                  {/* Inline add comment trigger and input (compact) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => openDetail(a.id)}
                        className="text-[12px] text-gray-600 hover:underline"
                      >
                        {previewComments[a.id]?.total ? `View all ${previewComments[a.id].total} comments` : 'View all comments'}
                      </button>
                    </div>
                    {inlineOpen[a.id] && (
                      <div className="space-y-1">
                        <textarea
                          rows={1}
                          placeholder="Write a comment..."
                          className="w-full border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-[#135a98] focus:border-transparent outline-none"
                          value={inlineComment[a.id] || ''}
                          onChange={(e)=> setInlineComment(prev => ({ ...prev, [a.id]: e.target.value }))}
                        />
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => postInlineComment(a.id)}
                            disabled={inlinePosting[a.id] || !(inlineComment[a.id] || '').trim()}
                            className="px-2.5 py-1 bg-[#135a98] text-white rounded-md text-[12px] hover:bg-[#104a7f] disabled:opacity-60"
                          >
                            {inlinePosting[a.id] ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-12">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={`px-4 py-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              page === 1 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" 
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("announcement.pagination.prev")}
          </button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`w-10 h-10 rounded-lg transition-all duration-200 font-medium ${
                    page === pageNumber
                      ? "bg-[#135a98] text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}
            {totalPages > 5 && <span className="text-gray-500">...</span>}
          </div>

          <span className="text-gray-600 mx-4 font-medium">
            {t("announcement.pagination.page_of").replace("{page}", String(page)).replace("{total}", String(totalPages))}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className={`px-4 py-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 ${
              page >= totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md"
            }`}
          >
            {t("announcement.pagination.next")}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}