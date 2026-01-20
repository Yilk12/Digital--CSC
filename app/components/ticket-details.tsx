"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Clock, User, Building, Tag, AlertCircle, MessageSquare, Send, Edit, History } from "lucide-react"

interface TicketDetailsTicket {
  id: string
  title: string
  description: string
  department: string
  category: string
  priority: "Low" | "Medium" | "High" | "Urgent"
  status: "Open" | "In Progress" | "Pending" | "Resolved" | "Closed"
  assignee: string
  requester: string
  createdAt: string
  updatedAt: string
  slaDeadline: string
}

interface TicketDetailsProps {
  ticket: TicketDetailsTicket
  onClose: () => void
  hideComments?: boolean
  compactActionsView?: boolean
}

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  isInternal: boolean
}

const mockComments: Comment[] = [
  {
    id: "1",
    author: "John Doe",
    content: "I've received this ticket and will start investigating the password reset issue.",
    timestamp: "2024-01-15T10:45:00Z",
    isInternal: true,
  },
  {
    id: "2",
    author: "Jane Smith",
    content: "Thank you for the quick response. I'm available for any additional information you might need.",
    timestamp: "2024-01-15T11:00:00Z",
    isInternal: false,
  },
]

export function TicketDetails({ ticket, onClose, hideComments, compactActionsView }: TicketDetailsProps) {
  const [language] = useState<"en" | "am">("en")
  const [comments] = useState<Comment[]>(mockComments)
  const [newComment, setNewComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [deptUsers, setDeptUsers] = useState<{ id: string; name: string }[]>([])
  const [assignUserId, setAssignUserId] = useState<string>("")
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadUsers() {
      try {
        const { API_BASE_URL } = await import("@/app/lib/api")
        const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null
        const res = await fetch(`${API_BASE_URL}/users?limit=200`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        })
        if (!res.ok) return
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.users) ? data.users : data)
        if (!cancelled && Array.isArray(items)) {
          const filtered = items
            .filter((u: any) => (u?.department || "").toLowerCase() === (ticket.department || "").toLowerCase())
            .map((u: any) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim() }))
          setDeptUsers(filtered)
        }
      } catch (e) {
        console.error("Failed to load users", e)
      }
    }
    loadUsers()
    return () => { cancelled = true }
  }, [ticket.department])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "destructive"
      case "In Progress":
        return "default"
      case "Pending":
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Add comment logic here
      console.log("Adding comment:", { content: newComment, isInternal })
      setNewComment("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{ticket.id}</h2>
            <Badge variant={getStatusColor(ticket.status)}>{ticket.status}</Badge>
            <Badge variant={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
          </div>
          <h3 className="text-xl font-semibold">{ticket.title}</h3>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            {language === "en" ? "Edit" : "አርትዕ"}
          </Button>
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            {language === "en" ? "History" : "ታሪክ"}
          </Button>
        </div>
      </div>

      <div className={`grid gap-6 ${compactActionsView ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"}`}>
        {/* Main Content */}
        {!compactActionsView && (
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {language === "en" ? "Description" : "መግለጫ"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{ticket.description}</p>
              </CardContent>
            </Card>

            {/* Comments */}
            {!hideComments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {language === "en" ? "Comments & Updates" : "አስተያየቶች እና ዝማኔዎች"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {comment.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.author}</span>
                            {comment.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                {language === "en" ? "Internal" : "ውስጣዊ"}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                        </div>
                      </div>
                      <Separator />
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="space-y-3 pt-4">
                    <Textarea
                      placeholder={language === "en" ? "Add a comment..." : "አስተያየት ይጨምሩ..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="internal"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="internal" className="text-sm">
                          {language === "en" ? "Internal note" : "ውስጣዊ ማስታወሻ"}
                        </label>
                      </div>
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className="w-4 h-4 mr-2" />
                        {language === "en" ? "Add Comment" : "አስተያየት ጨምር"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "en" ? "Ticket Information" : "የቲኬት መረጃ"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Requester" : "ጠያቂ"}</p>
                    <p className="text-sm text-muted-foreground">{ticket.requester}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Assignee" : "የተመደበለት"}</p>
                    <p className="text-sm text-muted-foreground">{ticket.assignee}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Department" : "ክፍል"}</p>
                    <p className="text-sm text-muted-foreground">{ticket.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Category" : "ምድብ"}</p>
                    <p className="text-sm text-muted-foreground">{ticket.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Created" : "የተፈጠረበት"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "SLA Deadline" : "የSLA ጊዜ ገደብ"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(ticket.slaDeadline)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{language === "en" ? "Actions" : "እርምጃዎች"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "en" ? "Assign To" : "ለማን ይመድቡ"}</label>
                <Select value={assignUserId} onValueChange={setAssignUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === "en" ? "Select employee" : "ሰራተኛ ይምረጡ"} />
                  </SelectTrigger>
                  <SelectContent>
                    {deptUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!assignUserId || assigning}
                  onClick={async () => {
                    try {
                      setAssigning(true)
                      const { API_BASE_URL } = await import("@/app/lib/api")
                      const headers: HeadersInit = {}
                      if (typeof window !== "undefined") {
                        const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")
                        if (token) (headers as any)["Authorization"] = `Bearer ${token}`
                      }
                      (headers as any)["Content-Type"] = "application/json"
                      const res = await fetch(`${API_BASE_URL}/tickets/${ticket.id}`, {
                        method: "PATCH",
                        headers,
                        body: JSON.stringify({ assigneeId: assignUserId }),
                        credentials: "include",
                      })
                      if (!res.ok) {
                        const txt = await res.text()
                        throw new Error(txt || `Assign failed: ${res.status}`)
                      }
                      // Optionally refresh UI via window reload or parent refresh handler
                    } catch (e) {
                      alert((e as any)?.message || "Failed to assign")
                    } finally {
                      setAssigning(false)
                    }
                  }}
                >
                  {assigning ? (language === "en" ? "Assigning…" : "በመመደብ ላይ…") : (language === "en" ? "Assign Ticket" : "ቲኬት አስር")}
                </Button>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "en" ? "Change Status" : "ሁኔታ ይቀይሩ"}</label>
                <Select defaultValue={ticket.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">{language === "en" ? "Open" : "ክፍት"}</SelectItem>
                    <SelectItem value="In Progress">{language === "en" ? "In Progress" : "በሂደት ላይ"}</SelectItem>
                    <SelectItem value="Pending">{language === "en" ? "Pending" : "ጠባባቂ"}</SelectItem>
                    <SelectItem value="Resolved">{language === "en" ? "Resolved" : "ተፈትቷል"}</SelectItem>
                    <SelectItem value="Closed">{language === "en" ? "Closed" : "ተዘግቷል"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{language === "en" ? "Change Priority" : "ቅድሚያ ይቀይሩ"}</label>
                <Select defaultValue={ticket.priority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">{language === "en" ? "Low" : "ዝቅተኛ"}</SelectItem>
                    <SelectItem value="Medium">{language === "en" ? "Medium" : "መካከለኛ"}</SelectItem>
                    <SelectItem value="High">{language === "en" ? "High" : "ከፍተኛ"}</SelectItem>
                    <SelectItem value="Urgent">{language === "en" ? "Urgent" : "አስቸኳይ"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full">{language === "en" ? "Update Ticket" : "ቲኬት ያዘምኑ"}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
