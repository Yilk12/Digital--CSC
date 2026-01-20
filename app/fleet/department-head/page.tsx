'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from "@/app/components/toast-provider"
import { getDepartmentInfo, getNormalizedRoles } from '@/app/lib/session'
import { useLocalization } from "@/app/hooks/use-localization"
import { getCurrentUserId } from '@/app/lib/auth'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  licensePlate: string
  status: 'available' | 'assigned' | 'maintenance' | 'out_of_service'
  fuelType: string
  transmission: string
  mileage: number
  assignedTo?: string
  department?: string
}

interface Assignment {
  id: string
  vehicleId: string
  driverId: string
  department: string
  assignedBy: string
  assignedDate: string
  purpose: string
  status: 'active' | 'completed' | 'cancelled'
  employeeName: string
  employeeId: string
  position: string
}

interface FleetRequest {
  id: string
  purpose: string
  destination?: string
  date: string
  status:string
  requestor: {
    id: string
    firstName: string
    lastName: string
    department?: { id: string; name: string }
  }
  department?: { id: string; name: string }
  priority?: 'High' | 'Medium' | 'Low'
}

interface AssignmentHistoryItem {
  id: string
  requestorName: string | null
  purpose: string | null
  tripType: string | null
  date: string | null
  phone: string | null
  durationType: string | null
  status: string | null
  driverName: string | null
  destination: string | null
  approvedAt: string | null
}

