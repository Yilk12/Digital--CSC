"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Mail, Building, Shield, Calendar, Clock, Ticket, CheckCircle, Edit, Lock, Unlock } from "lucide-react"
import { useToast } from "@/components/toast-provider"

interface UserDetailsProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    department: string
    userType: string
    status: string
    lastLogin: string
    createdAt: string
    ticketsAssigned?: number
    ticketsResolved?: number
  }
  onClose: () => void
}

export function UserDetails({ user, onClose }: UserDetailsProps) {
  const [language] = useState<"en" | "am">("en")
  const { show: toast } = useToast()
  const [resetting, setResetting] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      case "Suspended":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "General Director":
        return "destructive"
      case "Staff Manager":
        return "default"
      case "Admin":
        return "secondary"
      case "Support Agent":
        return "outline"
      case "End User":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSuccessRate = () => {
    if (!user.ticketsAssigned || !user.ticketsResolved) return 0
    return Math.round((user.ticketsResolved / user.ticketsAssigned) * 100)
  }

  const onResetPassword = async () => {
    if (!user?.email) return
    try {
      setResetting(true)
      const resp = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.message || "Request failed")
      toast({
        variant: "success",
        title: language === "en" ? "Reset email sent" : "የይለፍ ቃል ዳግም መቀየር ኢሜይል ተልኳል",
        description: language === "en" ? "The user will receive a reset link via email." : "ተጠቃሚው በኢሜይል የማስታወሻ አገናኝ ይቀበላል።",
      })
    } catch (e: any) {
      toast({ variant: "destructive", title: language === "en" ? "Failed to reset" : "ማደስ አልተሳካም", description: e?.message })
    } finally {
      setResetting(false)
    }
  }

  const permissions = [
    { key: "canCreateTickets", label: language === "en" ? "Create Tickets" : "ቲኬቶች መፍጠር", granted: true },
    {
      key: "canAssignTickets",
      label: language === "en" ? "Assign Tickets" : "ቲኬቶች መመደብ",
      granted: user.role !== "End User",
    },
    {
      key: "canManageUsers",
      label: language === "en" ? "Manage Users" : "ተጠቃሚዎችን አስተዳደር",
      granted: ["General Director", "Admin"].includes(user.role),
    },
    {
      key: "canAccessReports",
      label: language === "en" ? "Access Reports" : "ሪፖርቶች መድረስ",
      granted: user.role !== "End User",
    },
    {
      key: "canManageKnowledgeBase",
      label: language === "en" ? "Manage Knowledge Base" : "የእውቀት ቤዝ አስተዳደር",
      granted: ["General Director", "Staff Manager", "Admin"].includes(user.role),
    },
    {
      key: "canViewAllTickets",
      label: language === "en" ? "View All Tickets" : "ሁሉንም ቲኬቶች መመልከት",
      granted: user.role !== "End User",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={`/ceholder-svg-key-mo6mb.jpg?key=mo6mb&height=64&width=64`} />
            <AvatarFallback className="text-lg">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)]">{user.name}</h2>
            <p className="text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
              <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
              <Badge variant={user.userType === "Internal" ? "default" : "secondary"}>{user.userType}</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            {language === "en" ? "Edit" : "አርትዕ"}
          </Button>
          <Button variant="outline" size="sm">
            {user.status === "Active" ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
            {user.status === "Active"
              ? language === "en"
                ? "Suspend"
                : "ታግድ"
              : language === "en"
                ? "Activate"
                : "አንቃ"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {language === "en" ? "User Information" : "የተጠቃሚ መረጃ"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Email" : "ኢሜይል"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Department" : "ክፍል"}</p>
                    <p className="text-sm text-muted-foreground">{user.department}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Created" : "የተፈጠረበት"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{language === "en" ? "Last Login" : "የመጨረሻ መግቢያ"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(user.lastLogin)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance (for Support Agents) */}
          {user.ticketsAssigned !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  {language === "en" ? "Performance Metrics" : "የአፈጻጸም መለኪያዎች"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{user.ticketsAssigned}</div>
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Tickets Assigned" : "የተመደቡ ቲኬቶች"}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user.ticketsResolved}</div>
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Tickets Resolved" : "የተፈቱ ቲኬቶች"}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{getSuccessRate()}%</div>
                    <p className="text-sm text-muted-foreground">{language === "en" ? "Success Rate" : "የስኬት መጠን"}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === "en" ? "Resolution Rate" : "የመፍትሄ መጠን"}</span>
                    <span>{getSuccessRate()}%</span>
                  </div>
                  <Progress value={getSuccessRate()} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Permissions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {language === "en" ? "Permissions" : "ፈቃዶች"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.key} className="flex items-center justify-between">
                  <span className="text-sm">{permission.label}</span>
                  {permission.granted ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Quick Actions" : "ፈጣን እርምጃዎች"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Mail className="w-4 h-4 mr-2" />
                {language === "en" ? "Send Email" : "ኢሜይል ላክ"}
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Ticket className="w-4 h-4 mr-2" />
                {language === "en" ? "View Tickets" : "ቲኬቶች ይመልከቱ"}
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Shield className="w-4 h-4 mr-2" />
                {language === "en" ? "Reset Password" : "የይለፍ ቃል ዳግም አስተካክል"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
