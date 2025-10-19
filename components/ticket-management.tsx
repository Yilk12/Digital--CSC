"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Search, Filter, Eye, Edit, Clock, User, Building } from "lucide-react"
import { TicketForm } from "./ticket-form"
import { TicketDetails } from "./ticket-details"
import { apiGet, apiPatch } from "@/app/lib/api"

interface Ticket {
  id: string
  title: string
  description: string
  department?: string
  category: string
  priority: "Low" | "Medium" | "High" | "Urgent"
  status: "Open" | "In Progress" | "Pending" | "Resolved" | "Closed"
  assignee?: string
  requester?: string
  createdAt: string
  updatedAt: string
  slaDeadline: string
}

export function TicketManagement() {
  const [language] = useState<"en" | "am">("en")
  const [tickets, setTickets] = useState<Ticket[]>([])
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

  function mapStatus(s: string): Ticket["status"] {
    const map: Record<string, Ticket["status"]> = {
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      PENDING: "Pending",
      RESOLVED: "Resolved",
      CLOSED: "Closed",
    }
    return map[s] || "Open"
  }

  function mapPriority(p: string): Ticket["priority"] {
    const map: Record<string, Ticket["priority"]> = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
    }
    return map[p] || "Medium"
  }

  function toBackendPriority(p: Ticket["priority"]): string {
    const map: Record<Ticket["priority"], string> = {
      Low: "LOW",
      Medium: "MEDIUM",
      High: "HIGH",
      Urgent: "URGENT",
    }
    return map[p]
  }

  function toBackendCategory(c: string): string {
    const up = c.toUpperCase()
    return ["INCIDENT", "REQUEST", "PROBLEM", "CHANGE"].includes(up) ? up : "REQUEST"
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ tickets: any[]; pagination: any }>("/tickets/my")
      const mapped: Ticket[] = res.tickets.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        department: t.department?.name || "",
        category: String(t.category).charAt(0) + String(t.category).slice(1).toLowerCase(),
        priority: mapPriority(String(t.priority)),
        status: mapStatus(String(t.status)),
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : "",
        requester: t.creator ? `${t.creator.firstName} ${t.creator.lastName}` : "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        slaDeadline: t.slaDeadline || t.createdAt,
      }))
      setTickets(mapped)
    } catch (e: any) {
      setError(e?.message || "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive"
      case "In Progress":
        return "default"
      case "On Hold":
        return "secondary"
      case "Resolved":
        return "outline"
      case "Closed":
        return "secondary"
      default:
        return "default"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "destructive"
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-[family-name:var(--font-playfair)]">
            {language === "en" ? "Ticket Management" : "የቲኬት አስተዳደር"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en"
              ? "Manage and track support tickets across all departments"
              : "በሁሉም ክፍሎች የድጋፍ ቲኬቶችን ያስተዳድሩ እና ይከታተሉ"}
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              {language === "en" ? "New Ticket" : "አዲስ ቲኬት"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{language === "en" ? "Create New Ticket" : "አዲስ ቲኬት ይፍጠሩ"}</DialogTitle>
              <DialogDescription>
                {language === "en"
                  ? "Fill out the form below to create a new support ticket"
                  : "አዲስ የድጋፍ ቲኬት ለመፍጠር ከታች ያለውን ቅጽ ይሙሉ"}
              </DialogDescription>
            </DialogHeader>
            <TicketForm onClose={() => setShowCreateDialog(false)} onCreated={load} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            {language === "en" ? "Filters" : "ማጣሪያዎች"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === "en" ? "Search tickets..." : "ቲኬቶችን ይፈልጉ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={language === "en" ? "Filter by Status" : "በሁኔታ ማጣሪያ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Status" : "ሁሉም ሁኔታዎች"}</SelectItem>
                <SelectItem value="Open">{language === "en" ? "Open" : "ክፍት"}</SelectItem>
                <SelectItem value="In Progress">{language === "en" ? "In Progress" : "በሂደት ላይ"}</SelectItem>
                <SelectItem value="On Hold">{language === "en" ? "On Hold" : "በመጠባበቅ ላይ"}</SelectItem>
                <SelectItem value="Resolved">{language === "en" ? "Resolved" : "ተፈትቷል"}</SelectItem>
                <SelectItem value="Closed">{language === "en" ? "Closed" : "ተዘግቷል"}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={language === "en" ? "Filter by Priority" : "በቅድሚያ ማጣሪያ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Priorities" : "ሁሉም ቅድሚያዎች"}</SelectItem>
                <SelectItem value="Urgent">{language === "en" ? "Urgent" : "አስቸኳይ"}</SelectItem>
                <SelectItem value="High">{language === "en" ? "High" : "ከፍተኛ"}</SelectItem>
                <SelectItem value="Medium">{language === "en" ? "Medium" : "መካከለኛ"}</SelectItem>
                <SelectItem value="Low">{language === "en" ? "Low" : "ዝቅተኛ"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{language === "en" ? "List View" : "የዝርዝር እይታ"}</TabsTrigger>
          <TabsTrigger value="board">{language === "en" ? "Board View" : "የቦርድ እይታ"}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-primary">{ticket.id}</span>
                      <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                      <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                    </div>

                    <h3 className="font-semibold text-lg">{ticket.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">{ticket.description}</p>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {ticket.department}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {language === "en" ? "Assigned to" : "የተመደበለት"}: {ticket.assignee}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(ticket.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket)
                        setShowDetailsDialog(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
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
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="board">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {["Open", "In Progress", "On Hold", "Resolved", "Closed"].map((status) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {status}
                    <Badge variant="secondary">{filteredTickets.filter((t) => t.status === status).length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {filteredTickets
                    .filter((ticket) => ticket.status === status)
                    .map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="p-3 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs">{ticket.id}</span>
                            <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
                          <p className="text-xs text-muted-foreground">{ticket.department}</p>
                        </div>
                      </Card>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <TicketDetails
              ticket={{
                ...selectedTicket,
                department: selectedTicket.department || "",
                assignee: selectedTicket.assignee || "",
                requester: selectedTicket.requester || "",
              }}
              onClose={() => setShowDetailsDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Ticket Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit Ticket" : "ቲኬት ያርትዑ"}</DialogTitle>
            <DialogDescription>
              {language === "en" ? "You can edit subject, description, priority and category" : "ርዕስ፣ መግለጫ፣ ቅድሚያ እና ምድብ ማርትዕ ይቻላል"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={editForm.title} onChange={(e)=>setEditForm(s=>({ ...s, title: e.target.value }))} placeholder="Title" />
            <Input value={editForm.description} onChange={(e)=>setEditForm(s=>({ ...s, description: e.target.value }))} placeholder="Description" />
            <Select value={editForm.priority} onValueChange={(v)=>setEditForm(s=>({ ...s, priority: v as any }))}>
              <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={editForm.category} onValueChange={(v)=>setEditForm(s=>({ ...s, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Incident">Incident</SelectItem>
                <SelectItem value="Request">Request</SelectItem>
                <SelectItem value="Problem">Problem</SelectItem>
                <SelectItem value="Change">Change</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={async ()=>{
                if (!selectedTicket) return
                try {
                  const payload:any = {
                    title: editForm.title,
                    description: editForm.description,
                    priority: toBackendPriority(editForm.priority as Ticket["priority"]),
                    category: toBackendCategory(editForm.category),
                  }
                  await apiPatch(`/tickets/${selectedTicket.id}`, payload)
                  setShowEditDialog(false)
                  await load()
                } catch (e:any) {
                  alert(e?.message || 'Failed to update')
                }
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
