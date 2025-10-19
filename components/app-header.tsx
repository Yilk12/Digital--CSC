"use client"
import React from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useLocalization } from "@/hooks/use-localization"
import { signOut, decodeJwt } from "@/app/lib/auth"
import { FleetInboxToggle } from "@/components/fleet-inbox"
import ToastHost from "@/components/toast"

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
  if (onAuthPages) {
    return (
      <header style={{ width: "100%", background: "#fe6100", borderBottom: "1px solid #e5e7eb" }}>
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
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.2, whiteSpace: 'nowrap', color: '#ffffff' }}>INTEGRATED CSC DIGITAL SOLUTION</div>
          </div>
        </div>
        <ToastHost />
      </header>
    )
  }

  // Default header for all other pages (unchanged)
  const { t, setLanguage } = useLocalization()
  const router = useRouter()
  const [userName, setUserName] = React.useState<string>("Guest")
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [langOpen, setLangOpen] = React.useState(false)
  const [orgOpen, setOrgOpen] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isPlanner, setIsPlanner] = React.useState(false)
  const [isDeptHead, setIsDeptHead] = React.useState(false)
  const [isTeamLead, setIsTeamLead] = React.useState(false)
  const [isEmployee, setIsEmployee] = React.useState(false)
  const [search, setSearch] = React.useState("")

  // Map common keywords to module routes
  const moduleKeywordMap: Array<{ path: string; tests: RegExp[] }> = React.useMemo(() => [
    { path: "/dashboard", tests: [/^home$/, /^dashboard$/, /\bdashboard\b/] },
    { path: "/about", tests: [/^about$/] },
    { path: "/admin", tests: [/^admin$/, /administrator/] },
    { path: "/advertisement", tests: [/\bannouncement(s)?\b/, /\bannounce\b/, /\badvert(isement)?\b/, /\bnotice(s)?\b/] },
    { path: "/analytics", tests: [/\banalytics?\b/, /\breports?\b/] },
    { path: "/chat", tests: [/^chat$/, /chatbot/, /conversation/] },
    { path: "/complaints", tests: [/complaint(s)?/, /grievance(s)?/] },
    { path: "/departments", tests: [/department(s)?/] },
    { path: "/documents", tests: [/document(s)?/, /file(s)?/, /records?/] },
    { path: "/driver", tests: [/driver(s)?/] },
    { path: "/feedback", tests: [/feedback/, /survey/] },
    { path: "/finance", tests: [/finance/, /budget/, /payment(s)?/] },
    { path: "/fleet", tests: [/fleet/, /vehicle(s)?/] },
    { path: "/gm", tests: [/gm\b/, /general\s*management/i] },
    { path: "/knowledge-base", tests: [/\bkb\b/, /knowledge(-|\s)?base\b/, /knowledge\b/] },
    { path: "/messages", tests: [/^messages?$/] },
    { path: "/plan", tests: [/^plan(s)?$/, /planning/] },
    { path: "/planning", tests: [/planning\s*module/] },
    { path: "/reporting", tests: [/reporting/] },
    { path: "/settings", tests: [/setting(s)?/, /preferences?/, /profile/] },
    { path: "/submissions", tests: [/submission(s)?/, /apply|application/] },
    { path: "/tickets", tests: [/ticket(s)?/, /support/] },
    { path: "/users", tests: [/user(s)?/, /accounts?/, /staff/] },
    { path: "/voicebox", tests: [/voice(box)?/, /audio/] },
    { path: "/workflow", tests: [/work\s*flow|workflow/] },
  ], [])

  const resolveModulePath = (q: string) => {
    const lower = q.toLowerCase()
    for (const m of moduleKeywordMap) {
      if (m.tests.some(r => r.test(lower))) return m.path
    }
    return ""
  }

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
        const lower = roles.map(String).map(r=>r.toUpperCase())
        const isAdm = lower.some(r => /(ADMIN|SYSTEM[_-]?ADMIN|SUPERUSER)/.test(r))
        setIsAdmin(isAdm)
        setIsPlanner(lower.includes('PLANNING') || lower.includes('PLANNER') || lower.includes('STRATEGY'))
        setIsDeptHead(lower.includes('DEPARTMENT_HEAD') || lower.includes('DEPT_HEAD'))
        setIsTeamLead(lower.includes('TEAM_LEAD') || lower.includes('SUPERVISOR'))
        setIsEmployee(lower.includes('EMPLOYEE') || lower.includes('STAFF'))
      }
    } catch {
      // ignore
    }
  }, [])
  return (
    <header style={{ width: "100%", background: "#0e3a56", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: 'space-between',
        padding: "12px 18px",
        gap: 14,
        height: 84,
      }}>
        {/* Left: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 220 }}>
          <Image src="/gallery/FCSC.jpg" alt="Logo" width={28} height={28} style={{ borderRadius: 6, objectFit: 'cover', background: '#ffffff' }} />
          <span style={{ color: '#ffffff', fontWeight: 800, letterSpacing: 0.2 }}>የፌዴራል ሲቪል ሰርቪስ ኮሚሽን-ICSCDS</span>
        </div>

        {/* Center: Search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          {/* Centered FCSC dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOrgOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={orgOpen}
              title="FCSC"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.35)',
                color: '#ffffff',
                borderRadius: 6,
                padding: '4px 10px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              FCSC ▾
            </button>
            {orgOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '110%',
                  left: 0,
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  minWidth: 180,
                  padding: 6,
                  zIndex: 60,
                }}
              >
                <button
                  onClick={() => { setOrgOpen(false); router.push('/about') }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 10px', cursor: 'pointer', color: '#0e3a56', fontWeight: 600, borderRadius: 6 }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
                >
                  About Us
                </button>
                <button
                  onClick={() => { setOrgOpen(false); router.push('/advertisement') }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 10px', cursor: 'pointer', color: '#0e3a56', fontWeight: 600, borderRadius: 6 }}
                  onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                  onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
                >
                  Announcement
                </button>
              </div>
            )}
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const q = (search || "").trim().replace(/"+$/,'')
                if (!q) return
                let path = ""
                const lower = q.toLowerCase()
                const isUrl = lower.startsWith("http://") || lower.startsWith("https://")
                const isKbKeyword = /(\bknowledge\b|\bknowledge-base\b|\bknowledgebase\b|\bkb\b)/i.test(q)
                const isAnnKeyword = /(\bannouncement\b|\bannouncements\b|\bannounce\b|\badvert\b|\badvertisement\b|\bnotice\b|\bnotices\b)/i.test(q)

                if (isUrl) {
                  try {
                    const u = new URL(q)
                    // If it's the KB URL on same host, keep path; otherwise still navigate by path
                    path = u.pathname + (u.search || "") + (u.hash || "")
                  } catch {}
                } else if (lower.startsWith("/")) {
                  path = q
                } else {
                  // Try module keyword map first
                  const modulePath = resolveModulePath(q)
                  if (modulePath) path = modulePath
                }
                if (!path && isAnnKeyword) {
                  // Allow passing query to announcements if present
                  const sp = new URLSearchParams()
                  if (q && !/^(announcement|announcements|announce|advert|advertisement|notice|notices)$/i.test(q)) sp.set('search', q)
                  path = "/advertisement" + (sp.toString() ? `?${sp.toString()}` : "")
                } else if (!path && isKbKeyword) {
                  const sp = new URLSearchParams()
                  if (q && !/^(kb|knowledge|knowledge base|knowledge-base|knowledgebase)$/i.test(lower)) sp.set('search', q)
                  path = "/knowledge-base" + (sp.toString() ? `?${sp.toString()}` : "")
                } else if (!path) {
                  // Default fallback: search within knowledge base
                  const sp = new URLSearchParams({ search: q })
                  path = "/knowledge-base?" + sp.toString()
                }
                if (path) router.push(path)
                setSearch("")
              }}
            >
              <input
                type="search"
                placeholder="INTEGRATED CSC DIGITAL SOLUTION"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-watermark"
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 6,
                  border: 'none',
                  outline: 'none',
                  background: '#ffffff',
                }}
              />
            </form>
            <span aria-hidden="true" style={{ position: 'absolute', left: 10, top: 7, color: '#6b7280' }}>🔍</span>
          </div>
          {/* Right-center: Messages + Language (globe) */}
          <Link href="/messages" prefetch={false} style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'none' }}>
            {t('nav.messages')}
          </Link>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={langOpen}
              onClick={() => setLangOpen(v=>!v)}
              title="Language"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                fontWeight: 700,
                color: '#ffffff'
              }}
            >
              🌐
            </button>
            {langOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: 160,
                  padding: 6,
                  zIndex: 70
                }}
              >
                <button
                  onClick={() => { setLanguage('am' as any); setLangOpen(false) }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 8px', cursor: 'pointer', borderRadius: 6, color: '#0e3a56', fontWeight: 600 }}
                  onMouseEnter={(e)=>((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                  onMouseLeave={(e)=>((e.target as HTMLButtonElement).style.background = 'transparent')}
                >Amharic</button>
                <button
                  onClick={() => { setLanguage('or' as any); setLangOpen(false) }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 8px', cursor: 'pointer', borderRadius: 6, color: '#0e3a56', fontWeight: 600 }}
                  onMouseEnter={(e)=>((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                  onMouseLeave={(e)=>((e.target as HTMLButtonElement).style.background = 'transparent')}
                >Oromogna</button>
                <button
                  onClick={() => { setLanguage('en' as any); setLangOpen(false) }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 8px', cursor: 'pointer', borderRadius: 6, color: '#0e3a56', fontWeight: 600 }}
                  onMouseEnter={(e)=>((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                  onMouseLeave={(e)=>((e.target as HTMLButtonElement).style.background = 'transparent')}
                >English</button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Fleet Inbox + Notifications + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <FleetInboxToggle />
          <button title="Notifications" style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 18 }}>🔔</button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
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
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{isAdmin ? 'System Admin' : (isPlanner ? 'Planner' : (isDeptHead ? 'Department Head' : (isTeamLead ? 'Team Lead' : (isEmployee ? 'Employee' : 'User'))))}</span>
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
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#f3f4f6')}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Change Password
              </button>
              <button
                onClick={() => { setMenuOpen(false); signOut('/login') }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '8px 10px', cursor: 'pointer', color: '#b91c1c', fontWeight: 700, borderRadius: 6 }}
                onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.background = '#fef2f2')}
                onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.background = 'transparent')}
              >
                Sign Out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

