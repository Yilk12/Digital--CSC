"use client"
import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { signOut, decodeJwt } from "@/app/lib/auth"
import { FleetInboxToggle } from "@/app/components/fleet-inbox"
import ToastHost from "@/app/components/toast"
import { useLocalization } from "@/app/hooks/use-localization"
import { useIsMobile } from "@/app/hooks/use-mobile"

type NotificationSource =
  | "tickets"
  | "user"
  | "hr"
  | "field"
  | "overtime"
  | "hrOT"
  | "userOT"
  | string

type NotificationItem = {
  id: string
  message?: string
  title?: string
  createdAt?: string
  isOpen?: boolean
  source?: NotificationSource
  // Allow any additional fields coming from the backend
  [key: string]: any
}

export default function AppHeader() {
  const pathname = usePathname()
  // Minimal header (registration only). Hide header on login, forgot-password, and about pages.
  const isLogin = pathname === "/login" || pathname?.startsWith("/login/")
  const isAbout = pathname === "/about" || pathname?.startsWith("/about/")
  const isForgot = pathname === "/forgot-password" || pathname?.startsWith("/forgot-password/")
  const onAuthPages =
    pathname === "/register" || pathname?.startsWith("/register/")
  if (isLogin || isForgot || isAbout) {
    return null
  }

  // Dismiss a notification (route to appropriate delete/read logic)
  const dismissNotification = async (n: NotificationItem | null | undefined) => {
    if (!n) return
    try {
      console.debug('[Header] Dismiss click for', n)
    } catch {}
    // For user and HR notifications, call unified workflow delete
    if (n.source === 'user' || n.source === 'hr') {
      await deleteNotification(n.id)
      return
    }
    // For field notifications, now call backend delete so it disappears
    if (n.source === 'field') {
      await deleteNotification(n.id)
      return
    }
    // For overtime notifications, no backend delete yet -> mark locally
    if (n.source === 'overtime' || n.source === 'hrOT' || n.source === 'userOT') {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isOpen: true } : x)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      return
    }
    // Tickets: use existing tickets endpoint delete
    await deleteNotification(n.id)
  }

  // Delete a single notification. Supports ids with prefixes: user_, hr_, field_, or plain tickets ids.
  const deleteNotification = async (notificationId: string) => {
    console.log("ur messageis deleted")
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      let res: Response | null = null
      if (notificationId.startsWith('user_') || notificationId.startsWith('hr_')) {
        // Unified workflow delete for user/hr notifications
        const rawId = notificationId.replace(/^(user_|hr_)/, '')
        res = await fetch(`http://localhost:4000/api/workflow/notifications/${rawId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      } else if (notificationId.startsWith('field_')) {
        // Not deletable via backend per current workflow; mark locally as read
        setNotifications((prev) =>
          prev.map((x) => (x.id === notificationId ? { ...x, isOpen: true } : x)),
        )
        setUnreadCount((u: number) => Math.max(0, u - 1))
        
        return
      } else {
        // Default to tickets notifications delete
        res = await fetch(`http://localhost:4000/api/tickets/all-notification/${notificationId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
      }

      if (res && (res.ok || res.status === 404)) {
        setNotifications((prev: NotificationItem[]) => {
          const removed = prev.find((n) => n.id === notificationId)
          const next = prev.filter((n) => n.id !== notificationId)
          // adjust unread counter if the removed one was unread by our UI flag
          if (removed && !removed.isOpen) {
            setUnreadCount((u: number) => Math.max(0, u - 1))
          }
          return next
        })
        // Refresh from server to avoid stale state
        try { await loadNotifications() } catch {}
      } else if (res) {
        const txt = await res.text().catch(() => '')
        console.warn('[Header] Delete failed', res.status, txt)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }
  if (onAuthPages) {
    return (
      <header style={{ width: "100vw", background: "#fe6100", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            display: "flex",
            flexDirection: 'column',
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 10px",
            gap: 12,
            color: "#ffffff",
            flexWrap: 'wrap',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: 9999, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <Image src="/gallery/FCSC.jpg" alt="FCSC Logo" width={96} height={96} priority style={{ borderRadius: 12, objectFit: 'contain', background: '#ffffff' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.2, whiteSpace: 'nowrap', color: '#ffffff' }}>የፌደራል ሲቪል ሰርቪስ ኮሚሽን</div>
            <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.2, whiteSpace: 'nowrap', color: '#ffffff' }}>Federal Civil Service Commission</div>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap', color: '#000000' }}>INTEGRATED CSC DIGITAL SOLUTION</div>
          </div>
        </div>
        <ToastHost />
      </header>
    )
  }

  // Default header for all other pages
  const router = useRouter()
  const { currentLanguage, setLanguage, t } = useLocalization()
  const isMobile = useIsMobile()
  const [userName, setUserName] = React.useState<string>("Guest")
  const [userPhotoUrl, setUserPhotoUrl] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [fcscMenuOpen, setFcscMenuOpen] = React.useState(false)
  const [notifOpen, setNotifOpen] = React.useState(false)
  const [notifLoading, setNotifLoading] = React.useState(false)
  const [notifError, setNotifError] = React.useState<string | null>(null)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isPlanner, setIsPlanner] = React.useState(false)
  const [isDeptHead, setIsDeptHead] = React.useState(false)
  const [isTeamLead, setIsTeamLead] = React.useState(false)
  const [isEmployee, setIsEmployee] = React.useState(false)
  const [langOpen, setLangOpen] = React.useState(false)
  const [roleLabel, setRoleLabel] = React.useState<string>("User")

  // Notification reporting / filtering state
  const [notifPeriod, setNotifPeriod] = React.useState<"all" | "day" | "week" | "month" | "year">("all")

  const notifStats = React.useMemo(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - 6) // last 7 days including today
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    let day = 0, week = 0, month = 0, year = 0

    for (const n of notifications) {
      if (!n.createdAt) continue
      const d = new Date(n.createdAt)
      if (isNaN(d.getTime())) continue

      if (d >= startOfDay) day += 1
      if (d >= startOfWeek) week += 1
      if (d >= startOfMonth) month += 1
      if (d >= startOfYear) year += 1
    }

    return { day, week, month, year }
  }, [notifications])

  const filteredNotifications = React.useMemo(() => {
    if (notifPeriod === "all") return notifications

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - 6)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return notifications.filter((n) => {
      if (!n.createdAt) return false
      const d = new Date(n.createdAt)
      if (isNaN(d.getTime())) return false

      switch (notifPeriod) {
        case "day":
          return d >= startOfDay
        case "week":
          return d >= startOfWeek
        case "month":
          return d >= startOfMonth
        case "year":
          return d >= startOfYear
        default:
          return true
      }
    })
  }, [notifications, notifPeriod])

  const exportNotifications = React.useCallback(
    (format: "word" | "excel" | "pdf") => {
      if (!filteredNotifications.length || typeof window === "undefined") return

      const headers = ["Message", "Source", "Created at", "Read"]
      const rows = filteredNotifications.map((n) => [
        (n.message || n.title || "").replace(/\s+/g, " "),
        n.source ?? "",
        n.createdAt ? new Date(n.createdAt).toLocaleString() : "",
        n.isOpen ? "Read" : "Unread",
      ])

      const tableHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head><body>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${r
                    .map((cell) => `<td>${String(cell ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`)
                    .join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </body></html>`

      const now = new Date()
      const ts = now.toISOString().slice(0, 19).replace(/[:T]/g, "-")

      if (format === "pdf") {
        const win = window.open("", "_blank")
        if (!win) return
        win.document.open()
        win.document.write(tableHtml)
        win.document.close()
        win.focus()
        // User can choose "Save as PDF" from print dialog
        win.print()
        return
      }

      const mime =
        format === "word"
          ? "application/msword"
          : "application/vnd.ms-excel"
      const extension = format === "word" ? "doc" : "xls"
      const blob = new Blob([tableHtml], { type: `${mime};charset=utf-8;` })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `notifications-${notifPeriod}-${ts}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },
    [filteredNotifications, notifPeriod],
  )

  // Load notifications on component mount and when notifOpen changes
  const loadNotifications = React.useCallback(async (): Promise<void> => {
    setNotifLoading(true)
    setNotifError(null)
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    // Load persisted "mark all read" timestamp (if any)
    let markAllUntilTs = 0
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('notifications_mark_all_until')
      if (raw) {
        const parsed = Number(raw)
        if (!Number.isNaN(parsed) && parsed > 0) {
          markAllUntilTs = parsed
        }
      }
    }

    try {
      // For this installation, disable all workflow/field/overtime notifications entirely
      // and only load ticket notifications, to avoid hitting /api/workflow/* endpoints.
      const ticketsRes = await fetch('http://localhost:4000/api/tickets/all-notification', { 
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      let merged: NotificationItem[] = []
      let unread = 0

      if (ticketsRes.ok) {
        const ticketsJson = await ticketsRes.json()
        const ticketList: NotificationItem[] = Array.isArray(ticketsJson)
          ? ticketsJson
          : (Array.isArray(ticketsJson.notifications) ? ticketsJson.notifications : [])
        const ticketListWithSource = ticketList.map((n) => ({ ...n, source: 'tickets' as const }))

        // Sort newest first
        merged = ticketListWithSource.sort((a, b) => {
          const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return tb - ta
        })

        // If user has previously clicked "mark all read", treat all
        // notifications created at or before that timestamp as read
        if (markAllUntilTs > 0) {
          merged = merged.map((n) => {
            const createdTs = n.createdAt ? new Date(n.createdAt).getTime() : 0
            if (createdTs > 0 && createdTs <= markAllUntilTs) {
              return { ...n, isOpen: true }
            }
            return n
          })
        }

        unread = merged.filter((n) => !n.isOpen).length
      }

      setUnreadCount(unread)
      setNotifications(merged)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load notifications'
      setNotifError(message)
    } finally {
      setNotifLoading(false)
    }
  }, [])

  // Load notifications when component mounts
  React.useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  // Also load notifications when panel is opened (for refresh)
  React.useEffect(() => {
    if (notifOpen) {
      loadNotifications()
    }
  }, [notifOpen, loadNotifications])

  React.useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null
      if (token) {
        const payload = decodeJwt(token)
        const name = (payload as any)?.name || (payload as any)?.preferred_username || (payload as any)?.given_name || (payload as any)?.email || "User"
        setUserName(String(name))
        // derive roles and admin flag
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
        const upperRoles = roles.map(String).map(r => r.toUpperCase())

        const isAdm = upperRoles.some(r => /(ADMIN|SYSTEM[_-]?ADMIN|SUPERUSER)/.test(r))
        setIsAdmin(isAdm)
        const planner = upperRoles.includes('PLANNING') || upperRoles.includes('PLANNER') || upperRoles.includes('STRATEGY')
        const deptHead = upperRoles.includes('DEPARTMENT_HEAD') || upperRoles.includes('DEPT_HEAD')
        const teamLead = upperRoles.includes('TEAM_LEAD') || upperRoles.includes('SUPERVISOR')
        const employee = upperRoles.includes('EMPLOYEE') || upperRoles.includes('STAFF')

        setIsPlanner(planner)
        setIsDeptHead(deptHead)
        setIsTeamLead(teamLead)
        setIsEmployee(employee)

        // Derive a human-readable role label for header display.
        // Priority: System Admin > HR supervisor > Fleet manager > Planner > Dept Head > Team Lead > Employee > User.
        const hrSupervisor = upperRoles.includes('HR_SUPERVISOR') || upperRoles.includes('HR SUPERVISOR') || upperRoles.includes('HR-SUPERVISOR')
        const fleetManager = upperRoles.includes('FLEET_MANAGER') || upperRoles.includes('FLEET MANAGER') || upperRoles.includes('FLEET-MANAGER')
        const endUser = upperRoles.includes('END_USER') || upperRoles.includes('END USER') || upperRoles.includes('END-USER')

        let label = 'User'
        if (isAdm) label = 'System Admin'
        else if (hrSupervisor) label = 'HR supervisor'
        else if (fleetManager) label = 'Fleet manager'
        else if (planner) label = 'Planner'
        else if (deptHead) label = 'Department Head'
        else if (teamLead) label = 'Team Lead'
        else if (employee || endUser) label = 'User'

        setRoleLabel(label)

        const userId = (payload as any)?.id || (payload as any)?.userId || (payload as any)?.sub
        if (userId) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
          const base = apiBase.replace(/\/$/, "")
          fetch(`${base}/api/users/${userId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (!data?.photoUrl) return
              const raw = String(data.photoUrl)
              const fullUrl = raw.startsWith("http://") || raw.startsWith("https://")
                ? raw
                : `${base}${raw.startsWith("/") ? "" : "/"}${raw}`
              setUserPhotoUrl(fullUrl)
            })
            .catch(() => {})
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      const res = await fetch(`http://localhost:4000/api/tickets/notification/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (res.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isOpen: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleNotificationClick = (n: NotificationItem) => {
    const msg: string = String(n?.message || '').toUpperCase()

    // Global notifications from AllNotification table
    if (msg.includes('ANNOUNCEMENT_CREATED') || msg.includes('ANNOUNCEMENT HAS POSTED')) {
      setNotifOpen(false)
      router.push('/advertisement')
      return
    }

    if (msg.includes('COMPLAINT')) {
      setNotifOpen(false)
      router.push('/voicebox')
      return
    }

    if (msg.includes('SUGGESTION')) {
      setNotifOpen(false)
      router.push('/voicebox/suggestions')
      return
    }

    // Ticket notifications: go to Tickets page (Other Tickets tab)
    if (n?.source === 'tickets' || (msg.includes('TICKET') && msg.includes('ASSIGNED YOU'))) {
      if (n?.id) {
        // Best-effort mark as read; ignore errors
        try { markAsRead(n.id) } catch {}
      }

      const isAssignedTicket = msg.includes('ASSIGNED YOU')
      const targetUrl = isAssignedTicket ? '/tickets?tab=other&view=assigned' : '/tickets?tab=other'

      setNotifOpen(false)
      router.push(targetUrl)
      return
    }

    // Field / Overtime notifications: navigate to HR supervisor approvals page
    // Many notification shapes exist; handle common ids (fieldRequestId, overtimeId)
    const fieldId =
      n?.fieldRequestId || n?.field_request_id || n?.requestId || n?.request_id
    const overtimeId =
      n?.overtimeId || n?.overtime_id || n?.otId || n?.ot_id
    if (n?.source === 'field' || n?.source === 'overtime' || fieldId || overtimeId) {
      // mark locally as opened/read
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, isOpen: true } : x)),
      )
      setUnreadCount((u) => Math.max(0, u - (n?.isOpen ? 0 : 1)))
      setNotifOpen(false)

      const params = new URLSearchParams()
      params.set('from', 'notification')
      if (fieldId) params.set('fieldId', String(fieldId))
      if (overtimeId) params.set('overtimeId', String(overtimeId))
      // Previously redirected HR supervisor to a dedicated field-overtime dashboard.
      // That area no longer exists, so we just stop special routing here.
      return
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    try {
      // If there are ticket notifications, call backend to mark all read; otherwise just mark locally
      const hasTicketUnread = notifications.some(
        (n) => n.source === 'tickets' && !n.isOpen,
      )

      if (hasTicketUnread) {
        const res = await fetch(`http://localhost:4000/api/tickets/notification/mark-all-read`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok) {
          // If backend fails, still proceed to mark locally to keep UI consistent
          console.warn('Failed to mark tickets as read on server; marking locally')
        }
      }

      // Update local state for all types (tickets, field, hr)
      setNotifications((prev) => {
        if (typeof window !== 'undefined' && prev.length > 0) {
          // Find the most recent createdAt among current notifications
          const latestTs = prev.reduce((max, n) => {
            const ts = n.createdAt ? new Date(n.createdAt).getTime() : 0
            return ts > max ? ts : max
          }, 0)
          if (latestTs > 0) {
            try {
              window.localStorage.setItem('notifications_mark_all_until', String(latestTs))
            } catch {}
          }
        }
        return prev.map((n) => ({ ...n, isOpen: true }))
      })
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  return (
    <header style={{ width: "100vw", background: "#0e3a56", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: 'space-between',
        padding: "12px 12px",
        gap: 12,
        flexWrap: 'wrap',
        rowGap: 8,
        minHeight: 64,
      }}>
        {/* Left: App Name */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
          <span style={{ 
            color: 'white', 
            fontWeight: 800, 
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            💻 ICSDS
          </span>
        </div>

        {/* Center: Logo with caption */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Image src="/gallery/FCSC.jpg" alt="Logo" width={56} height={56} style={{ borderRadius: 12, objectFit: 'cover', background: '#ffffff' }} />
            <span style={{ color: '#ffffff', fontWeight: 800, marginTop: 4, fontSize: 14 }}>የፌዴራል ሲቪል ሰርቪስ ኮሚሽን</span>
          </div>
        </div>

        {/* Right: Mobile Back/Home + Language + Fleet Inbox + Notifications + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {isMobile && (
            <button
              onClick={() => {
                try {
                  if (window.history.length > 1) {
                    window.history.back()
                  } else {
                    router.push('/dashboard')
                  }
                } catch {
                  router.push('/dashboard')
                }
              }}
              className="px-3 py-2 rounded-2xl border-2 border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center gap-2 text-sm font-semibold"
              title="Back / Home"
            >
              ←
            </button>
          )}
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
              title={currentLanguage === 'am' ? 'አማርኛ' : 'English'}
              className="px-3 py-2 rounded-2xl border-2 border-white/20 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center gap-2"
            >
              <span role="img" aria-label="language">🌐</span>
              <span className="hidden sm:inline text-sm font-semibold">{currentLanguage === 'am' ? 'አማርኛ' : 'English'}</span>
            </button>
            {langOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 min-w-[160px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
              >
                <button
                  onClick={() => { setLanguage('am'); setLangOpen(false) }}
                  className="w-full text-left px-4 py-2 text-[#0e3a56] font-semibold hover:bg-gray-100"
                >
                  አማርኛ
                </button>
                <button
                  onClick={() => { setLanguage('en'); setLangOpen(false) }}
                  className="w-full text-left px-4 py-2 text-[#0e3a56] font-semibold hover:bg-gray-100"
                >
                  English
                </button>
              </div>
            )}
          </div>
          <FleetInboxToggle />
          <div className="relative">
            <button
              title="Notifications"
              aria-haspopup="menu"
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen(v => !v)}
              className="relative p-2 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl shadow-lg border-2 border-white/20 backdrop-blur-sm"
            >
              {/* Animated Bell Icon */}
              <div className="relative">
                <svg 
                  className={`w-6 h-6 text-white transform transition-all duration-500 ${notifOpen ? 'rotate-12 scale-110' : 'hover:rotate-6'}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 006.86 10.6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                
                {/* Floating Notification Badge */}
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2">
                    <div className="relative">
                      {/* Outer Pulse Effect */}
                      <div className="absolute inset-0 animate-ping bg-red-500 rounded-full opacity-75"></div>
                      {/* Main Badge */}
                      <div className="relative bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full min-w-[24px] h-6 flex items-center justify-center text-xs font-bold shadow-lg border-2 border-white transform hover:scale-110 transition-transform duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* Notification Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-3 w-96 max-h-[600px] overflow-hidden z-50">
                {/* Floating Card with Glass Effect */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-slide-down">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-2 right-2 w-20 h-20 bg-white rounded-full"></div>
                      <div className="absolute bottom-2 left-2 w-16 h-16 bg-white rounded-full"></div>
                    </div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 006.86 10.6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Notifications</h3>
                          {unreadCount > 0 && (
                            <p className="text-blue-100 text-sm font-medium">
                              {unreadCount} new message{unreadCount > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-sm font-semibold transition-all duration-200 transform hover:scale-105 border border-white/30"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Report filters */}
                  {notifications.length > 0 && (
                    <div className="px-4 pt-3 pb-2 bg-white/90 border-b border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <div className="flex-1">
                          <label className="block mb-1 text-[11px] text-gray-600">Report period</label>
                          <select
                            value={notifPeriod}
                            onChange={(e) => setNotifPeriod(e.target.value as any)}
                            className="w-full border border-gray-300 rounded-full px-3 py-1.5 text-xs bg-white"
                          >
                            <option value="all">All</option>
                            <option value="day">Today</option>
                            <option value="week">Last 7 days</option>
                            <option value="month">This month</option>
                            <option value="year">This year</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-600 mr-1 hidden sm:inline">Export:</span>
                          <button
                            type="button"
                            onClick={() => exportNotifications("word")}
                            className="px-2 py-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold shadow-sm hover:bg-blue-700 disabled:bg-gray-300"
                            disabled={!filteredNotifications.length}
                          >
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={() => exportNotifications("excel")}
                            className="px-2 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold shadow-sm hover:bg-emerald-700 disabled:bg-gray-300"
                            disabled={!filteredNotifications.length}
                          >
                            Excel
                          </button>
                          <button
                            type="button"
                            onClick={() => exportNotifications("pdf")}
                            className="px-2 py-1 rounded-full bg-red-600 text-white text-[11px] font-semibold shadow-sm hover:bg-red-700 disabled:bg-gray-300"
                            disabled={!filteredNotifications.length}
                          >
                            PDF
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification List */}
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {notifLoading ? (
                      <div className="p-8 text-center">
                        <div className="inline-flex items-center gap-3 text-gray-500">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading notifications...</span>
                        </div>
                      </div>
                    ) : notifError ? (
                      <div className="p-6 text-center text-red-500 bg-red-50 m-4 rounded-2xl">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {notifError}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.24 8.56a5.97 5.97 0 01-4.66-7.4 1 1 0 00-1.2-1.2 7.97 7.97 0 006.86 10.6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="font-semibold">No notifications</p>
                        <p className="text-sm mt-1">We'll notify you when something arrives</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {filteredNotifications.map((n: NotificationItem, idx: number) => (
                          <div
                            key={n.id || n.createdAt || idx}
                            onClick={() => handleNotificationClick(n)}
                            className={`group relative p-4 m-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                              !n.isOpen 
                                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 shadow-lg' 
                                : 'bg-gray-50 hover:bg-white border-l-4 border-transparent'
                            }`}
                          >
                            {/* Unread Indicator */}
                            {!n.isOpen && (
                              <div className="absolute top-4 left-3">
                                <div className="relative">
                                  <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
                                  <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-60"></div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start gap-4 pl-2">
                              {/* Avatar/Icon */}
                              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                                !n.isOpen 
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' 
                                  : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                              }`}>
                                {n.source === 'field' ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-semibold text-sm leading-relaxed ${
                                  !n.isOpen ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {n.message || n.title || 'New notification'}
                                </p>
                                <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                                </p>
                              </div>

                              {/* Action Button (show for all unread, including field). Stop click from navigating. */}
                              {!n.isOpen && (
                                <button
                                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                    e.stopPropagation()
                                    dismissNotification(n)
                                  }}
                                  title="Mark as read"
                                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-all duration-200 transform hover:scale-110"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                      <div className="text-center text-sm text-gray-500">
                        {notifications.length} notification{notifications.length > 1 ? 's' : ''} total
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setMenuOpen((v: boolean) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={`Welcome ${userName}`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff', padding: 0 }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28,
                height: 28,
                borderRadius: '9999px',
                background: '#163d52',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.25)'
              }}>
                <span role="img" aria-label="user">👤</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 12 }}>{userName}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{roleLabel}</span>
              </span>
            </span>
          </button>
          {menuOpen ? (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                minWidth: 200,
                padding: 8,
                zIndex: 40,
              }}
            >
              <button
                onClick={() => { setMenuOpen(false); router.push('/admin/settings/security') }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 10px', cursor: 'pointer', color: '#0e3a56', fontWeight: 600, borderRadius: 6 }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Change Password
              </button>
              <button
                onClick={() => { setMenuOpen(false); signOut('/login') }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 10px', cursor: 'pointer', color: '#b91c1c', fontWeight: 700, borderRadius: 6 }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = '#fef2f2')}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <ToastHost />
    </header>
  )
}