export default function DepartmentHeadPage() {
  const { t } = useLocalization()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('approvals')
  const [departmentName, setDepartmentName] = useState('Sales Department') // This would come from user context
  const [requests, setRequests] = useState<FleetRequest[]>([])
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryItem[]>([])
  const [historyPage, setHistoryPage] = useState(1)
  const [openDetailsId, setOpenDetailsId] = useState<string | null>(null)
  const [historyExportOpen, setHistoryExportOpen] = useState(false)
    const { show: toast } = useToast()
  const [isFinance, setIsFinance] = useState(false)
  // Maintained vehicles state
  type MaintainedItem = {
    id: string;
    vehicleId: string;
    completedDate: string;
    description?: string | null;
    cost?: string | number | null;
    imageUrl?: string | null;
    status: 'ACCEPTED' | 'REJECTED';
    vehicle?: { id: string; plate?: string; make?: string | null; model?: string | null; year?: number | null };
  }
  const [maintainedItems, setMaintainedItems] = useState<MaintainedItem[]>([])
  const [maintainedLoading, setMaintainedLoading] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({})
  const [statusDraft, setStatusDraft] = useState<Record<string, 'ACCEPTED' | 'REJECTED'>>({})
  const [bulkStatus, setBulkStatus] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED')
  const [bulkFile, setBulkFile] = useState<File | null>(null)

  // Upload image to backend and return URL
  const uploadImageAndGetUrl = async (file: File): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('http://localhost:4000/api/upload/image', {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.message || 'Image upload failed')
    // Expecting backend returns { url }
    return data.url || data.secure_url || data.path || ''
  }

  // Apply bulk status change to selected rows, optionally with uploaded image
  const applyBulkStatusChange = async () => {
    try {
      const ids = Object.keys(selectedRows).filter(id => selectedRows[id])
      if (ids.length === 0) {
        toast({ title: t('fleet.dept.maintained.toast.no_rows_title'), description: t('fleet.dept.maintained.toast.no_rows_description') })
        return
      }
      let imageUrl: string | undefined
      if (bulkFile) {
        imageUrl = await uploadImageAndGetUrl(bulkFile)
      }
      const token = localStorage.getItem('accessToken') || ''
      for (const id of ids) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/department-head/maintained-vehicles/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: bulkStatus, ...(imageUrl ? { imageUrl } : {}) }),
        })
      }
      // Refresh list
      setActiveTab('maintainedVehicles')
      toast({ title: t('fleet.dept.toast.updated'), description: t('fleet.dept.maintained.change_status') })
      // Reflect locally
      setMaintainedItems(prev => prev.map(it => selectedRows[it.id] ? { ...it, status: bulkStatus, ...(imageUrl ? { imageUrl } : {}) } : it))
      setSelectedRows({})
      setBulkFile(null)
    } catch (e: any) {
      toast({ title: t('fleet.dept.toast.error'), description: e?.message || t('fleet.dept.maintained.toast.bulk_error'), variant: 'destructive' })
    }
  }

  // Load initial department data (vehicles, assignments, etc.)
  async function loadDepartmentData() {
    try {
      setLoading(true)

      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.items || [])

      // Load department assignments (currently mock data)
      setAssignments([
        {
          id: '1',
          vehicleId: '1',
          driverId: '1',
          department: 'Sales',
          assignedBy: 'Fleet Manager',
          assignedDate: '2024-01-15',
          purpose: 'Field visits',
          status: 'active',
          employeeName: 'John Smith',
          employeeId: 'EMP001',
          position: 'Sales Representative',
        },
        {
          id: '2',
          vehicleId: '2',
          driverId: '2',
          department: 'Sales',
          assignedBy: 'Fleet Manager',
          assignedDate: '2024-01-20',
          purpose: 'Client meetings',
          status: 'active',
          employeeName: 'Sarah Johnson',
          employeeId: 'EMP002',
          position: 'Account Manager',
        },
      ])
    } catch (error) {
      console.error('Error loading department data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDepartmentData()
  }, [])

  // Initialize tab from query string (?tab=approvals, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const sp = new URLSearchParams(window.location.search)
      const tab = sp.get('tab')
      if (tab === 'approvals' || tab === 'history' || tab === 'maintainedVehicles' || tab === 'requests') {
        setActiveTab(tab)
      }
    } catch {}
  }, [])

  // Determine department/role via session helpers
  useEffect(() => {
    const { name } = getDepartmentInfo()
    if (name) setDepartmentName(name)
    const roles = getNormalizedRoles() || []
    const finance = roles.some(r => /finance/i.test(String(r))) || /finance/i.test(String(name || ''))
    setIsFinance(finance)
  }, [])

  // Load maintained list when Finance tab becomes active
  useEffect(() => {
    if (activeTab === 'maintainedVehicles' && isFinance) {
      ;(async () => {
        try {
          setMaintainedLoading(true)
          const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token') || ''
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/department-head/maintained-vehicles`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          const data = await res.json().catch(() => [])
          if (!res.ok) throw new Error((data as any)?.message || 'Failed to load maintained vehicles')
          const items: MaintainedItem[] = Array.isArray(data) ? data : []
          setMaintainedItems(items)
          // seed status draft from current status
          const seed: Record<string, 'ACCEPTED' | 'REJECTED'> = {}
          for (const it of items) { seed[it.id] = it.status }
          setStatusDraft(seed)
          setSelectedRows({})
        } catch (e: any) {
          toast({ title: t('fleet.dept.toast.error'), description: e?.message || t('fleet.dept.maintained.toast.load_error'), variant: 'destructive' })
          setMaintainedItems([])
        } finally {
          setMaintainedLoading(false)
        }
      })()
    }
  }, [activeTab, isFinance])

  const updateMaintainedStatus = async (id: string) => {
    try {
      const status = statusDraft[id]
      if (!status) return
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/department-head/maintained-vehicles/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update status')
      // reflect change locally
      setMaintainedItems(prev => prev.map(it => it.id === id ? { ...it, status } : it))
      toast({ title: 'Updated', description: 'Maintained vehicle status updated' })
    } catch (e: any) {
      toast({ title: t('fleet.dept.toast.error'), description: e?.message || t('fleet.dept.maintained.toast.update_error'), variant: 'destructive' })
    }
  }

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/requests/department-requests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      console.log("Department requests response:", data);
      const items = Array.isArray(data?.data) 
        ? data.data 
        : Array.isArray(data)
          ? data
          : [];
      const currentUserId = getCurrentUserId();
      const teamRequests = items.filter((req: any) => {
        const requesterId = req?.requestor?.id;
        const status = (req as any).status || (req as any).requestStatus || (req as any).currentStatus;
        const isPending = typeof status === 'string' && status.toLowerCase() === 'pending';
        return requesterId && requesterId !== currentUserId && isPending;
      });
      setRequests(teamRequests);
    } catch (error) {
      console.error('Error fetching department requests:', error);
      toast({
        title: t('fleet.dept.toast.error'),
        description: (error as any)?.message || t('fleet.dept.approvals.toast.load_error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignmentHistory = async () => {
    try {
      setLoading(true)
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') || ''
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/department/assignment-history`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to load assignment history')
      }
      setAssignmentHistory(data.data || [])
    } catch (err: any) {
      console.error('Error fetching assignment history:', err)
      toast({
        title: t('fleet.dept.toast.error'),
        description: err?.message || 'Failed to load assignment history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load requests on initial mount and whenever Approvals tab becomes active
  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchRequests()
    }
  }, [activeTab])

  useEffect(() => {
    // Initial load so the stats card has data even before clicking the tab
    fetchRequests()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      fetchAssignmentHistory()
    }
  }, [activeTab])

  // Load assignment history once on mount so the stats card has data
  useEffect(() => {
    fetchAssignmentHistory()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      setHistoryPage(1)
    }
  }, [activeTab, assignmentHistory.length])

  // ✅ Handle approval/rejection for FIELD requests with toast feedback
  const handleApproval = async (id: string, action: "approve" | "reject") => {
    try {
      const token = localStorage.getItem("accessToken") || "";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/fleet-requests/${encodeURIComponent(id)}/${action}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as any)?.message || `Server error: ${response.status}`);
      }

      await fetchRequests(); // ✅ Refresh list after action
      await fetchAssignmentHistory(); // refresh assignment history so the report counter updates

      toast({
        title: t('fleet.dept.toast.updated'),
        description: t('fleet.dept.approvals.toast.action_success'),
      });
    } catch (error: any) {
      console.error("Approval/Rejection failed:", error);
      toast({
        title: t('fleet.dept.toast.error'),
        description: error?.message || t('fleet.dept.approvals.toast.action_error'),
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-100'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'Low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading && activeTab === 'approvals') {
    return <p className="text-center py-8">{t('fleet.dept.approvals.loading')}</p>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const departmentStats = {
    // Total vehicle assignment records in history tab (all assigned-history rows from backend)
    totalAssignments: assignmentHistory.length,
    activeAssignments: assignments.filter(a => a.status === 'active').length,
    completedAssignments: assignments.filter(a => a.status === 'completed').length,
    // Real number of vehicle requests from end-users (team members) to this department head
    // `requests` already excludes the department head's own requests in fetchRequests
    pendingRequests: requests.length,
  }

  const historyPageSize = 10
  const historyTotalPages = Math.max(1, Math.ceil(assignmentHistory.length / historyPageSize))
  const historyStartIndex = (historyPage - 1) * historyPageSize
  const historyEndIndex = historyStartIndex + historyPageSize
  const paginatedHistory = assignmentHistory.slice(historyStartIndex, historyEndIndex)

  const exportHistoryEscapeCsv = (value: unknown) => {
    const str = String(value ?? "")
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const buildAssignmentHistoryRows = () => {
    return assignmentHistory.map((item, index) => [
      String(index + 1),
      item.requestorName || '',
      item.purpose || '',
      item.tripType || '',
      item.date ? new Date(item.date).toLocaleDateString() : '',
      item.phone || '',
      item.durationType || '',
      item.status || '',
      item.driverName || '',
      item.destination || '',
      item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : '',
    ])
  }

  const handleExportHistoryCsv = (baseName: string, extension: string = 'csv') => {
    if (!assignmentHistory.length) {
      toast({
        title: t('fleet.dept.toast.error'),
        description: 'No assignment history to export',
        variant: 'destructive',
      })
      return
    }

    const headers = [
      '№',
      'Name',
      'Trip Purpose',
      'Trip Type',
      'Date',
      'Phone',
      'Duration',
      'Status',
      'Driver',
      'Destination',
      'Approved Date',
    ]

    const rows = buildAssignmentHistoryRows()
    const csvContent = [
      headers.map(exportHistoryEscapeCsv).join(','),
      ...rows.map((r) => r.map(exportHistoryEscapeCsv).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${baseName}.${extension}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportHistoryDoc = () => {
    if (!assignmentHistory.length) {
      toast({
        title: t('fleet.dept.toast.error'),
        description: 'No assignment history to export',
        variant: 'destructive',
      })
      return
    }

    const rows = buildAssignmentHistoryRows()
    const htmlRows = rows
      .map(
        (r) =>
          `<tr>
            <td>${r[0]}</td>
            <td>${r[1]}</td>
            <td>${r[2]}</td>
            <td>${r[3]}</td>
            <td>${r[4]}</td>
            <td>${r[5]}</td>
            <td>${r[6]}</td>
            <td>${r[7]}</td>
            <td>${r[8]}</td>
            <td>${r[9]}</td>
            <td>${r[10]}</td>
          </tr>`
      )
      .join('')

    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Assignment History</title></head>
      <body>
        <h2>Assignment History</h2>
        <table border="1" cellspacing="0" cellpadding="4">
          <thead>
            <tr>
              <th>№</th>
              <th>Name</th>
              <th>Trip Purpose</th>
              <th>Trip Type</th>
              <th>Date</th>
              <th>Phone</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Destination</th>
              <th>Approved Date</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body></html>`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'assignment-history.doc')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportHistoryPrintPdf = () => {
    if (!assignmentHistory.length) {
      toast({
        title: t('fleet.dept.toast.error'),
        description: 'No assignment history to export',
        variant: 'destructive',
      })
      return
    }

    const rows = buildAssignmentHistoryRows()
    const htmlRows = rows
      .map(
        (r) =>
          `<tr>
            <td>${r[0]}</td>
            <td>${r[1]}</td>
            <td>${r[2]}</td>
            <td>${r[3]}</td>
            <td>${r[4]}</td>
            <td>${r[5]}</td>
            <td>${r[6]}</td>
            <td>${r[7]}</td>
            <td>${r[8]}</td>
            <td>${r[9]}</td>
            <td>${r[10]}</td>
          </tr>`
      )
      .join('')

    const html = `<!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Assignment History</title></head>
      <body onload="window.print();window.close();">
        <h2>Assignment History</h2>
        <table border="1" cellspacing="0" cellpadding="4">
          <thead>
            <tr>
              <th>№</th>
              <th>Name</th>
              <th>Trip Purpose</th>
              <th>Trip Type</th>
              <th>Date</th>
              <th>Phone</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Driver</th>
              <th>Destination</th>
              <th>Approved Date</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body></html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.open()
      win.document.write(html)
      win.document.close()
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">{t("workflow.loading")}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Quick Stats (Active/Completed removed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div
          className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('approvals')
            router.push('/fleet/department-head?tab=approvals')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t("fleet.dept.stats.pending")}</p>
              <p className="text-2xl font-semibold text-gray-900">{departmentStats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div
          className="bg-white p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('history')
            router.push('/fleet/department-head?tab=history')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">vehicle Assignment report</p>
              <p className="text-2xl font-semibold text-gray-900">{departmentStats.totalAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top tab buttons removed; navigation handled via quick stat cards */}

      {/* Tab Content */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* New Vehicle Request Form */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">{t("fleet.dept.requests.title")}</h3>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.employee_name")}</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.employee_id")}</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.position")}</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.purpose")}</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">{t("fleet.dept.form.purpose.select")}</option>
                      <option value="field_visits">{t("fleet.dept.form.purpose.field_visits")}</option>
                      <option value="client_meetings">{t("fleet.dept.form.purpose.client_meetings")}</option>
                      <option value="daily_commute">{t("fleet.dept.form.purpose.daily_commute")}</option>
                      <option value="official_duties">{t("fleet.dept.form.purpose.official_duties")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.start_date")}</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.end_date")}</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t("fleet.dept.form.special_requirements")}</label>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={t("fleet.dept.form.special_requirements.ph")}></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    {t("fleet.common.cancel")}
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {t("fleet.common.submit_request")}
                  </button>
                </div>
              </form>
              </div>
            </div>

         
        </div>
      )}

      {activeTab === 'maintainedVehicles' && isFinance && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">{t("fleet.dept.maintained.title")}</h3>
          </div>
          <div className="p-6">
            {/* Bulk controls */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-700">{t("fleet.dept.maintained.status")}</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as 'ACCEPTED' | 'REJECTED')}
              >
                <option value="ACCEPTED">{t("fleet.dept.maintained.accepted")}</option>
                <option value="REJECTED">{t("fleet.dept.maintained.rejected")}</option>
              </select>
             
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
                onClick={applyBulkStatusChange}
              >{t("fleet.dept.maintained.change_status")}</button>
            </div>
            {maintainedLoading ? (
              <p className="text-gray-500">{t("fleet.dept.maintained.loading")}</p>
            ) : maintainedItems.length === 0 ? (
              <p className="text-gray-500">{t("fleet.dept.maintained.empty")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2">
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          onChange={(e) => {
                            const checked = e.target.checked
                            const next: Record<string, boolean> = {}
                            maintainedItems.forEach(it => { next[it.id] = checked })
                            setSelectedRows(next)
                          }}
                          checked={maintainedItems.every(it => selectedRows[it.id]) && maintainedItems.length > 0}
                        />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("fleet.dept.maintained.table.vehicle")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("fleet.dept.maintained.table.completed")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("fleet.dept.maintained.table.description")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("fleet.dept.maintained.table.cost")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("fleet.dept.maintained.table.image")}</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t("fleet.dept.maintained.table.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {maintainedItems.map(it => (
                      <tr key={it.id}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={!!selectedRows[it.id]}
                            onChange={(e) => setSelectedRows(prev => ({ ...prev, [it.id]: e.target.checked }))}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {(it.vehicle?.make || '')} {(it.vehicle?.model || '')} ({it.vehicle?.plate || ''})
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{new Date(it.completedDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 max-w-[360px] truncate" title={it.description || ''}>{it.description || '—'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{it.cost != null ? String(it.cost) : '—'}</td>
                        <td className="px-4 py-2 text-sm text-blue-600">
                          {it.imageUrl ? (
                            <a href={it.imageUrl} target="_blank" rel="noreferrer" className="underline">{t("fleet.dept.view")}</a>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">{it.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments tab removed as requested */}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-3 border-b">
            <h3 className="text-base font-semibold text-gray-900">Assignment History</h3>
          </div>
          <div className="p-4">
            <div className="mb-3 flex justify-end">
              <div className="relative inline-block text-left">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-3 py-1.5 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setHistoryExportOpen((prev) => !prev)}
                >
                  Export
                  <svg
                    className="-mr-1 ml-2 h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {historyExportOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1 text-xs">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                        onClick={() => {
                          handleExportHistoryCsv('assignment-history', 'csv')
                          setHistoryExportOpen(false)
                        }}
                      >
                        Export CSV
                      </button>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                        onClick={() => {
                          handleExportHistoryCsv('assignment-history', 'xls')
                          setHistoryExportOpen(false)
                        }}
                      >
                        Export Excel
                      </button>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                        onClick={() => {
                          handleExportHistoryDoc()
                          setHistoryExportOpen(false)
                        }}
                      >
                        Export Word
                      </button>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-gray-700"
                        onClick={() => {
                          handleExportHistoryPrintPdf()
                          setHistoryExportOpen(false)
                        }}
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border border-gray-300 border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-center font-medium text-gray-700">№</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Name</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Trip Purpose</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Trip Type</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Date</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">ስልክ</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">የግዜ ቆይታ</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">Status</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">የተመደበዉ ሹፌር</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">መድረሻ</th>
                    <th className="border border-gray-300 px-2 py-2 text-left font-medium text-gray-700">የፀደቀበት ቀን</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentHistory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="border border-gray-300 px-2 py-4 text-center text-gray-500"
                      >
                        No assignment history.
                      </td>
                    </tr>
                  ) : (
                    paginatedHistory.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-2 text-center text-gray-800">
                          {historyStartIndex + index + 1}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.requestorName || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.purpose || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.tripType || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.date
                            ? new Date(item.date).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.phone || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.durationType || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.status || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.driverName || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.destination || '-'}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-gray-800">
                          {item.approvedAt
                            ? new Date(item.approvedAt).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {assignmentHistory.length > historyPageSize && (
              <div className="mt-4 flex items-center justify-between text-xs text-gray-700">
                <div>
                  Showing {historyStartIndex + 1}–
                  {Math.min(historyEndIndex, assignmentHistory.length)} of {assignmentHistory.length}
                </div>
                <div className="space-x-2">
                  <button
                    type="button"
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage === historyTotalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approvals Tab */}
      {activeTab === 'approvals' && (
  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
    {/* Header with gradient */}
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">የመኪና ጥያቄዎች ማፅደቂያ</h3>
            <p className="text-blue-100 text-sm mt-1">{t("fleet.dept.approvals.subtitle").replace("{n}", String(requests.length))}</p>
          </div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white text-sm font-medium">{requests.length}</span>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-6 bg-gray-50/50">
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h4 className="text-gray-500 text-lg font-medium mb-2">{t("fleet.dept.approvals.empty.title")}</h4>
          <p className="text-gray-400 text-sm">{t("fleet.dept.approvals.empty.subtitle")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between">
                {/* Left Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {req.requestor.firstName[0]}{req.requestor.lastName[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
                        {req.purpose}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{req.requestor.firstName} {req.requestor.lastName}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{req.destination}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(req.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="flex flex-col items-end space-y-3 ml-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getPriorityColor(req.priority)} border border-current/20 backdrop-blur-sm`}>
                    {req.status || t("fleet.dept.approvals.pending_status")}
                  </span>
                  
                  <div className="flex space-x-2">
                  <button
                    onClick={() => handleApproval(req.id, "approve")}

                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium">{t("fleet.dept.approvals.approve")}</span>
                     </button>

                  <button
                    onClick={() => handleApproval(String(req.id), "reject")}

                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 shadow-sm hover:shadow-md hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-medium">{t("fleet.dept.approvals.reject")}</span>
                  </button>

                    
                    <button
                      type="button"
                      onClick={() =>
                        setOpenDetailsId(prev => (prev === String(req.id) ? null : String(req.id)))
                      }
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-1.5 shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="text-sm font-medium">{t("fleet.dept.approvals.details")}</span>
                    </button>
                  </div>
                </div>
              </div>
              {openDetailsId === String(req.id) && (
                <div className="mt-4 border-t pt-4 text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="font-semibold mb-1">{t('fleet.dept.approvals.detail_purpose')}</div>
                    <div>{req.purpose}</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{t('fleet.dept.approvals.detail_destination')}</div>
                    <div>{req.destination || '-'}</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">
                      {String(req.status).toUpperCase() === 'REJECTED'
                        ? t('fleet.dept.approvals.detail_rejected_date')
                        : t('fleet.dept.approvals.detail_date')}
                    </div>
                    <div>{new Date(req.date).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{t('fleet.dept.approvals.detail_department')}</div>
                    <div>{req.department?.name || '-'}</div>
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{t('fleet.dept.approvals.detail_status')}</div>
                    <div>{(req.status ? String(req.status).toUpperCase() : 'PENDING')}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
    </div>
  )
}