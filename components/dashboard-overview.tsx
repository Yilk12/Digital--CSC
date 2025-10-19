"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Ticket, BookOpen, Users, Clock, CheckCircle, AlertCircle, TrendingUp, Plus } from "lucide-react"

export function DashboardOverview() {
  const router = useRouter();
  const [language] = useState<"en" | "am">("en")

  const stats = [
    {
      title: language === "en" ? "Total Tickets" : "ጠቅላላ ቲኬቶች",
      value: "1,234",
      change: "+12%",
      icon: Ticket,
      color: "text-primary",
    },
    {
      title: language === "en" ? "Open Tickets" : "ክፍት ቲኬቶች",
      value: "89",
      change: "-5%",
      icon: AlertCircle,
      color: "text-destructive",
    },
    {
      title: language === "en" ? "Resolved Today" : "ዛሬ የተፈቱ",
      value: "23",
      change: "+8%",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: language === "en" ? "Avg Response Time" : "አማካይ ምላሽ ጊዜ",
      value: "2.4h",
      change: "-15%",
      icon: Clock,
      color: "text-secondary",
    },
  ]

  const recentTickets = [
    {
      id: "TK-001",
      title: language === "en" ? "Password Reset Request" : "የይለፍ ቃል ዳግም ማስተካከያ ጥያቄ",
      department: language === "en" ? "IT Department" : "የአይቲ ክፍል",
      priority: "High",
      status: "Open",
      time: "2 hours ago",
    },
    {
      id: "TK-002",
      title: language === "en" ? "System Access Issue" : "የሲስተም መዳረሻ ችግር",
      department: language === "en" ? "HR Department" : "የሰው ሃይል ክፍል",
      priority: "Medium",
      status: "In Progress",
      time: "4 hours ago",
    },
    {
      id: "TK-003",
      title: language === "en" ? "Document Upload Problem" : "የሰነድ መስቀያ ችግር",
      department: language === "en" ? "Finance Department" : "የፋይናንስ ክፍል",
      priority: "Low",
      status: "Resolved",
      time: "1 day ago",
    },
  ]

  const knowledgeBaseStats = [
    {
      title: language === "en" ? "Total Articles" : "ጠቅላላ ጽሁፎች",
      value: "156",
      icon: BookOpen,
    },
    {
      title: language === "en" ? "Active Users" : "ንቁ ተጠቃሚዎች",
      value: "2,341",
      icon: Users,
    },
    {
      title: language === "en" ? "Popular Searches" : "ተወዳጅ ፍለጋዎች",
      value: "89",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* Header icon and titles removed as per requirement */}
          {/* Tagline removed */}
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          {language === "en" ? "New Ticket" : "አዲስ ቲኬት"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>{stat.change}</span>{" "}
                {language === "en" ? "from last month" : "ከላለፈው ወር"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              {language === "en" ? "Recent Tickets" : "የቅርብ ጊዜ ቲኬቶች"}
            </CardTitle>
            <CardDescription>
              {language === "en" ? "Latest support requests from departments" : "ከክፍሎች የመጡ የቅርብ ጊዜ የድጋፍ ጥያቄዎች"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ticket.id}</span>
                      <Badge
                        variant={
                          ticket.priority === "High"
                            ? "destructive"
                            : ticket.priority === "Medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {ticket.priority}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">{ticket.department}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        ticket.status === "Open"
                          ? "destructive"
                          : ticket.status === "In Progress"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {ticket.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{ticket.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {language === "en" ? "Knowledge Base" : "የእውቀት ቤዝ"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {knowledgeBaseStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <stat.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{stat.title}</span>
                </div>
                <span className="font-semibold">{stat.value}</span>
              </div>
            ))}

            <div className="space-y-2 pt-4">
              <div className="flex justify-between text-sm">
                <span>{language === "en" ? "SLA Compliance" : "የSLA ተገዢነት"}</span>
                <span>94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
          </CardContent>
        </Card>

        

        
      </div>

    </div>
  )
}
