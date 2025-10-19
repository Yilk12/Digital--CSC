"use client"

import { useState } from "react"
import Link from "next/link"
import { getCurrentUserRoles } from "@/app/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, Eye, Edit, Trash2, Shield, Users, UserCheck, Building } from "lucide-react"
import { useToast } from "@/components/toast-provider"
import { UserForm } from "./user-form"
import { DepartmentForm } from "@/components/department-form"
import { UserDetails } from "./user-details"

interface User {
  id: string
  name: string
  email: string
  role: "General Director" | "Admin" | "Support Agent" | "End User"
  department: string
  userType: "Internal" | "External"
  status: "Active" | "Inactive" | "Suspended"
  lastLogin: string
  createdAt: string
  ticketsAssigned?: number
  ticketsResolved?: number
}

const mockUsers: User[] = [
  {
    id: "USR-001",
    name: "Dr. Alemayehu Tadesse",
    email: "alemayehu.tadesse@csc.gov.et",
    role: "General Director",
    department: "Commissioner Office",
    userType: "Internal",
    status: "Active",
    lastLogin: "2024-01-15T09:30:00Z",
    createdAt: "2023-06-01T00:00:00Z",
  },
  {
    id: "USR-002",
    name: "Meron Bekele",
    email: "meron.bekele@csc.gov.et",
    role: "Admin",
    department: "IT Department",
    userType: "Internal",
    status: "Active",
    lastLogin: "2024-01-15T11:45:00Z",
    createdAt: "2023-08-15T00:00:00Z",
    ticketsAssigned: 23,
    ticketsResolved: 18,
  },
  {
    id: "USR-003",
    name: "John Doe",
    email: "john.doe@csc.gov.et",
    role: "Admin",
    department: "IT Department",
    userType: "Internal",
    status: "Active",
    lastLogin: "2024-01-15T10:15:00Z",
    createdAt: "2023-09-01T00:00:00Z",
  },
  {
    id: "USR-004",
    name: "Sarah Wilson",
    email: "sarah.wilson@csc.gov.et",
    role: "Support Agent",
    department: "HR Department",
    userType: "Internal",
    status: "Active",
    lastLogin: "2024-01-15T08:20:00Z",
    createdAt: "2023-10-10T00:00:00Z",
    ticketsAssigned: 45,
    ticketsResolved: 42,
  },
  {
    id: "USR-005",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@ministry.gov.et",
    role: "End User",
    department: "Finance Ministry",
    userType: "External",
    status: "Active",
    lastLogin: "2024-01-14T16:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
]

export function UserManagement() {
  const [language] = useState<"en" | "am">("en")
  const [users] = useState<User[]>(mockUsers)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [userTypeFilter, setUserTypeFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [deptDialogOpen, setDeptDialogOpen] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const { show: toast } = useToast()
  const roles = getCurrentUserRoles().map(r=>r.toLowerCase())
  const isAdmin = roles.includes("admin") || roles.includes("fleet admin") || roles.includes("bsc admin")
  const [adminViewAll, setAdminViewAll] = useState<boolean>(true)
  const [usersMenuOpen, setUsersMenuOpen] = useState(false)
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false)

  const filteredUsers = (isAdmin && adminViewAll)
    ? users
    : users.filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = roleFilter === "all" || user.role === roleFilter
        const matchesStatus = statusFilter === "all" || user.status === statusFilter
        const matchesUserType = userTypeFilter === "all" || user.userType === userTypeFilter

        return matchesSearch && matchesRole && matchesStatus && matchesUserType
      })

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

  const displayRole = (role: string) => (role === "General Director" ? (language === "en" ? "Commissioner" : "ኮሚሽነር") : role)

  const getRoleColor = (role: string) => {
    switch (role) {
      case "General Director":
        return "destructive"
      case "Admin":
        return "secondary"
      case "Support Agent":
        return "outline"
      case "End User":
        return "secondary"
      // Fleet specific roles
      case "Fleet Manager":
        return "default"
      case "Department Head":
        return "default"
      case "Driver":
        return "secondary"
      case "Maintenance Team":
        return "secondary"
      case "Finance Department":
        return "secondary"
      // Module admin roles
      case "Fleet Admin":
        return "secondary"
      
      // BSC specific roles
      case "BSC Manager/Department Head":
        return "default"
      case "BSC Employee":
        return "secondary"
      case "BSC Analyst":
        return "default"
      case "BSC KPI Management":
        return "secondary"
      default:
        return "secondary"
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

  const getUserStats = () => {
    const total = users.length
    const active = users.filter((u) => u.status === "Active").length
    const internal = users.filter((u) => u.userType === "Internal").length
    const external = users.filter((u) => u.userType === "External").length

    return { total, active, internal, external }
  }

  const stats = getUserStats()

  return (
    <div className="space-y-6 pt-8 md:pt-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary font-[family-name:var(--font-playfair)]">
            {language === "en" ? "User Management" : "የተጠቃሚ አስተዳደር"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {language === "en"
              ? "Manage user accounts, roles, and permissions across the system"
              : "በሲስተሙ ውስጥ የተጠቃሚ መለያዎችን፣ ሚናዎችን እና ፈቃዶችን ያስተዳድሩ"}
          </p>
          {isAdmin && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <input id="adminViewAll" type="checkbox" className="accent-blue-600" checked={adminViewAll} onChange={(e)=>setAdminViewAll(e.target.checked)} />
              <label htmlFor="adminViewAll" className="cursor-pointer">
                {language === "en" ? "Admin: View all user statuses (bypass filters)" : "አስተዳዳሪ፡ ሁሉንም የተጠቃሚ ሁኔታዎች አሳይ"}
              </label>
            </div>
          )}
        </div>

        {isAdmin && (
          <div style={{ position: 'relative' }}>
            <Button className="gap-2" onClick={()=>setActionsOpen(v=>!v)}>
              <Plus className="w-4 h-4" />
              {language === "en" ? "Register" : "መመዝገብ"}
            </Button>
            {actionsOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  minWidth: 200,
                  padding: 6,
                  zIndex: 50,
                }}
              >
                <Link href="/users/new" onClick={()=>setActionsOpen(false)} className="block">
                  <Button variant="ghost" className="w-full justify-start">{language === 'en' ? 'Add New User' : 'አዲስ ተጠቃሚ ጨምር'}</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={()=>{ setDeptDialogOpen(true); setActionsOpen(false) }}
                >
                  {language === 'en' ? 'Register Department' : 'ክፍል መመዝገብ'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "Total Users" : "ጠቅላላ ተጠቃሚዎች"}
            </CardTitle>
            <Users className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "Active Users" : "ንቁ ተጠቃሚዎች"}
            </CardTitle>
            <UserCheck className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "Internal Users" : "ውስጣዊ ተጠቃሚዎች"}
            </CardTitle>
            <Building className="w-5 h-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.internal}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "en" ? "External Users" : "ውጫዊ ተጠቃሚዎች"}
            </CardTitle>
            <Shield className="w-5 h-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.external}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                  placeholder={language === "en" ? "Search users..." : "ተጠቃሚዎችን ይፈልጉ..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={language === "en" ? "Filter by Role" : "በሚና ማጣሪያ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Roles" : "ሁሉም ሚናዎች"}</SelectItem>
                <SelectItem value="General Director">{language === "en" ? "Commissioner" : "ኮሚሽነር"}</SelectItem>
                <SelectItem value="Admin">{language === "en" ? "Admin" : "አስተዳዳሪ"}</SelectItem>
                <SelectItem value="Support Agent">{language === "en" ? "Support Agent" : "የድጋፍ ወኪል"}</SelectItem>
                <SelectItem value="End User">{language === "en" ? "End User" : "የመጨረሻ ተጠቃሚ"}</SelectItem>
                {/* Module admin roles */}
                <SelectItem value="Fleet Admin">{language === "en" ? "Fleet Admin" : "የFleet አስተዳዳሪ"}</SelectItem>
                
                {/* BSC specific roles */}
                
                {/* Fleet specific roles */}
                <SelectItem value="Fleet Manager">{language === "en" ? "Fleet Manager" : "የFleet አስተዳዳሪ"}</SelectItem>
                <SelectItem value="Department Head">{language === "en" ? "Department Head" : "የክፍል ኃላፊ"}</SelectItem>
                <SelectItem value="Driver">{language === "en" ? "Driver" : "አሽከርካሪ"}</SelectItem>
                <SelectItem value="Maintenance Team">{language === "en" ? "Maintenance Team" : "የእንክብካቤ ቡድን"}</SelectItem>
                <SelectItem value="Finance Department">{language === "en" ? "Finance Department" : "የፋይናንስ ክፍል"}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={language === "en" ? "Filter by Status" : "በሁኔታ ማጣሪያ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Status" : "ሁሉም ሁኔታዎች"}</SelectItem>
                <SelectItem value="Active">{language === "en" ? "Active" : "ንቁ"}</SelectItem>
                <SelectItem value="Inactive">{language === "en" ? "Inactive" : "ንቁ ያልሆነ"}</SelectItem>
                <SelectItem value="Suspended">{language === "en" ? "Suspended" : "ታግዷል"}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={language === "en" ? "Filter by Type" : "በአይነት ማጣሪያ"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "en" ? "All Types" : "ሁሉም አይነቶች"}</SelectItem>
                <SelectItem value="Internal">{language === "en" ? "Internal" : "ውስጣዊ"}</SelectItem>
                <SelectItem value="External">{language === "en" ? "External" : "ውጫዊ"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative">
              <Button
                className="px-3 bg-[#2F62F7] text-white hover:bg-[#2552d4]"
                onClick={()=>{ setUsersMenuOpen(v=>!v); setActionsMenuOpen(false) }}
              >
                {language === "en" ? "Users List" : "የተጠቃሚዎች ዝርዝር"}
              </Button>
              {usersMenuOpen && (
                <div className="absolute mt-2 w-44 bg-white border rounded-md shadow-lg z-10">
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={()=>{ alert('Export PDF (mock)'); setUsersMenuOpen(false) }}>Export PDF</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={()=>{ alert('Export XLS (mock)'); setUsersMenuOpen(false) }}>Export XLS</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={()=>{ alert('Export XLSX (mock)'); setUsersMenuOpen(false) }}>Export XLSX</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={()=>{ alert('Export DOCX (mock)'); setUsersMenuOpen(false) }}>Export DOCX</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={()=>{ alert('Export RTF (mock)'); setUsersMenuOpen(false) }}>Export RTF</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={()=>{ alert('Export CSV (mock)'); setUsersMenuOpen(false) }}>Export CSV</button>
                </div>
              )}
            </div>
            {isAdmin && (
              <div className="relative">
                <Button
                  className="px-3 bg-[#2F62F7] text-white hover:bg-[#2552d4]"
                  onClick={()=>{ setActionsMenuOpen(v=>!v); setUsersMenuOpen(false) }}
                >
                  {language === 'en' ? 'Register' : 'መመዝገብ'}
                </Button>
                {actionsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onClick={() => {
                        if (!selectedUser) return toast({ variant: 'destructive', title: language==='en'?'Select a user first':'አንድ ተጠቃሚ ይምረጡ' })
                        toast({ variant: 'success', title: language==='en'?'User unlocked':'ተጠቃሚው ተከፍቷል' })
                        setActionsMenuOpen(false)
                      }}
                    >
                      {language === 'en' ? 'Unlock' : 'ክፈት'}
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onClick={() => {
                        if (!selectedUser) return toast({ variant: 'destructive', title: language==='en'?'Select a user first':'አንድ ተጠቃሚ ይምረጡ' })
                        toast({ variant: 'success', title: language==='en'?'User approved':'ተጠቃሚ ተፈቅዷል' })
                        setActionsMenuOpen(false)
                      }}
                    >
                      {language === 'en' ? 'Approve' : 'አጽድቅ'}
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                      onClick={async () => {
                        if (!selectedUser?.email) return toast({ variant: 'destructive', title: language==='en'?'Select a user first':'አንድ ተጠቃሚ ይምረጡ' })
                        try {
                          const resp = await fetch('/api/auth/forgot-password', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: selectedUser.email }),
                          })
                          const data = await resp.json().catch(()=>({}))
                          if (!resp.ok) throw new Error(data?.message || 'Failed')
                          toast({ variant: 'success', title: language==='en'?'Reset email sent':'የይለፍ ቃል ኢሜይል ተልኳል' })
                        } catch (e: any) {
                          toast({ variant: 'destructive', title: language==='en'?'Failed to reset':'ማደስ አልተሳካም', description: e?.message })
                        } finally {
                          setActionsMenuOpen(false)
                        }
                      }}
                    >
                      {language === 'en' ? 'Reset Password' : 'የይለፍ ቃል ዳግም አስተካክል'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">{''}</TableHead>
                <TableHead>{language === "en" ? "User" : "ተጠቃሚ"}</TableHead>
                <TableHead>{language === "en" ? "Role" : "ሚና"}</TableHead>
                <TableHead>{language === "en" ? "Department" : "ክፍል"}</TableHead>
                <TableHead>{language === "en" ? "Type" : "አይነት"}</TableHead>
                <TableHead>{language === "en" ? "Status" : "ሁኔታ"}</TableHead>
                <TableHead>{language === "en" ? "Last Login" : "የመጨረሻ መግቢያ"}</TableHead>
                <TableHead>{language === "en" ? "Performance" : "አፈጻጸም"}</TableHead>
                <TableHead className="text-right">{language === "en" ? "Actions" : "እርምጃዎች"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={`${selectedUser?.id === user.id ? 'bg-blue-50' : ''} cursor-pointer`}
                  onClick={() => setSelectedUser(user)}
                >
                  <TableCell className="align-top pt-5">
                    <input
                      type="radio"
                      name="selectedUser"
                      checked={selectedUser?.id === user.id}
                      onChange={() => setSelectedUser(user)}
                      aria-label="Select user"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <button
                        type="button"
                        onClick={() => { setEditUser(user); setShowEditDialog(true) }}
                        className="font-medium text-blue-600 hover:underline text-left"
                        title={language === 'en' ? 'Edit user' : 'ተጠቃሚ አርትዕ'}
                      >
                        {user.name}
                      </button>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role)}>{displayRole(user.role)}</Badge>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <Badge variant={user.userType === "Internal" ? "default" : "secondary"}>{user.userType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(user.lastLogin)}</TableCell>
                  <TableCell>
                    {user.ticketsAssigned !== undefined ? (
                      <div className="text-sm">
                        <div>
                          {user.ticketsResolved}/{user.ticketsAssigned} resolved
                        </div>
                        <div className="text-muted-foreground">
                          {Math.round(((user.ticketsResolved || 0) / user.ticketsAssigned) * 100)}% success rate
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setEditUser(user); setShowEditDialog(true) }}
                            title={language === 'en' ? 'Edit user' : 'ተጠቃሚ አርትዕ'}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl">
          {selectedUser && <UserDetails user={selectedUser} onClose={() => setShowDetailsDialog(false)} />}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {editUser && (
            <UserForm
              user={editUser}
              onClose={() => { setShowEditDialog(false); setEditUser(null) }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Register Department Dialog */}
      <Dialog open={deptDialogOpen} onOpenChange={setDeptDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'en' ? 'Register Department' : 'ክፍል መመዝገብ'}</DialogTitle>
          </DialogHeader>
          <DepartmentForm onClose={()=>setDeptDialogOpen(false)} onSubmit={()=>setDeptDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
