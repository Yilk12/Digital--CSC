"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Input } from "@/app/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Plus, Search, Filter, Eye, Edit, Clock, User, Building, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { TicketForm } from "./ticket-form"
import { TicketDetails } from "./ticket-details"
import { useLocalization } from "@/app/hooks/use-localization"

interface Ticket {
  id: string
  title: string
  description: string
  department?: string
  category: string
  priority: "Low" | "Medium" | "High" | "Urgent"
  status: "Open" | "In Progress" | "Pending" | "Resolved" | "Closed"
  assignee?: string
  assigneeId?: string
  assigneeEmail?: string
  requester?: string
  creatorEmail?: string
  createdAt: string
  updatedAt: string
  slaDeadline: string
  // Read-state mapped from backend Ticket.isRead enum (OPEN | CLOSED)
  readStatus?: "Open" | "Closed"
}

interface AssignableUser {
  id: string
  name: string
  departmentName?: string
}

type SortField = "title" | "status" | "priority" | "createdAt" | "assignee"
type SortOrder = "asc" | "desc"

export function TicketManagement() {
  const { currentLanguage, t } = useLocalization()
  const language: "en" | "am" = currentLanguage === "am" ? "am" : "en"
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editForm, setEditForm] = useState({ title: "", description: "", priority: "Medium", category: "Request" })
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentDeptName, setCurrentDeptName] = useState<string | null>(null)
  const [currentDeptId, setCurrentDeptId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"my" | "other">("my")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedStatus, setSelectedStatus] = useState<"IN_PROGRESS" | "RESOLVED" | "PENDING">("RESOLVED")
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [savingAssigneeId, setSavingAssigneeId] = useState<string | null>(null)
  const [bulkAssigneeId, setBulkAssigneeId] = useState<string | "none">("none")
  const [viewMode, setViewMode] = useState<"default" | "assigned">("default")
  const [showPerformancePanel, setShowPerformancePanel] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // --- Mapping helpers ---
  const mapStatus = (s: string): Ticket["status"] => {
    const map: Record<string, Ticket["status"]> = {
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      PENDING: "Pending",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
    }
    return map[s] || "Open"
  }

  const mapPriority = (p: string): Ticket["priority"] => {
    const map: Record<string, Ticket["priority"]> = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
    }
    return map[p] || "Medium"
  }

  const toBackendPriority = (p: Ticket["priority"]) => {
    const map: Record<Ticket["priority"], string> = {
      Low: "LOW",
      Medium: "MEDIUM",
      High: "HIGH",
      Urgent: "URGENT",
    }
    return map[p]
  }

  const toBackendCategory = (c: string) => {
    const up = c.toUpperCase()
    return ["INCIDENT", "REQUEST", "PROBLEM", "CHANGE"].includes(up) ? up : "REQUEST"
  }

  // --- Fetch tickets ---
  async function load() {
    setLoading(true)
    setError(null)
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets`, { 
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
     
      if (!res.ok) throw new Error("Failed to fetch tickets")
      const data = await res.json()
    

      const mapped: Ticket[] = data.tickets.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        // Prefer requester's (creator's) department; fall back to ticket.department
        department: t.creator?.department?.name || t.department?.name || "",
        category: String(t.category).charAt(0) + String(t.category).slice(1).toLowerCase(),
        priority: mapPriority(String(t.priority)),
        status: mapStatus(String(t.status)),
        readStatus: String(t.isRead) === 'OPEN' ? 'Open' : 'Closed',
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "",
        assigneeId: t.assignee?.id ? String(t.assignee.id) : undefined,
        assigneeEmail: t.assignee?.email || "",
        requester: t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : "",
        creatorEmail: t.creator?.email || "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        slaDeadline: t.slaDeadline || t.createdAt,
      }))
      setTickets(mapped)
      setFilteredTickets(mapped)
    } catch (e: any) {
      setError(e?.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const assignSelectedToEmployee = async () => {
    if (selectedIds.size === 0) return
    if (!bulkAssigneeId || bulkAssigneeId === "none") return

    try {
      setLoading(true)
      await Promise.all(
        Array.from(selectedIds).map((id) => updateAssignee(id, bulkAssigneeId)),
      )
      setSelectedIds(new Set())
      setBulkAssigneeId("none")
    } catch {
      // ignore, per-ticket updateAssignee already handles errors
    } finally {
      setLoading(false)
    }
  }

  const updateAssignee = async (ticketId: string, assigneeId: string | "none") => {
    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token")
      if (!token) return
      setSavingAssigneeId(ticketId)
      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const body: any = assigneeId === "none" ? { assigneeId: null } : { assigneeId }
      await fetch(`${apiBase}/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      // Reflect change locally
      const newAssigneeName =
        assigneeId === "none"
          ? ""
          : assignableUsers.find((u) => u.id === assigneeId)?.name || ""
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                assignee: newAssigneeName,
              }
            : t,
        ),
      )
    } catch {
      // ignore error; UI will stay as before
    } finally {
      setSavingAssigneeId(null)
    }
  }

  useEffect(() => {
    load()
  }, [])

  // Sync active tab with URL query (?tab=my|other), so /tickets?tab=other opens Other Tickets
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const sp = new URLSearchParams(window.location.search)
      const tab = sp.get("tab")
      if (tab === "my" || tab === "other") {
        setActiveTab(tab as "my" | "other")
      }

      const view = sp.get("view")
      if (view === "assigned") {
        setViewMode("assigned")
      } else {
        setViewMode("default")
      }
    } catch {}
  }, [])

  // When coming from an "assigned" notification view, automatically focus
  // the tickets list so the assignee immediately sees their assigned tickets.
  useEffect(() => {
    if (viewMode === "assigned") {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [viewMode])

  // --- Read current user from JWT (localStorage) ---
  useEffect(() => {
    if (typeof window === "undefined") return
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token")
    if (!token) return
    try {
      const base64 = token.split(".")[1]
      const json = base64 ? JSON.parse(atob(base64)) : null
      if (json) {
        setCurrentEmail(json.email ?? null)
        const uid = json.id || json.userId || json.user_id || json.sub || null
        if (uid) {
          setCurrentUserId(String(uid))
        }
        setCurrentRole(json.role ?? null)

        const deptFromToken =
          json.departmentName ||
          json.department_name ||
          (typeof json.department === "string"
            ? json.department
            : json.department?.name) ||
          json.deptName ||
          json.dept ||
          null
        if (deptFromToken) {
          setCurrentDeptName(String(deptFromToken))
        }

        const deptIdFromToken =
          json.departmentId ||
          json.department_id ||
          (typeof json.department === "object" && json.department?.id
            ? json.department.id
            : null)
        if (deptIdFromToken) {
          setCurrentDeptId(String(deptIdFromToken))
        }
      }
    } catch {}
  }, [])

  // --- Load assignable users for Department Head (used in Other Tickets tab) ---
  useEffect(() => {
    if (currentRole !== "Department_Head") return
    if (typeof window === "undefined") return

    const loadUsers = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        const apiBase = process.env.NEXT_PUBLIC_API_URL
        if (!apiBase) return

        // If we know the departmentId, use dedicated endpoint that backs user management list
        const url = currentDeptId
          ? `${apiBase}/api/users/by-department?departmentId=${encodeURIComponent(currentDeptId)}`
          : `${apiBase}/api/users`

        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
        if (!res.ok) return
        const data = await res.json().catch(() => [])
        const arr: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any).items)
            ? (data as any).items
            : []
        const mapped: AssignableUser[] = arr.map((u: any) => ({
          id: String(u.id),
          name:
            `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
            u.email ||
            u.username ||
            String(u.id),
          departmentName: u.department?.name,
        }))
        // When using /by-department we already receive only users from this department.
        // When falling back to /api/users, filter by department name from JWT.
        const filtered = currentDeptId || !currentDeptName
          ? mapped
          : mapped.filter((u) => u.departmentName === currentDeptName)
        setAssignableUsers(filtered)
      } catch {
        // ignore errors; dropdown will just not show options
      }
    }

    loadUsers()
  }, [currentRole, currentDeptName, currentDeptId])

  // --- Apply role-aware base list + filters ---
  useEffect(() => {
    let base = tickets

    // Determine base tickets depending on role + tab
    const role = currentRole as string | null
    if (role === "END_USER") {
      // End users only ever see their own tickets
      base = tickets.filter(
        (t) =>
          t.creatorEmail &&
          currentEmail &&
          t.creatorEmail.toLowerCase() === currentEmail.toLowerCase(),
      )
    } else if (role === "SUPPORT_AGENT") {
      // Support agents: My = own created, Other = everyone else
      if (activeTab === "my") {
        base = tickets.filter(
          (t) =>
            t.creatorEmail &&
            currentEmail &&
            t.creatorEmail.toLowerCase() === currentEmail.toLowerCase(),
        )
      } else {
        base = tickets.filter(
          (t) =>
            !currentEmail ||
            t.creatorEmail?.toLowerCase() !== currentEmail.toLowerCase(),
        )
      }
    } else if (role === "Department_Head") {
      // Department Head: My = own created, Other = ALL tickets (including own) so they can assign employees
      if (activeTab === "my") {
        base = tickets.filter(
          (t) =>
            t.creatorEmail &&
            currentEmail &&
            t.creatorEmail.toLowerCase() === currentEmail.toLowerCase(),
        )
      } else {
        base = tickets
      }
    }

    // If we are in the special 'assigned' view (navigated from notification),
    // first try to match by assigneeId (user id from JWT). If that's not
    // available, fall back to email/name so the view is not empty.
    if (viewMode === "assigned") {
      // Only tickets assigned to the current user AND not resolved/closed
      const isActive = (t: Ticket) => t.status !== "Resolved" && t.status !== "Closed"

      if (currentUserId) {
        base = base.filter((t) => t.assigneeId === currentUserId && isActive(t))
      } else if (currentEmail) {
        base = base.filter((t) => {
          if (!isActive(t)) return false
          if (t.assigneeEmail) {
            return t.assigneeEmail.toLowerCase() === currentEmail.toLowerCase()
          }
          return !!t.assignee
        })
      } else {
        base = base.filter((t) => !!t.assignee && isActive(t))
      }
    }

    let filtered = base
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((ticket) =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter)
    }
    
    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else {
        aValue = String(aValue).toLowerCase()
        bValue = String(bValue).toLowerCase()
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setFilteredTickets(filtered)
  }, [
    searchTerm,
    statusFilter,
    priorityFilter,
    tickets,
    currentEmail,
    currentRole,
    activeTab,
    viewMode,
    currentUserId,
  ])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
      case "In Progress":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
      case "Pending":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
      case "Resolved":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
      case "Closed":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200"
      case "High":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200"
      case "Low":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "🔴"
      case "High":
        return "🟠"
      case "Medium":
        return "🟡"
      case "Low":
        return "🟢"
      default:
        return "⚪"
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const clearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setPriorityFilter("all")
  }

  const isResolved = (status: string) => status === "Resolved" || status === "Closed"

  const getEmployeeStats = (employeeId: string) => {
    const employee = assignableUsers.find((u) => u.id === employeeId)
    if (!employee) {
      return { resolved: 0, pending: 0, inProgress: 0, total: 0, percentage: 0, grade: "N/A" }
    }

    const name = employee.name.toLowerCase()
    const employeeTickets = tickets.filter(
      (t) => t.assignee && t.assignee.toLowerCase() === name,
    )

    const resolved = employeeTickets.filter((t) => t.status === "Resolved").length
    const pending = employeeTickets.filter((t) => t.status === "Pending").length
    const inProgress = employeeTickets.filter((t) => t.status === "In Progress").length
    const total = resolved + pending + inProgress

    const percentage = total === 0 ? 0 : Math.round((resolved / total) * 100)

    let grade = "N/A"
    if (percentage >= 90) grade = "A"
    else if (percentage >= 75) grade = "B"
    else if (percentage >= 60) grade = "C"
    else if (percentage > 0) grade = "D"

    return { resolved, pending, inProgress, total, percentage, grade }
  }

  const getGlobalStatsFromTickets = () => {
    let resolved = 0
    let pending = 0
    let inProgress = 0

    tickets.forEach((t) => {
      if (t.status === "Resolved") resolved++
      else if (t.status === "Pending") pending++
      else if (t.status === "In Progress") inProgress++
    })

    const total = resolved + pending + inProgress
    const percentage = total === 0 ? 0 : Math.round((resolved / total) * 100)

    let grade = "N/A"
    if (percentage >= 90) grade = "A"
    else if (percentage >= 75) grade = "B"
    else if (percentage >= 60) grade = "C"
    else if (percentage > 0) grade = "D"

    return { resolved, pending, inProgress, total, percentage, grade }
  }

  const getOverallStats = () => {
    let resolved = 0
    let pending = 0
    let inProgress = 0

    assignableUsers.forEach((u) => {
      const stats = getEmployeeStats(u.id)
      resolved += stats.resolved
      pending += stats.pending
      inProgress += stats.inProgress
    })

    const total = resolved + pending + inProgress
    const percentage = total === 0 ? 0 : Math.round((resolved / total) * 100)

    let grade = "N/A"
    if (percentage >= 90) grade = "A"
    else if (percentage >= 75) grade = "B"
    else if (percentage >= 60) grade = "C"
    else if (percentage > 0) grade = "D"

    return { resolved, pending, inProgress, total, percentage, grade }
  }

  const resolveTicket = async (ticket: Ticket) => {
    if (isResolved(ticket.status)) return

    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token")

    if (!token) return

    setLoading(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${ticket.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status: "RESOLVED" }),
      })

      // Optimistic UI update for this ticket
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticket.id
            ? {
                ...t,
                status: "Resolved",
              }
            : t,
        ),
      )
    } catch (e) {
      console.error(e)
      setError("Failed to resolve ticket")
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAll = () => {
    const allSelected = filteredTickets.every(t => selectedIds.has(t.id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTickets.map(t => t.id)))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applySelectedStatus = async () => {
    if (selectedIds.size === 0) return
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token")
    setLoading(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ status: selectedStatus }),
          })
        })
      )
      // Optimistic UI update
      setTickets(prev => prev.map(t => {
        if (!selectedIds.has(t.id)) return t
        const mapped: Record<string, Ticket["status"]> = {
          IN_PROGRESS: "In Progress",
          RESOLVED: "Resolved",
          PENDING: "Pending",
        }
        return { ...t, status: mapped[selectedStatus] }
      }))
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      setError("Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const resolveSelectedForDeptHead = async () => {
    if (selectedIds.size === 0) return
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token")
    setLoading(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${id}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ status: "RESOLVED" }),
          })
        })
      )
      setTickets(prev => prev.map(t => {
        if (!selectedIds.has(t.id)) return t
        return { ...t, status: "Resolved" as Ticket["status"] }
      }))
      setSelectedIds(new Set())
    } catch (e) {
      console.error(e)
      setError("Failed to resolve selected tickets")
    } finally {
      setLoading(false)
    }
  }

  // Open details and update status to OPEN in background
  const openDetails = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowDetailsDialog(true)

    try {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token")

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/update/${ticket.id}`, {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      })

      // Optimistically reflect read state in UI
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, readStatus: "Open" } as Ticket : t))
    } catch {
      // ignore background errors for UX; user still sees details
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 opacity-30" />
    return sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  const isAssignedView = viewMode === "assigned"

  // --- Render ---
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">{t("tickets.header")}</h1>
          <p className="text-muted-foreground mt-2">{t("tickets.subtitle")}</p>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={load} 
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {t("tickets.refresh")}
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                {t("tickets.new_ticket")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-full max-h-[85vh] flex flex-col">
              <DialogHeader className="shrink-0">
                <DialogTitle>{t("tickets.create_title")}</DialogTitle>
                <DialogDescription>{t("tickets.create_desc")}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 overflow-y-auto pr-1">
                <TicketForm onClose={() => setShowCreateDialog(false)} onCreated={load} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card
          className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // Total: show all tickets for current tab
            setSearchTerm("")
            setStatusFilter("all")
            setPriorityFilter("all")
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-700">{t("tickets.cards.total")}</p>
                <p className="text-2xl font-bold text-blue-900">{tickets.length}</p>
              </div>
              <Building className="w-8 h-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card
          className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // Open: filter by non-resolved/open tickets
            setSearchTerm("")
            setStatusFilter("Open")
            setPriorityFilter("all")
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-orange-700">{t("tickets.cards.open")}</p>
                <p className="text-2xl font-bold text-orange-900">
                  {tickets.filter(t => t.status !== "Resolved").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card
          className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // Urgent: filter by urgent priority
            setSearchTerm("")
            setStatusFilter("all")
            setPriorityFilter("Urgent")
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-red-700">{t("tickets.cards.urgent")}</p>
                <p className="text-2xl font-bold text-red-900">
                  {tickets.filter(t => t.priority === "Urgent").length}
                </p>
              </div>
              <div className="text-2xl">🔴</div>
            </div>
          </CardContent>
        </Card>
        
        <Card
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // In Progress: filter by status In Progress
            setSearchTerm("")
            setStatusFilter("In Progress")
            setPriorityFilter("all")
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-yellow-700">{t("tickets.cards.in_progress")}</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {tickets.filter(t => t.status === "In Progress").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
        
        <Card
          className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            // Read state card: clear filters and focus list
            setSearchTerm("")
            setStatusFilter("all")
            setPriorityFilter("all")
            listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-700">{t("tickets.cards.read_state")}</p>
                <div className="flex gap-4 mt-1">
                  <div>
                    <p className="text-xs text-green-700">{t("tickets.status.open")}</p>
                    <p className="text-xl font-bold text-green-900">
                      {tickets.filter(t => t.readStatus === 'Open').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">{t("tickets.status.closed")}</p>
                    <p className="text-xl font-bold text-green-900">
                      {tickets.filter(t => t.readStatus === 'Closed').length}
                    </p>
                  </div>
                </div>
              </div>
              <User className="w-8 h-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        {/* Overall performance (visible for all users) */}
        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            {(() => {
              const overall = getGlobalStatsFromTickets()
              return (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Overall Performance</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Based on resolved tickets out of resolved, pending and in progress
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900">{overall.percentage}%</p>
                    <p className="text-sm text-slate-600 mt-1">Grade: {overall.grade}</p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card ref={listRef}>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              {t("tickets.filters_title")}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-xs"
                disabled={!searchTerm && statusFilter === "all" && priorityFilter === "all"}
              >
                {t("tickets.clear_all")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("tickets.search_placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t("tickets.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tickets.all_statuses")}</SelectItem>
                <SelectItem value="Open">{t("tickets.status.open")}</SelectItem>
                <SelectItem value="In Progress">{t("tickets.status.in_progress")}</SelectItem>
                <SelectItem value="Pending">{t("tickets.status.pending")}</SelectItem>
                <SelectItem value="Resolved">{t("tickets.status.resolved")}</SelectItem>
                <SelectItem value="Closed">{t("tickets.status.closed")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t("tickets.priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tickets.all_priorities")}</SelectItem>
                <SelectItem value="Urgent">{t("tickets.priority.urgent")}</SelectItem>
                <SelectItem value="High">{t("tickets.priority.high")}</SelectItem>
                <SelectItem value="Medium">{t("tickets.priority.medium")}</SelectItem>
                <SelectItem value="Low">{t("tickets.priority.low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs (role-aware) + Ticket List */}
      {currentRole && (currentRole === "SUPPORT_AGENT" || currentRole === "Department_Head") && (
        <div className="flex justify-between items-center gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList>
              <TabsTrigger value="my">{t("tickets.tab.my")}</TabsTrigger>
              <TabsTrigger value="other">{t("tickets.tab.other")}</TabsTrigger>
            </TabsList>
          </Tabs>

          {currentRole === "Department_Head" && activeTab === "other" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPerformancePanel((prev) => !prev)
                setSelectedEmployeeId(null)
              }}
            >
              Resolved Ticket
            </Button>
          )}
        </div>
      )}

      {currentRole === "Department_Head" && activeTab === "other" && showPerformancePanel && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-2">
                <p className="text-sm text-muted-foreground mb-1">Select employee</p>
                <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                  {assignableUsers.length === 0 && (
                    <p className="text-xs text-muted-foreground">No employees found.</p>
                  )}
                  {assignableUsers.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selectedEmployeeId === u.id}
                        onChange={() =>
                          setSelectedEmployeeId((prev) => (prev === u.id ? null : u.id))
                        }
                      />
                      <span>{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                {selectedEmployeeId ? (
                  (() => {
                    const stats = getEmployeeStats(selectedEmployeeId)
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="rounded-md border p-3 text-center">
                            <p className="text-xs text-muted-foreground">Resolved</p>
                            <p className="text-xl font-semibold">{stats.resolved}</p>
                          </div>
                          <div className="rounded-md border p-3 text-center">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-xl font-semibold">{stats.pending}</p>
                          </div>
                          <div className="rounded-md border p-3 text-center">
                            <p className="text-xs text-muted-foreground">In Progress</p>
                            <p className="text-xl font-semibold">{stats.inProgress}</p>
                          </div>
                        </div>

                        <div className="rounded-md border p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Performance</p>
                            <p className="text-xs text-muted-foreground">
                              Based on resolved tickets out of resolved, pending and in progress
                            </p>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <span className="text-2xl font-bold">{stats.percentage}%</span>
                            <span className="text-sm text-muted-foreground">Grade: {stats.grade}</span>
                          </div>
                        </div>

                        {(() => {
                          const overall = getOverallStats()
                          return (
                            <div className="rounded-md border p-4 flex items-center justify-between bg-muted/40">
                              <div>
                                <p className="text-sm font-medium">Overall Performance (All Employees)</p>
                                <p className="text-xs text-muted-foreground">
                                  Aggregated from all employees' resolved, pending and in-progress tickets
                                </p>
                              </div>
                              <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-bold">{overall.percentage}%</span>
                                <span className="text-sm text-muted-foreground">Grade: {overall.grade}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select an employee to see ticket counts and performance.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle>
                {t("tickets.list_title")} 
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'})
                </span>
              </CardTitle>

              {isAssignedView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Scroll the assigned tickets table into view
                    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="text-xs whitespace-nowrap"
                >
                  Assigned to me
                </Button>
              )}
            </div>
            {activeTab === "my" && !isAssignedView && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("tickets.bulk_status_label")}</span>
                  <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as any)}>
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue placeholder={t("tickets.select_status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_PROGRESS">{t("tickets.status.in_progress")}</SelectItem>
                      <SelectItem value="RESOLVED">{t("tickets.status.resolved")}</SelectItem>
                      <SelectItem value="PENDING">{t("tickets.status.pending")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={applySelectedStatus}
                  className="whitespace-nowrap"
                >
                  {t("tickets.update_status")}
                </Button>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t("common.loading")}
                  </div>
                )}
              </div>
            )}
            {activeTab === "other" && currentRole === "Department_Head" && !isAssignedView && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Assign employee</span>
                  <Select
                    value={bulkAssigneeId}
                    onValueChange={(v) => setBulkAssigneeId(v as any)}
                  >
                    <SelectTrigger className="w-48 h-9">
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select employee</SelectItem>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loading || selectedIds.size === 0 || !bulkAssigneeId || bulkAssigneeId === "none"}
                  onClick={assignSelectedToEmployee}
                  className="whitespace-nowrap"
                >
                  Assign employee
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={load}>{t("common.try_again")}</Button>
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {!isAssignedView && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={filteredTickets.length > 0 && filteredTickets.every(t => selectedIds.has(t.id))}
                          onChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                    )}
                    {activeTab === "other" && (
                      <th className="px-4 py-3 text-left font-medium">{t("tickets.th.name")}</th>
                    )}
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("title")}
                    >
                      <div className="flex items-center gap-1">
                        {t("tickets.th.title")}
                        <SortIcon field="title" />
                      </div>
                    </th>
                    
                    <th className="px-4 py-3 text-left font-medium">{t("tickets.th.department")}</th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-1">
                        {t("tickets.th.status")}
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("priority")}
                    >
                      <div className="flex items-center gap-1">
                        {t("tickets.th.priority")}
                        <SortIcon field="priority" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">{t("tickets.th.read")}</th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("assignee")}
                    >
                      <div className="flex items-center gap-1">
                        {t("tickets.th.assignee")}
                        <SortIcon field="assignee" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/70 transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      <div className="flex items-center gap-1">
                        {t("tickets.th.created")}
                        <SortIcon field="createdAt" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">{t("tickets.th.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTickets.map((ticket) => (
                    <tr 
                      key={ticket.id} 
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => openDetails(ticket)}
                    >
                      {!isAssignedView && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={selectedIds.has(ticket.id)}
                            onChange={() => toggleSelect(ticket.id)}
                            aria-label={`Select ${ticket.title}`}
                          />
                        </td>
                      )}
                    {activeTab === "other" && (
                      <td className="px-4 py-3 font-bold">
                        {ticket.requester
                          ? ticket.requester.charAt(0).toUpperCase() + ticket.requester.slice(1)
                          : "—"}
                      </td>
                    )}

                      <td className="px-4 py-3">
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate group-hover:text-primary transition-colors">
                            {ticket.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {ticket.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{ticket.department || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${getStatusColor(ticket.status)} border transition-colors`}>
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getPriorityIcon(ticket.priority)}</span>
                          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {ticket.readStatus === 'Open' ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">{t("tickets.status.open")}</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">{t("tickets.status.closed")}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => currentRole === "Department_Head" && activeTab === "other" ? e.stopPropagation() : undefined}>
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {currentRole === "Department_Head" && activeTab === "other" ? (
                            <Select
                              value={
                                ticket.assignee
                                  ? assignableUsers.find((u) => u.name === ticket.assignee)?.id ?? "none"
                                  : "none"
                              }
                              onValueChange={(v) => updateAssignee(ticket.id, v as any)}
                              disabled={savingAssigneeId === ticket.id}
                            >
                              <SelectTrigger className="w-44 h-8 text-sm">
                                <SelectValue placeholder="select users" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">select users</SelectItem>
                                {assignableUsers.map((u) => (
                                  <SelectItem key={u.id} value={u.id}>
                                    {u.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-sm">{ticket.assignee || t("common.unassigned")}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          {(!(currentEmail && ticket.creatorEmail && ticket.creatorEmail.toLowerCase() === currentEmail.toLowerCase())) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDetails(ticket)}
                              aria-label="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {(currentEmail && ticket.creatorEmail && ticket.creatorEmail.toLowerCase() === currentEmail.toLowerCase()) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setEditForm({
                                  title: ticket.title,
                                  description: ticket.description,
                                  priority: ticket.priority,
                                  category: ticket.category,
                                })
                                setShowEditDialog(true)
                              }}
                              aria-label="Edit ticket"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {activeTab === "other" && currentRole === "Department_Head" && !isResolved(ticket.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveTicket(ticket)}
                              aria-label="Resolved Ticket"
                            >
                              Resolved Ticket
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "No tickets have been created yet."}
              </p>
              {(searchTerm || statusFilter !== "all" || priorityFilter !== "all") ? (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Ticket
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent
          className={`max-h-[90vh] overflow-y-auto ${
            activeTab === "other" ? "max-w-[95vw] w-[95vw]" : "max-w-4xl"
          }`}
        >
          {selectedTicket && (
            <TicketDetails
              ticket={{
                ...selectedTicket,
                department: selectedTicket.department || "",
                assignee: selectedTicket.assignee || "",
                requester: selectedTicket.requester || "",
              }}
              onClose={() => setShowDetailsDialog(false)}
              hideComments={activeTab === "other"}
              compactActionsView={activeTab === "other"}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>
              Update the ticket details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input 
                value={editForm.title} 
                onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))} 
                placeholder="Ticket title" 
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input 
                value={editForm.description} 
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))} 
                placeholder="Ticket description" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Priority</label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm((s) => ({ ...s, priority: v as any }))}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm((s) => ({ ...s, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Incident">Incident</SelectItem>
                    <SelectItem value="Request">Request</SelectItem>
                    <SelectItem value="Problem">Problem</SelectItem>
                    <SelectItem value="Change">Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!selectedTicket) return
                  try {
                    const payload = {
                      title: editForm.title,
                      description: editForm.description,
                      priority: toBackendPriority(editForm.priority as Ticket["priority"]),
                      category: toBackendCategory(editForm.category),
                    }

                    const token =
                      localStorage.getItem("accessToken") ||
                      localStorage.getItem("jwt") ||
                      localStorage.getItem("token")

                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${selectedTicket.id}`, {
                      method: "PATCH",
                      headers: { 
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify(payload),
                      credentials: "include",
                    })

                    if (!res.ok) throw new Error("Failed to update ticket")
                    setShowEditDialog(false)
                    await load()
                  } catch (e: any) {
                    alert(e?.message || "Failed to update")
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}