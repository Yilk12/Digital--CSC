"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield, User, Building, ChevronDown, Eye, EyeOff, Copy, RefreshCcw } from "lucide-react"
 
import { useToast } from "@/components/toast-provider"
import { departmentsApi, type DepartmentSummary } from "@/app/lib/departments-api"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { PERMISSION_MODULES } from "@/app/lib/permissions"
import { validatePassword, defaultPolicy } from "@/lib/password-policy"

interface UserFormProps {
  onClose: () => void
  user?: any // For editing existing users
}

export function UserForm({ onClose, user }: UserFormProps) {
  const [language] = useState<"en" | "am">("en")
  const { show: toast } = useToast()
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: user?.role || "",
    department: user?.department || "",
    userType: user?.userType || "Internal",
    status: user?.status || "Active",
    helpdeskRole: user?.helpdeskRole || "",
    kbRole: user?.kbRole || "",
    moduleRoles: {
      bscAdmin: false,
      fleetAdmin: false,
      helpdeskAdmin: false,
      kbAdmin: false,
    },
    permissions: {
      canCreateTickets: true,
      canAssignTickets: false,
      canManageUsers: false,
      canAccessReports: false,
      canManageKnowledgeBase: false,
      canViewAllTickets: false,
    },
  })

  const [defaultPassword, setDefaultPassword] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const generateDefaultPassword = () => {
    // Policy: length >= 12, include at least 1 uppercase, 1 lowercase, 1 digit, and '@'
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"
    const lower = "abcdefghijkmnpqrstuvwxyz"
    const digits = "23456789"
    const symbols = "!#$%^&*" // exclude '@' here so we can force-insert one
    const requiredSymbol = "@"
    const all = upper + lower + digits + symbols
    const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)]
    const len = 12
    const chars = [
      pick(upper),
      pick(lower),
      pick(digits),
      requiredSymbol,
    ]
    for (let i = chars.length; i < len; i++) chars.push(pick(all))
    // shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    return chars.join("")
  }

  useEffect(() => {
    if (!user) {
      setDefaultPassword((prev) => prev ?? generateDefaultPassword())
    }
  }, [user])

  // Ensure Help Desk Admin and Knowledge Base Admin are always in sync (one person)
  const setModuleRoleLinked = (key: 'bscAdmin'|'fleetAdmin'|'helpdeskAdmin'|'kbAdmin', checked: boolean) => {
    setFormData((p) => {
      const next = { ...p.moduleRoles }
      if (key === 'helpdeskAdmin' || key === 'kbAdmin') {
        next.helpdeskAdmin = checked
        next.kbAdmin = checked
      } else {
        ;(next as any)[key] = checked
      }
      return { ...p, moduleRoles: next }
    })
  }

  // Dynamic permissions by module/activity (checkboxes)
  const [selectedPerms, setSelectedPerms] = useState<Record<string, Record<string, boolean>>>({})
  const isPermChecked = (moduleKey: string, activityKey: string) => Boolean(selectedPerms?.[moduleKey]?.[activityKey])
  const setPermChecked = (moduleKey: string, activityKey: string, value: boolean) => {
    setSelectedPerms(prev => ({
      ...prev,
      [moduleKey]: { ...(prev[moduleKey] || {}), [activityKey]: value },
    }))
  }
  const setModuleAllPerms = (moduleKey: string, value: boolean) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return
    setSelectedPerms(prev => ({
      ...prev,
      [moduleKey]: Object.fromEntries(mod.activities.map(a => [a.key, value])),
    }))
  }
  const allModulePermsChecked = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return false
    const current = selectedPerms[moduleKey] || {}
    return mod.activities.every(a => current[a.key])
  }
  const anyModulePermsChecked = (moduleKey: string) => {
    const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
    if (!mod) return false
    const current = selectedPerms[moduleKey] || {}
    return mod.activities.some(a => current[a.key])
  }

  // Build default permissions for a given role across modules
  const buildPermsForRole = (role: string): Record<string, Record<string, boolean>> => {
    const map: Record<string, Record<string, boolean>> = {}
    const set = (moduleKey: string, activities: string[]) => {
      const mod = PERMISSION_MODULES.find(m => m.key === moduleKey)
      if (!mod) return
      map[moduleKey] = map[moduleKey] || {}
      for (const a of mod.activities) map[moduleKey][a.key] = false
      for (const k of activities) if (mod.activities.some(a=>a.key===k)) map[moduleKey][k] = true
    }

    // Commissioner: everything
    if (role === 'General Director') {
      for (const mod of PERMISSION_MODULES) {
        map[mod.key] = Object.fromEntries(mod.activities.map(a => [a.key, true])) as Record<string, boolean>
      }
      return map
    }

    // Admin: broad control
    if (role === 'Admin') {
      for (const mod of PERMISSION_MODULES) {
        // default view everywhere
        const hasView = mod.activities.some(a=>a.key==='view')
        if (hasView) set(mod.key, ['view'])
      }
      set('users', ['view','invite','update','disable','delete'])
      set('tickets', ['view','create','assign','update','delete'])
      set('knowledge_base', ['view','create','edit','publish','delete'])
      set('bcas', ['view_dashboards','manage_kpis','upload_data','configure'])
      set('fleet', ['view','vehicle_register','driver_register','assign_driver','maintenance_request'])
      set('analytics', ['view','export'])
      set('announcement', ['view','create','publish','update','delete'])
      set('voicebox', ['view','create','moderate','update','delete'])
      set('plan_report', ['view','create','submit','approve','update','delete'])
      set('overtime_field', ['view','create','update','approve','delete'])
      return map
    }

    if (role === 'Announcement Creator') {
      set('announcement', ['view','create','publish'])
      set('knowledge_base', ['view'])
      return map
    }

    if (role === 'Support Agent') {
      set('tickets', ['view','create','assign','update'])
      set('knowledge_base', ['view'])
      set('analytics', ['view'])
      return map
    }

    if (role === 'End User') {
      set('tickets', ['view','create'])
      set('knowledge_base', ['view'])
      set('plan_report', ['view','create','submit'])
      return map
    }

    if (role === 'Fleet Manager') {
      set('fleet', ['view','vehicle_register','driver_register','assign_driver','maintenance_request'])
      set('analytics', ['view'])
      return map
    }

    if (role === 'Department Head') {
      set('fleet', ['view','maintenance_request'])
      set('plan_report', ['view','approve'])
      return map
    }

    if (role === 'Driver') {
      set('fleet', ['view'])
      return map
    }

    if (role === 'Maintenance Team') {
      set('fleet', ['view','maintenance_request'])
      return map
    }

    if (role === 'Finance Department') {
      set('fleet', ['view'])
      set('analytics', ['view','export'])
      return map
    }

    return map
  }

  // Apply defaults on role change
  useEffect(() => {
    const perms = buildPermsForRole(formData.role)
    if (Object.keys(perms).length) setSelectedPerms(perms)
  }, [formData.role])

  // Dropdown open state per module
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const toggleModuleOpen = (key: string) => setExpandedModules((p) => ({ ...p, [key]: !p[key] }))
  const permSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handler = () => {
      const next: Record<string, boolean> = {}
      for (const m of PERMISSION_MODULES) next[m.key] = true
      setExpandedModules(next)
      // smooth scroll to permissions section
      try {
        permSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('open-permissions', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-permissions', handler)
      }
    }
  }, [])

  const baseRoles = [
    { value: "General Director", label: language === "en" ? "Commissioner" : "ኮሚሽነር" },
    { value: "Admin", label: language === "en" ? "Admin" : "አስተዳዳሪ" },
    { value: "Announcement Creator", label: language === "en" ? "Announcement Creator" : "የመረጃ ማስታወቂያ ፈጣሪ" },
    { value: "Support Agent", label: language === "en" ? "Support Agent" : "የድጋፍ ወኪል" },
    { value: "End User", label: language === "en" ? "End User" : "የመጨረሻ ተጠቃሚ" },
    // Module-specific admin roles (Fleet Admin removed; mapped to Fleet Manager)
  ]

  const fleetSpecificRoles = [
    { value: "Fleet Manager", label: language === "en" ? "Fleet Manager" : "የFleet አስተዳዳሪ" },
    { value: "Department Head", label: language === "en" ? "Department Head" : "የክፍል ኃላፊ" },
    { value: "Driver", label: language === "en" ? "Driver" : "አሽከርካሪ" },
    { value: "Maintenance Team", label: language === "en" ? "Maintenance Team" : "የእንክብካቤ ቡድን" },
    { value: "Finance Department", label: language === "en" ? "Finance Department" : "የፋይናንስ ክፍል" },
  ]

  const bscSpecificRoles: { value: string; label: string }[] = []

  const currentRoles = getCurrentUserRoles().map(r => r.toLowerCase())
  const canCreateFleetRoles = currentRoles.includes('admin') || currentRoles.includes('fleet manager')
  const canCreateBscRoles = currentRoles.includes('admin') || currentRoles.includes('bsc admin')
  const roles = [
    ...baseRoles,
    ...(canCreateFleetRoles ? fleetSpecificRoles : []),
    ...(canCreateBscRoles ? bscSpecificRoles : []),
  ]

  useEffect(() => {
    const isAdmin = formData.role === "Admin"
    const isFleetManager = formData.role === "Fleet Manager"
    setFormData((p) => ({
      ...p,
      moduleRoles: {
        ...p.moduleRoles,
        helpdeskAdmin: isAdmin,
        kbAdmin: isAdmin,
        fleetAdmin: isFleetManager,
      },
    }))
  }, [formData.role])

  // When 'Announcement Creator' is selected, auto-enable announcement create/publish (and view) permissions
  useEffect(() => {
    if (formData.role === "Announcement Creator") {
      setSelectedPerms((prev) => ({
        ...prev,
        announcement: {
          ...(prev.announcement || {}),
          view: true,
          create: true,
          publish: true,
        },
      }))
    }
  }, [formData.role])

  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingDepts(true)
        const res = await departmentsApi.list({ limit: 200 })
        setDepartments(res.departments)
      } catch (e) {
        // fallback silently; the select will just be empty
        console.error("Failed to load departments", e)
      } finally {
        setLoadingDepts(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const fleetRolesSet = new Set(fleetSpecificRoles.map(r => r.value))
      const bscRolesSet = new Set(bscSpecificRoles.map(r => r.value))
      const isFleetUser = fleetRolesSet.has(formData.role) || formData.moduleRoles.fleetAdmin
      const isBscUser = bscRolesSet.has(formData.role) || formData.moduleRoles.bscAdmin
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        userType: formData.userType,
        status: formData.status,
        moduleRoles: formData.moduleRoles,
        helpdeskRole: formData.helpdeskRole,
        kbRole: formData.kbRole,
        permissionsSelected: selectedPerms,
      }
      // Only when creating a new user (not editing), assign the generated default password (or generate if missing)
      let pwdToUse: string | null = defaultPassword
      if (!user) {
        if (!pwdToUse) {
          pwdToUse = generateDefaultPassword()
          setDefaultPassword(pwdToUse)
        }
        ;(payload as any).password = pwdToUse
      }
      if (isFleetUser) payload.module = 'fleet'
      else if (isBscUser) payload.module = 'bsc'

      // Client-side validation against policy (applies to generated or custom passwords)
      if ((payload as any).password) {
        const result = validatePassword((payload as any).password, defaultPolicy)
        if (!result.ok) {
          toast({
            variant: 'destructive',
            title: language === 'en' ? 'Password does not meet policy' : 'የይለፍ ቃል ፖሊሲን አልከተለም',
            description: result.errors.join(', '),
          })
          return
        }
      }

      // Attach Authorization header from localStorage like api helpers do
      const token = (typeof window !== 'undefined')
        ? (window.localStorage.getItem('accessToken') || window.localStorage.getItem('jwt') || window.localStorage.getItem('token'))
        : null
      const headers = new Headers({ 'Content-Type': 'application/json' })
      if (token) headers.set('Authorization', `Bearer ${token}`)

      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
      })
      const data = await resp.json().catch(()=>({}))
      if (!resp.ok) throw new Error(data?.message || 'Failed to create user')
      if (pwdToUse) {
        try { await navigator.clipboard.writeText(pwdToUse) } catch {}
        toast({
          variant: 'success',
          title: language === 'en' ? 'User created' : 'ተጠቃሚ ተፈጥሯል',
          description: language === 'en'
            ? `Default password: ${pwdToUse} (copied to clipboard)`
            : `ነባሪ የይለፍ ቃል፡ ${pwdToUse} (ወደ ቅንፍ ተቀድመዋል)`,
        })
      } else {
        toast({ variant: 'success', title: language === 'en' ? 'User updated' : 'ተጠቃሚ ያዘምኗል' })
      }
      onClose()
    } catch (err: any) {
      toast({ variant: 'destructive', title: language === 'en' ? 'Failed to create user' : 'ተጠቃሚ መፍጠር አልተሳካም', description: err?.message })
    }
  }

  const updatePermissions = (permission: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
      },
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {language === "en" ? "Basic Information" : "መሰረታዊ መረጃ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === "en" ? "Full Name" : "ሙሉ ስም"} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={language === "en" ? "Enter full name" : "ሙሉ ስም ያስገቡ"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{language === "en" ? "Email Address" : "የኢሜይል አድራሻ"} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder={language === "en" ? "Enter email address" : "የኢሜይል አድራሻ ያስገቡ"}
                required
              />
            </div>
          </div>

          {!user && (
            <div className="space-y-2">
              <Label htmlFor="defaultPassword">{language === "en" ? "Default Password" : "ነባሪ የይለፍ ቃል"}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="defaultPassword"
                  type={showPassword ? "text" : "password"}
                  value={defaultPassword || ""}
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={language === 'en' ? (showPassword ? 'Hide password' : 'Show password') : (showPassword ? 'ደብቅ' : 'አሳይ')}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try { if (defaultPassword) await navigator.clipboard.writeText(defaultPassword) } catch {}
                    toast({ variant: 'success', title: language === 'en' ? 'Copied' : 'ተቀድመዋል' })
                  }}
                  aria-label={language === 'en' ? 'Copy password' : 'ይቅዱ'}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = generateDefaultPassword()
                    setDefaultPassword(next)
                    setShowPassword(false)
                    toast({ variant: 'success', title: language === 'en' ? 'Password regenerated' : 'የይለፍ ቃል ዳግም ተመስርቷል' })
                  }}
                  aria-label={language === 'en' ? 'Regenerate password' : 'ዳግም ይፍጠሩ'}
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {language === 'en'
                  ? "Give this password to the user. They can change it after first login."
                  : "ይህን የይለፍ ቃል ለተጠቃሚው ይስጡ። ከመጀመሪያ መግቢያ በኋላ መቀየር ይችላሉ።"}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{language === "en" ? "Phone Number" : "የስልክ ቁጥር"}</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder={language === "en" ? "Enter phone number" : "የስልክ ቁጥር ያስገቡ"}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userType">{language === "en" ? "User Type" : "የተጠቃሚ አይነት"} *</Label>
              <Select
                value={formData.userType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, userType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal">{language === "en" ? "Internal" : "ውስጣዊ"}</SelectItem>
                  <SelectItem value="External">{language === "en" ? "External" : "ውጫዊ"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role and Department */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {language === "en" ? "Role & Department" : "ሚና እና ክፍል"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">{language === "en" ? "Role" : "ሚና"} *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === "en" ? "Select role" : "ሚና ይምረጡ"} />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">{language === "en" ? "Department" : "ክፍል"} *</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingDepts ? (language === "en" ? "Loading..." : "በመጫን ላይ...") : language === "en" ? "Select department" : "ክፍል ይምረጡ"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.length > 0 ? (
                        departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_departments" disabled>
                          {language === "en" ? "No departments found" : "ክፍሎች አልተገኙም"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{language === "en" ? "Account Status" : "የመለያ ሁኔታ"}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">{language === "en" ? "Active" : "ንቁ"}</SelectItem>
                <SelectItem value="Inactive">{language === "en" ? "Inactive" : "ንቁ ያልሆነ"}</SelectItem>
                <SelectItem value="Suspended">{language === "en" ? "Suspended" : "ታግዷል"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4" />
          <div className="space-y-4">
            <div ref={permSectionRef} className="text-lg font-semibold">{language === "en" ? "Permissions" : "ፈቃዶች"}</div>
            {PERMISSION_MODULES.map((module) => (
              <div key={module.key} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <button
                    type="button"
                    onClick={() => toggleModuleOpen(module.key)}
                    className="flex items-center gap-2 font-medium"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedModules[module.key] ? "rotate-180" : "rotate-0"}`}
                    />
                    {module.label}
                  </button>
                  <label
                    className="flex items-center gap-2 text-sm"
                    onClick={(e)=>e.stopPropagation()}
                  >
                    <Checkbox
                      checked={allModulePermsChecked(module.key)}
                      onCheckedChange={(v)=>setModuleAllPerms(module.key, Boolean(v))}
                      aria-checked={allModulePermsChecked(module.key)}
                      className="data-[state=checked]:bg-[#2563eb] data-[state=checked]:border-[#2563eb]"
                    />
                    <span>{language === "en" ? "Select all" : "ሁሉንም ምረጥ"}</span>
                  </label>
                </div>
                {expandedModules[module.key] && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 pt-0">
                      {module.activities.map((a) => (
                        <label key={`${module.key}.${a.key}`} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={isPermChecked(module.key, a.key)}
                            onCheckedChange={(v)=>setPermChecked(module.key, a.key, Boolean(v))}
                            aria-checked={isPermChecked(module.key, a.key)}
                            className="data-[state=checked]:bg-[#2563eb] data-[state=checked]:border-[#2563eb]"
                          />
                          <span>{a.label}</span>
                        </label>
                      ))}
                    </div>
                    {anyModulePermsChecked(module.key) && !allModulePermsChecked(module.key) && (
                      <div className="px-3 pb-3 text-xs text-muted-foreground">{language === "en" ? "Partially selected" : "በከፊል ተመርጧል"}</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          {language === "en" ? "Cancel" : "ይቅር"}
        </Button>
        <Button type="submit">
          {user ? (language === "en" ? "Update User" : "ተጠቃሚ ያዘምኑ") : language === "en" ? "Create User" : "ተጠቃሚ ይፍጠሩ"}
        </Button>
      </div>
    </form>
  )
}
