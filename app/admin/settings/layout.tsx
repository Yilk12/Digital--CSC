"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card, CardContent } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { useEffect, useRef, useState } from "react"
import { Settings } from "lucide-react"
import SettingsPanel from "@/app/components/settings-panel"
import { getCurrentUserRoles } from "@/app/lib/auth"

const getVisibleSections = () => {
  try {
    const roles = getCurrentUserRoles().map((r) => String(r).toLowerCase())
    const isAdmin = roles.includes("admin")
    if (isAdmin) {
      return [
        { label: "Users & Roles", href: "/admin/settings/users" },
        { label: "Accounts", href: "/admin/settings/accounts" },
        { label: "Security", href: "/admin/settings/security" },
      ]
    }
  } catch {}
  return [
    { label: "Security", href: "/admin/settings/security" },
  ]
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [sections, setSections] = useState<{ label: string; href: string }[]>([])

  // Localization: Ethiopian regional languages
  const languages = [
    { code: "en", label: "English" },
    { code: "am", label: "Amharic (አማርኛ)" },
    { code: "om", label: "Afaan Oromo" },
    { code: "ti", label: "Tigrinya (ትግርኛ)" },
    { code: "so", label: "Somali" },
    { code: "aa", label: "Afar" },
    { code: "sid", label: "Sidama" },
    { code: "wal", label: "Wolaytta" },
    { code: "gru", label: "Gurage" },
    { code: "had", label: "Hadiyya" },
    { code: "kam", label: "Kambaata" },
    { code: "gam", label: "Gamo" },
    { code: "gof", label: "Gofa" },
    { code: "ged", label: "Gedeo" },
    { code: "bnc", label: "Bench" },
    { code: "shk", label: "Sheka" },
    { code: "kef", label: "Keffa" },
    { code: "nur", label: "Nuer" },
    { code: "anu", label: "Anuak" },
    { code: "slt", label: "Silt'e" },
    { code: "har", label: "Harari" },
  ]
  const [locale, setLocale] = useState<string>("en")
  const [openLocale, setOpenLocale] = useState<boolean>(false)
  const localeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("locale") : null
    if (saved) setLocale(saved)
  }, [])

  useEffect(() => {
    setSections(getVisibleSections())
  }, [])

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!localeRef.current) return
      if (!localeRef.current.contains(e.target as Node)) {
        setOpenLocale(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const selectLocale = (code: string) => {
    setLocale(code)
    try {
      window.localStorage.setItem("locale", code)
      window.dispatchEvent(new CustomEvent("locale:change", { detail: { locale: code } }))
    } catch {}
    setOpenLocale(false)
  }

  const handleSettingsClick = () => {
    setIsSettingsOpen(true)
  }

  const handleSettingsClose = () => {
    setIsSettingsOpen(false)
  }

  return (
    <div className="flex flex-col h-screen">
      {pathname !== "/admin/settings/security" && (
        <header className="flex items-center justify-between bg-transparent shadow-none px-6 py-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded" />
            <h1 className="text-xl font-bold text-gray-800">Help-Desk System</h1>
          </div>
          <div className="flex items-center gap-4 relative">
            {/* Localization - top-right in header */}
            <div ref={localeRef} className="relative">
              <button
                onClick={() => setOpenLocale((v) => !v)}
                className="px-3 py-2 rounded-md border text-sm font-semibold bg-white text-blue-700 border-gray-200 shadow-sm hover:bg-gray-50"
                aria-haspopup="listbox"
                aria-expanded={openLocale}
                title="Localization"
              >
                {languages.find((l) => l.code === locale)?.label || "Language"}
              </button>
              {openLocale && (
                <div
                  role="listbox"
                  className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-md border border-gray-200 shadow-xl z-50"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => selectLocale(lang.code)}
                      role="option"
                      aria-selected={locale === lang.code}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                        locale === lang.code ? "bg-blue-50" : ""
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="p-2 rounded-full hover:bg-gray-200">🔔</button>
            <button className="p-2 rounded-full hover:bg-gray-200">👤</button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSettingsClick}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Quick Settings
            </Button>
          </div>
        </header>
      )}

      <nav className="flex bg-blue-600 text-white px-6 py-3 shadow-sm">
        {sections.map((sec) => {
          const isActive = pathname?.startsWith(sec.href)
          return (
            <Link
              key={sec.href}
              href={sec.href}
              className={`mr-4 px-4 py-2 rounded-lg transition ${
                isActive ? "bg-white text-blue-600 font-semibold" : "hover:bg-blue-500"
              }`}
            >
              {sec.label}
            </Link>
          )
        })}
      </nav>

      <main className="flex-1 p-6 overflow-y-auto">
        <Card className="mb-6 bg-transparent shadow-none">
          <CardContent className="pt-6">
            {children}
          </CardContent>
        </Card>
        <div className="flex gap-4">
          <Button className="bg-blue-600 text-white hover:bg-blue-700">Save Changes</Button>
          <Button variant="outline">Reset</Button>
        </div>
      </main>
      <SettingsPanel isOpen={isSettingsOpen} onClose={handleSettingsClose} />
    </div>
  )
}


