'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AttachmentUploader from '@/app/components/attachment-uploader'

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

function getStatusBadgeClass(status: MaintenanceStatus | string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'MAINTAINED':
    default:
      return 'bg-green-100 text-green-800'
  }
}

// Local UI types for the request form and receipts
type ReceiptItem = {
  id: string
  organization: string
  number?: string
  date?: string
  amount: number
  currency?: string
  fileName?: string
  fileUrl?: string
}

type NewRequestForm = {
  managerId: string
  driverId: string
  vehicleId: string
  organization: string
  incidentSeverity: 'HIGH' | 'LOW'
  receiptPeriod: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  notes: string
  receipts: ReceiptItem[]
}

interface MaintenanceRequest {
  id: string
  vehicleId: string
  requestedBy: string
  requestDate: string
  issueDescription: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assignedTo?: string
  estimatedCost?: number
  actualCost?: number
  completionDate?: string
  // Extended fields to support Driver Maintenance Record view
  managerId?: string
  driverId?: string
  incidentSeverity?: 'HIGH' | 'LOW'
  receiptPeriod?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'
  notes?: string
  attachments?: UploadItem[]
  receipts?: ReceiptItem[]
  // Approval workflow fields
  approvalStage?: 'driver_submitted' | 'maintenance_checked' | 'fleet_approved' | 'sent_to_org' | 'credit_invoice_received' | 'sent_to_finance' | 'finance_paid' | 'receipt_received' | 'closed'
  financeStatus?: 'pending' | 'sent' | 'paid' | 'finalized'
  documents?: {
    deliveryLetterUrl?: string
    creditInvoiceUrl?: string
    receiptUrl?: string
  }

}

type WorkflowEntry = {
  status: 'pending' | 'in_progress' | 'completed'
  assignedTo?: string
  history?: Array<{ by?: string; action: 'assign' | 'start' | 'complete'; at: string; assignedTo?: string }>
}

type User = { id: string; name?: string; email?: string; role?: string; department?: string }
type WorkflowMap = Record<string, WorkflowEntry>

type WorkflowHistoryEntry = { by?: string; action: 'assign' | 'start' | 'complete'; at: string; assignedTo?: string }
type UploadItem = { name: string; url: string; size: number; type: string }

// Maintenance schedule UI types
type ScheduleItem = {
  id: string
  title: string
  vehicleId?: string
  vehicleLabel?: string
  due: string
  notes?: string
}

// Backend maintenance schedule types
type MaintenanceStatus = 'PENDING' | 'IN_PROGRESS' | 'MAINTAINED' | 'REJECTED'
interface MaintenanceSchedule {
  id: string
  vehicleId: string
  userId: string
  incidentDate: string
  location?: string | null
  status: MaintenanceStatus
  description?: string | null
  actionByUserId?: string | null
  maintenanceScheduleTime?: string | null
  createdAt?: string
  updatedAt?: string
  vehicle?: { id: string; plate: string; make: string; model: string; year?: number } | null
  user?: { id: string; firstName: string; lastName: string; email?: string } | null
  actionBy?: { id: string; firstName: string; lastName: string; email?: string } | null
}

export default function MaintenancePage() {
  const pathname = usePathname()
  const isManagerView = pathname?.startsWith('/fleet/manager') ?? false
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('schedule')
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [workflow, setWorkflow] = useState<WorkflowMap>({})
  const [users, setUsers] = useState<User[]>([])
  const [assignRequestId, setAssignRequestId] = useState<string>('')
  const [assignUserId, setAssignUserId] = useState<string>('')
  const [assignSearch, setAssignSearch] = useState<string>('')
  const [assignStatusFilter, setAssignStatusFilter] = useState<string>('')
  const [assignPriorityFilter, setAssignPriorityFilter] = useState<string>('')
  const [addTeamIncludeOthers, setAddTeamIncludeOthers] = useState<boolean>(false)
  const [addTeamUserId, setAddTeamUserId] = useState<string>('')
  const [viewReqId, setViewReqId] = useState<string | null>(null)
  const [newRequest, setNewRequest] = useState<NewRequestForm>({
    managerId: '',
    driverId: '',
    vehicleId: '',
    organization: '',
    incidentSeverity: 'LOW',
    receiptPeriod: 'Monthly',
    notes: '',
    receipts: [],
  })
  // Hoisted function so it is available for filters defined below
  function getWorkflowStatus(requestId: string): 'pending'|'in_progress'|'completed'|undefined {
    return workflow[requestId]?.status
  }
  // Pagination for Maintenance Requests
  const [reqPage, setReqPage] = useState<number>(1)
  const [reqPageSize, setReqPageSize] = useState<number>(10)
  // Requests tab filters
  const [reqSearch, setReqSearch] = useState<string>('')
  const [reqStatusFilter, setReqStatusFilter] = useState<string>('')
  const [reqPriorityFilter, setReqPriorityFilter] = useState<string>('')
  const filteredRequests = maintenanceRequests
    .filter(r => !reqStatusFilter || (getWorkflowStatus(r.id) || r.status) === reqStatusFilter)
    .filter(r => !reqPriorityFilter || r.priority === reqPriorityFilter)
    .filter(r => {
      if (!reqSearch) return true
      const v = vehicles.find(x => x.id === r.vehicleId)
      const hay = `${v?.make || ''} ${v?.model || ''} ${v?.licensePlate || ''} ${r.issueDescription} ${r.requestedBy}`.toLowerCase()
      return hay.includes(reqSearch.toLowerCase())
    })
  const totalReqPages = Math.max(1, Math.ceil(filteredRequests.length / reqPageSize))
  const pagedRequests = filteredRequests.slice((reqPage - 1) * reqPageSize, reqPage * reqPageSize)

  useEffect(() => {
    // Reset to first page whenever page size changes or list shrinks below current page
    setReqPage(1)
  }, [reqPageSize, reqSearch, reqStatusFilter, reqPriorityFilter])

  // Maintained Vehicles register form state
  const [maintainedForm, setMaintainedForm] = useState<{ vehicleId: string; description: string; actualCost?: number; completionDate?: string; attachments: UploadItem[] }>({
    vehicleId: '',
    description: '',
    actualCost: undefined,
    completionDate: new Date().toISOString().slice(0,10),
    attachments: [],
  })
  const [maintainedSubmitting, setMaintainedSubmitting] = useState(false)
  const [maintainedError, setMaintainedError] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [lastMaintained, setLastMaintained] = useState<{ vehicleId: string; vehicleLabel: string; description: string; actualCost?: number; completionDate?: string } | null>(null)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    { id: 'sch-1', title: 'Oil Change - Toyota Camry (ABC-123)', due: '2024-02-15' },
    { id: 'sch-2', title: 'Brake Inspection - Honda Civic (XYZ-789)', due: '2024-02-20' },
    { id: 'sch-3', title: 'Tire Rotation - Ford Focus (DEF-456)', due: '2024-02-25' },
  ])
  // Real schedules from backend
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<MaintenanceStatus | ''>('')
  const [maintainedFilter, setMaintainedFilter] = useState<'all' | 'maintained' | 'not_maintained'>('all')
  const [scheduleExportFormat, setScheduleExportFormat] = useState<'excel' | 'word' | 'pdf'>('excel')
  const [scheduleForm, setScheduleForm] = useState<{ title: string; vehicleId: string; due: string; notes?: string }>({
    title: '',
    vehicleId: '',
    due: new Date().toISOString().slice(0,10),
    notes: '',
  })
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  // Selection and assignment state for schedules
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([])
  const [assignDate, setAssignDate] = useState<string>('')
  const [assignSubmitting, setAssignSubmitting] = useState<boolean>(false)
  const [targetStatus, setTargetStatus] = useState<MaintenanceStatus | ''>('')
  const [statusSubmitting, setStatusSubmitting] = useState<boolean>(false)

  // Export helpers for Maintenance Schedule
  const exportSchedulesExcel = () => {
    if (typeof window === 'undefined') return
    const visible = schedules.filter(schedule => {
      if (maintainedFilter === 'all') return true
      if (maintainedFilter === 'maintained') return schedule.status === 'MAINTAINED'
      if (maintainedFilter === 'not_maintained') return schedule.status !== 'MAINTAINED'
      return true
    })
    if (!visible.length) return

    const header = [
      'Incident Date',
      'Maintenance Date',
      'Vehicle',
      'Driver',
      'Location',
      'Status',
      'Team Verified',
      'Description',
    ]

    const csvLines = [
      header.join(','),
      ...visible.map(s => {
        const incidentDate = s.incidentDate ? new Date(s.incidentDate).toLocaleString() : ''
        const maintenanceDate = s.maintenanceScheduleTime ? new Date(s.maintenanceScheduleTime).toLocaleDateString() : ''
        const vehicle = s.vehicle ? `${s.vehicle.plate} ${s.vehicle.make || ''} ${s.vehicle.model || ''}`.trim() : ''
        const driver = s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : ''
        const location = s.location || ''
        const statusText = s.status.replace('_', ' ')
        const teamVerified =
          s.status === 'PENDING'
            ? 'Pending'
            : s.status === 'IN_PROGRESS'
            ? 'In Progress'
            : s.status === 'MAINTAINED'
            ? 'Approved'
            : s.status === 'REJECTED'
            ? 'Rejected'
            : ''
        const description = s.description || ''

        const cols = [incidentDate, maintenanceDate, vehicle, driver, location, statusText, teamVerified, description]
        return cols
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      }),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-schedule-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportSchedulesWord = () => {
    if (typeof window === 'undefined') return
    const visible = schedules.filter(schedule => {
      if (maintainedFilter === 'all') return true
      if (maintainedFilter === 'maintained') return schedule.status === 'MAINTAINED'
      if (maintainedFilter === 'not_maintained') return schedule.status !== 'MAINTAINED'
      return true
    })
    if (!visible.length) return

    const headerHtml = `
      <tr>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Incident Date</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Maintenance Date</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Vehicle</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Driver</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Location</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Status</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Team Verified</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Description</th>
      </tr>`

    const rowsHtml = visible
      .map(s => {
        const incidentDate = s.incidentDate ? new Date(s.incidentDate).toLocaleString() : ''
        const maintenanceDate = s.maintenanceScheduleTime ? new Date(s.maintenanceScheduleTime).toLocaleDateString() : ''
        const vehicle = s.vehicle ? `${s.vehicle.plate} ${s.vehicle.make || ''} ${s.vehicle.model || ''}`.trim() : ''
        const driver = s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : ''
        const location = s.location || ''
        const statusText = s.status.replace('_', ' ')
        const teamVerified =
          s.status === 'PENDING'
            ? 'Pending'
            : s.status === 'IN_PROGRESS'
            ? 'In Progress'
            : s.status === 'MAINTAINED'
            ? 'Approved'
            : s.status === 'REJECTED'
            ? 'Rejected'
            : ''
        const description = s.description || ''

        return `
          <tr>
            <td style="border:1px solid #ccc;padding:4px;">${incidentDate}</td>
            <td style="border:1px solid #ccc;padding:4px;">${maintenanceDate}</td>
            <td style="border:1px solid #ccc;padding:4px;">${vehicle}</td>
            <td style="border:1px solid #ccc;padding:4px;">${driver}</td>
            <td style="border:1px solid #ccc;padding:4px;">${location}</td>
            <td style="border:1px solid #ccc;padding:4px;">${statusText}</td>
            <td style="border:1px solid #ccc;padding:4px;">${teamVerified}</td>
            <td style="border:1px solid #ccc;padding:4px;">${description}</td>
          </tr>`
      })
      .join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>
      <h2>Maintenance Schedule Report</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;font-size:12px;">
        ${headerHtml}${rowsHtml}
      </table>
    </body></html>`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maintenance-schedule-${new Date().toISOString().slice(0, 10)}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportSchedulesPdf = () => {
    if (typeof window === 'undefined') return
    const visible = schedules.filter(schedule => {
      if (maintainedFilter === 'all') return true
      if (maintainedFilter === 'maintained') return schedule.status === 'MAINTAINED'
      if (maintainedFilter === 'not_maintained') return schedule.status !== 'MAINTAINED'
      return true
    })
    if (!visible.length) return

    const headerHtml = `
      <tr>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Incident Date</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Maintenance Date</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Vehicle</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Driver</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Location</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Status</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Team Verified</th>
        <th style="border:1px solid #ccc;padding:4px;text-align:left;">Description</th>
      </tr>`

    const rowsHtml = visible
      .map(s => {
        const incidentDate = s.incidentDate ? new Date(s.incidentDate).toLocaleString() : ''
        const maintenanceDate = s.maintenanceScheduleTime ? new Date(s.maintenanceScheduleTime).toLocaleDateString() : ''
        const vehicle = s.vehicle ? `${s.vehicle.plate} ${s.vehicle.make || ''} ${s.vehicle.model || ''}`.trim() : ''
        const driver = s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : ''
        const location = s.location || ''
        const statusText = s.status.replace('_', ' ')
        const teamVerified =
          s.status === 'PENDING'
            ? 'Pending'
            : s.status === 'IN_PROGRESS'
            ? 'In Progress'
            : s.status === 'MAINTAINED'
            ? 'Approved'
            : s.status === 'REJECTED'
            ? 'Rejected'
            : ''
        const description = s.description || ''

        return `
          <tr>
            <td style="border:1px solid #ccc;padding:4px;">${incidentDate}</td>
            <td style="border:1px solid #ccc;padding:4px;">${maintenanceDate}</td>
            <td style="border:1px solid #ccc;padding:4px;">${vehicle}</td>
            <td style="border:1px solid #ccc;padding:4px;">${driver}</td>
            <td style="border:1px solid #ccc;padding:4px;">${location}</td>
            <td style="border:1px solid #ccc;padding:4px;">${statusText}</td>
            <td style="border:1px solid #ccc;padding:4px;">${teamVerified}</td>
            <td style="border:1px solid #ccc;padding:4px;">${description}</td>
          </tr>`
      })
      .join('')

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>Maintenance Schedule Report</title></head><body>
      <h2>Maintenance Schedule Report</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial, sans-serif;font-size:12px;">
        ${headerHtml}${rowsHtml}
      </table>
    </body></html>`

    const win = window.open('', '_blank', 'width=1024,height=768')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleScheduleExport = () => {
    if (scheduleExportFormat === 'excel') return exportSchedulesExcel()
    if (scheduleExportFormat === 'word') return exportSchedulesWord()
    if (scheduleExportFormat === 'pdf') return exportSchedulesPdf()
  }

  // Helper to load schedules from backend
  const loadSchedules = async () => {
    setLoading(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('token')
          : null
      const q = scheduleStatusFilter ? `?status=${encodeURIComponent(scheduleStatusFilter)}` : ''
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/maintenance/schedules${q}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      )
      const data = await res.json().catch(() => ([]))
      if (!res.ok) throw new Error(data?.error || 'Failed to load maintenance schedules')
      setSchedules(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Bulk change status for selected schedules
  const handleChangeScheduleStatus = async (overrideStatus?: MaintenanceStatus) => {
    const statusToUse = overrideStatus || targetStatus
    if (!statusToUse || selectedScheduleIds.length === 0) return
    setStatusSubmitting(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('token')
          : null

      const requests = selectedScheduleIds.map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/maintenance/schedules/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: statusToUse })
        })
      )
      const responses = await Promise.all(requests)
      const failures = responses.filter(r => !r.ok)
      if (failures.length > 0) {
        const first = failures[0]
        const err = await first.json().catch(() => ({} as any))
        throw new Error(err?.error || 'Some status updates failed')
      }

      await loadSchedules()
      setSelectedScheduleIds([])
      setToastMsg('Status updated')
      setTimeout(() => setToastMsg(null), 2000)
    } catch (e: any) {
      alert(e?.message || 'Failed to update status')
    } finally {
      setStatusSubmitting(false)
    }
  }

  // Load maintenance schedules from backend when 'schedule' tab is active or filter changes
  useEffect(() => {
    if (activeTab !== 'schedule') return
    loadSchedules()
  }, [activeTab, scheduleStatusFilter])

  // Bulk-assign maintenance day to selected schedules
  const handleAssignMaintenanceDay = async () => {
    if (!assignDate || selectedScheduleIds.length === 0) return
    setAssignSubmitting(true)
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('token')
          : null
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/maintenance/schedules/assign-day`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
       
        body: JSON.stringify({ ids: selectedScheduleIds, day: assignDate })
      }).catch(() => null as any)
      const data = await (res ? res.json().catch(()=> ({})) : ({}))
       console.log(data)
      if (res && !res.ok) throw new Error(data?.error || 'Failed to assign maintenance day')
      // Refresh schedules and clear selection
      await loadSchedules()
      setSelectedScheduleIds([])
      setToastMsg('Maintenance day assigned')
      setTimeout(() => setToastMsg(null), 2000)
    } catch (e: any) {
      alert(e?.message || 'Failed to assign maintenance day')
    } finally {
      setAssignSubmitting(false)
    }
  }

  const handleSubmitSchedule = async () => {
    try {
      setScheduleSubmitting(true)
      setScheduleError(null)
      if (!scheduleForm.title) {
        setScheduleError('Title is required.')
        setScheduleSubmitting(false)
        return
      }

  // Load schedule items on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/fleet/maintenance/schedule')
        const data = await res.json().catch(()=> ({}))
        if (res.ok && Array.isArray(data?.items)) {
          setScheduleItems(data.items as ScheduleItem[])
        }
      } catch {}
    })()
  }, [])
      if (!scheduleForm.due) {
        setScheduleError('Due date is required.')
        setScheduleSubmitting(false)
        return
      }
      const veh = vehicles.find(v => v.id === scheduleForm.vehicleId)
      const vehicleLabel = veh ? `${veh.make} ${veh.model} (${veh.licensePlate})` : undefined
      const title = vehicleLabel ? `${scheduleForm.title} - ${vehicleLabel}` : scheduleForm.title
      // Attempt server persistence
      const res = await fetch(`${process.env.NEXT_PUBLIC_}/api/fleet/maintenance/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, vehicleId: scheduleForm.vehicleId || undefined, due: scheduleForm.due, notes: scheduleForm.notes || undefined })
      }).catch(() => null as any)
      const data = await (res ? res.json().catch(()=> ({})) : ({}))
      const saved: ScheduleItem | undefined = data?.item

      const item: ScheduleItem = saved || {
        id: `sch-${Date.now()}`,
        title,
        vehicleId: scheduleForm.vehicleId || undefined,
        vehicleLabel,
        due: scheduleForm.due,
        notes: scheduleForm.notes || undefined,
      }

      setScheduleItems(prev => [item, ...prev])
      setToastMsg('Maintenance schedule added')
      setTimeout(() => setToastMsg(null), 2500)
      setScheduleForm({ title: '', vehicleId: '', due: new Date().toISOString().slice(0,10), notes: '' })
    } catch (e: any) {
      setScheduleError(e?.message || 'Failed to add schedule')
    } finally {
      setScheduleSubmitting(false)
    }
  }

  useEffect(() => {
    loadMaintenanceData()
    // Load users for assignee selector
    ;(async () => {
      try {
        const res = await fetch('/api/platform/users')
        const data = await res.json()
        if (data?.ok) setUsers(data.items || [])
      } catch {}
    })()
  }, [])

  const loadMaintenanceData = async () => {
    try {
      setLoading(true)
      
      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.items || [])


    } catch (error) {
      console.error('Error loading maintenance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetMaintainedForm = () => {
    setMaintainedForm({ vehicleId: '', description: '', actualCost: undefined, completionDate: new Date().toISOString().slice(0,10), attachments: [] })
    setMaintainedError(null)
  }

  const handleSubmitMaintained = async () => {
    try {
      setMaintainedSubmitting(true)
      setMaintainedError(null)
      if (!maintainedForm.vehicleId) {
        setMaintainedError('Vehicle is required.')
        setMaintainedSubmitting(false)
        return
      }
      if (!maintainedForm.description) {
        setMaintainedError('Description is required.')
        setMaintainedSubmitting(false)
        return
      }

      // Try API first
      const res = await fetch('/api/fleet/maintenance/maintained', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: maintainedForm.vehicleId,
          description: maintainedForm.description,
          actualCost: maintainedForm.actualCost,
          completionDate: maintainedForm.completionDate,
          attachments: maintainedForm.attachments,
        })
      }).catch(() => null as any)
      const data = await (res ? res.json().catch(() => ({})) : ({}))
      if (res && !res.ok) throw new Error(data?.error || 'Failed to register maintained vehicle')

      // Update local requests: mark existing request as completed if present
      setMaintenanceRequests(prev => {
        const idx = prev.findIndex(r => r.vehicleId === maintainedForm.vehicleId && (r.status === 'in_progress' || r.status === 'pending'))
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = {
            ...next[idx],
            status: 'completed',
            actualCost: maintainedForm.actualCost,
            completionDate: maintainedForm.completionDate,
            issueDescription: next[idx].issueDescription || maintainedForm.description,
          }
          return next
        }
        // Otherwise add a new completed record
        const id = data?.data?.id || `comp-${Date.now()}`
        return [
          {
            id,
            vehicleId: maintainedForm.vehicleId,
            requestedBy: 'maintenance_team',
            requestDate: new Date().toISOString().slice(0,10),
            issueDescription: maintainedForm.description,
            priority: 'low',
            status: 'completed',
            actualCost: maintainedForm.actualCost,
            completionDate: maintainedForm.completionDate,
            notes: maintainedForm.description,
            attachments: maintainedForm.attachments,
          },
          ...prev,
        ]
      })

      // Update vehicle status to available
      setVehicles(prev => prev.map(v => v.id === maintainedForm.vehicleId ? { ...v, status: 'available' } : v))

      // Store summary for quick reference row
      const veh = vehicles.find(v => v.id === maintainedForm.vehicleId)
      setLastMaintained({
        vehicleId: maintainedForm.vehicleId,
        vehicleLabel: veh ? `${veh.make} ${veh.model} (${veh.licensePlate})` : maintainedForm.vehicleId,
        description: maintainedForm.description,
        actualCost: maintainedForm.actualCost,
        completionDate: maintainedForm.completionDate,
      })

      // Toast success
      setToastMsg('Vehicle maintenance registered successfully')
      setTimeout(() => setToastMsg(null), 3000)

      resetMaintainedForm()
    } catch (e: any) {
      setMaintainedError(e?.message || 'Failed to submit')
    } finally {
      setMaintainedSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const resetNewRequestForm = () => {
    setNewRequest({
      managerId: '',
      driverId: '',
      vehicleId: '',
      organization: '',
      incidentSeverity: 'LOW',
      receiptPeriod: 'Monthly',
      notes: '',
      receipts: [],
    })
    setFormError(null)
  }

  const handleWorkflowAction = async (requestId: string, action: 'assign'|'start'|'complete', assignedTo?: string) => {
    try {
      const res = await fetch('/api/fleet/maintenance/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action, assignedTo }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Workflow update failed')
      setWorkflow(prev => {
        const nextHistory: WorkflowHistoryEntry[] | undefined = Array.isArray(data.data.history)
          ? (data.data.history as WorkflowHistoryEntry[])
          : prev[requestId]?.history
        return {
          ...prev,
          [requestId]: { status: data.data.status, assignedTo: data.data.assignedTo, history: nextHistory }
        }
      })
    } catch (e) {
      console.error(e)
      alert((e as any)?.message || 'Failed to update workflow')
    }
  }

  // Approval helpers
  const updateRequest = (requestId: string, updater: (r: MaintenanceRequest) => MaintenanceRequest) => {
    setMaintenanceRequests(prev => prev.map(r => r.id === requestId ? updater(r) : r))
  }
  type ApprovalAction = 'maintenance_checked' | 'fleet_approved' | 'sent_to_org' | 'credit_invoice_received' | 'sent_to_finance' | 'finance_paid' | 'receipt_received' | 'closed'
  const handleApprovalAction = async (requestId: string, action: ApprovalAction, payload?: { url?: string }) => {
    try {
      // Optional: persist to API
      updateRequest(requestId, (r) => {
        const documents = { ...(r.documents || {}) }
        if (action === 'sent_to_org' && payload?.url) documents.deliveryLetterUrl = payload.url
        if (action === 'credit_invoice_received' && payload?.url) documents.creditInvoiceUrl = payload.url
        if (action === 'receipt_received' && payload?.url) documents.receiptUrl = payload.url
        let financeStatus = r.financeStatus
        if (action === 'sent_to_finance') financeStatus = 'sent'
        if (action === 'finance_paid') financeStatus = 'paid'
        if (action === 'receipt_received') financeStatus = 'finalized'
        const stage: MaintenanceRequest['approvalStage'] = action === 'closed' ? 'closed' : action
        return { ...r, approvalStage: stage, financeStatus, documents }
      })
      setToastMsg('Approval workflow updated')
      setTimeout(() => setToastMsg(null), 2000)
    } catch (e) {
      alert('Failed to update approval step')
    }
  }


  const handleSubmitNewRequest = async () => {
    try {
      setSubmitting(true)
      setFormError(null)

      if (!newRequest.managerId || !newRequest.driverId || !newRequest.organization) {
        setFormError('Please fill all required fields (Manager, Driver, Organization).')
        setSubmitting(false)
        return
      }
      if (!newRequest.vehicleId) {
        setFormError('Vehicle is required. Please select a vehicle.')
        setSubmitting(false)
        return
      }
      if (newRequest.incidentSeverity === 'HIGH' && (!newRequest.receipts || newRequest.receipts.length === 0)) {
        setFormError('For HIGH severity incidents, please attach at least one receipt/evidence.')
        setSubmitting(false)
        return
      }

      const res = await fetch('/api/fleet/maintenance/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerId: newRequest.managerId,
          driverId: newRequest.driverId,
          vehicleId: newRequest.vehicleId || undefined,
          organization: newRequest.organization,
          incidentSeverity: newRequest.incidentSeverity,
          receiptPeriod: newRequest.receiptPeriod,
          notes: newRequest.notes,
          receipts: newRequest.receipts,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to create maintenance request')
      }


      setShowNewRequestModal(false)
      resetNewRequestForm()
    } catch (e: any) {
      setFormError(e?.message || 'Error submitting request')
    } finally {
      setSubmitting(false)
    }
  }

  const maintenanceStats = {
    totalRequests: maintenanceRequests.length,
    pendingRequests: maintenanceRequests.filter(r => (getWorkflowStatus(r.id) || r.status) === 'pending').length,
    inProgressRequests: maintenanceRequests.filter(r => (getWorkflowStatus(r.id) || r.status) === 'in_progress').length,
    completedRequests: maintenanceRequests.filter(r => (getWorkflowStatus(r.id) || r.status) === 'completed').length,
    vehiclesInMaintenance: vehicles.filter(v => v.status === 'maintenance').length,
    totalCost: maintenanceRequests.reduce((total, req) => total + (req.actualCost || req.estimatedCost || 0), 0)
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading maintenance data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toastMsg}
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900"></h1>
            <p className="text-gray-600 mt-2"></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Export Schedule:</span>
              <select
                className="border border-gray-300 rounded h-9 px-2 bg-white text-gray-800"
                value={scheduleExportFormat}
                onChange={e => setScheduleExportFormat(e.target.value as 'excel' | 'word' | 'pdf')}
              >
                <option value="excel">Excel</option>
                <option value="word">Word</option>
                <option value="pdf">PDF</option>
              </select>
              <button
                type="button"
                onClick={handleScheduleExport}
                className="px-3 py-1.5 rounded-lg border border-emerald-500 text-emerald-700 text-xs font-medium hover:bg-emerald-50"
              >
                Export
              </button>
            </div>
            <Link 
              href="/fleet" 
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← ወደ ኋላ ተመለስ
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Maintenance Team Assignment */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Maintenance Team Assignment</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={assignRequestId}
                    onChange={(e)=> setAssignRequestId(e.target.value)}
                  >
                    <option value="">Select request…</option>
                    {maintenanceRequests
                      .filter(r => r.status !== 'completed')
                      .map(r => {
                        const v = vehicles.find(x => x.id === r.vehicleId)
                        const label = `${v?.make || ''} ${v?.model || ''} (${v?.licensePlate || r.vehicleId}) - ${r.issueDescription}`
                        return <option key={r.id} value={r.id}>{label}</option>
                      })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assign To</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={assignUserId}
                    onChange={(e)=> setAssignUserId(e.target.value)}
                  >
                    <option value="">Select team member…</option>
                    {users
                      .filter(u => (u.role || '').toLowerCase().includes('maintenance'))
                      .map(u => (
                        <option key={u.id} value={u.name || u.id}>{(u.name || u.email || u.id)}{u.role ? ` (${u.role})` : ''}</option>
                      ))}
                  </select>
                  <div className="mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600">New member (defaults: Fleet dept)</label>
                        <select
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          value={addTeamUserId}
                          onChange={(e)=> setAddTeamUserId(e.target.value)}
                        >
                          <option value="">Select user…</option>
                          {users
                            .filter(u => addTeamIncludeOthers ? true : (u.department || '').toLowerCase().includes('fleet'))
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {(u.name || u.email || u.id)}{u.department ? ` • ${u.department}` : ''}
                              </option>
                            ))}
                        </select>
                        <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-600">
                          <input type="checkbox" className="rounded border-gray-300" checked={addTeamIncludeOthers} onChange={(e)=> setAddTeamIncludeOthers(e.target.checked)} />
                          Include other departments
                        </label>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="w-full text-sm text-blue-600 hover:text-blue-800 border rounded px-3 py-2"
                          onClick={()=>{
                            const u = users.find(x => x.id === addTeamUserId)
                            if (!u) { alert('Select a user to add'); return }
                            // If already marked maintenance, skip
                            if ((u.role || '').toLowerCase().includes('maintenance')) {
                              setAssignUserId(u.name || u.id)
                              setToastMsg('User already in maintenance team'); setTimeout(()=> setToastMsg(null), 1500)
                              return
                            }
                            // Add/upgrade this user as maintenance role in local state
                            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: ((x.role ? x.role + ', ' : '') + 'maintenance') } : x))
                            setAssignUserId(u.name || u.id)
                            setToastMsg('Added to maintenance team from Fleet department'); setTimeout(()=> setToastMsg(null), 2000)
                          }}
                        >+ Add Team</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="w-full md:w-auto px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={!assignRequestId || !assignUserId}
                    onClick={()=>{
                      handleWorkflowAction(assignRequestId, 'assign', assignUserId)
                    }}
                  >Assign</button>
                </div>
              </div>
              {assignRequestId && (
                <div className="mt-4 text-sm text-gray-700">
                  {(() => {
                    const req = maintenanceRequests.find(r => r.id === assignRequestId)
                    const status = req ? (getWorkflowStatus(req.id) || req.status) : undefined
                    const assignedTo = workflow[assignRequestId]?.assignedTo || req?.assignedTo
                    return (
                      <div className="flex flex-wrap gap-4 items-center">
                        <div>Current Status: <span className={`px-2 py-1 text-xs font-medium rounded-full ${status ? getStatusColor(status) : 'bg-gray-100 text-gray-600'}`}>{status}</span></div>
                        <div>Assigned To: <span className="font-medium">{assignedTo || '-'}</span></div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
          {/* Urgent Requests */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Urgent Maintenance Requests</h3>
            </div>
            <div className="p-6">
              {maintenanceRequests.filter(r => r.priority === 'urgent' && r.status !== 'completed').length === 0 ? (
                <p className="text-gray-500 text-center py-4">No urgent requests</p>
              ) : (
                <div className="space-y-4">
                  {maintenanceRequests
                    .filter(r => r.priority === 'urgent' && r.status !== 'completed')
                    .map(request => {
                      const vehicle = vehicles.find(v => v.id === request.vehicleId)
                      return (
                        <div key={request.id} className="border rounded-lg p-4 bg-red-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})</h4>
                              <p className="text-sm text-gray-600">{request.issueDescription}</p>
                              <p className="text-sm text-gray-500">Requested by: {request.requestedBy}</p>
                              <p className="text-sm text-gray-500">Date: {request.requestDate}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority}
                              </span>
                              <div className="mt-2 space-x-2">
                                <button
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                  onClick={() => {
                                    const assignee = prompt('Assign to (name or id):') || undefined
                                    handleWorkflowAction(request.id, 'assign', assignee)
                                  }}
                                >
                                  Assign
                                </button>
                                <button
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                                  onClick={() => handleWorkflowAction(request.id, 'start')}
                                >
                                  Start Work
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Completed Work */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Recently Completed</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {maintenanceRequests
                  .filter(r => r.status === 'completed')
                  .slice(0, 3)
                  .map(request => {
                    const vehicle = vehicles.find(v => v.id === request.vehicleId)
                    return (
                      <div key={request.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})</h4>
                            <p className="text-sm text-gray-600">{request.issueDescription}</p>
                            <p className="text-sm text-gray-500">Completed: {request.completionDate}</p>
                            <p className="text-sm text-gray-500">Cost: ${request.actualCost}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
            {lastMaintained && (
              <div className="mb-6 border rounded-lg p-3 bg-green-50 text-green-800 text-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <div><span className="font-medium">Vehicle:</span> {lastMaintained.vehicleLabel}</div>
                  <div><span className="font-medium">Completed:</span> {lastMaintained.completionDate || '-'}</div>
                  <div><span className="font-medium">Actual Cost:</span> {typeof lastMaintained.actualCost === 'number' ? `$${lastMaintained.actualCost}` : '-'}</div>
                </div>
                <div className="mt-1"><span className="font-medium">Summary:</span> {lastMaintained.description || '-'}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Driver Maintenance Record Modal */}
      {viewReqId && (() => {
        const req = maintenanceRequests.find(r => r.id === viewReqId)
        const vehicle = vehicles.find(v => v.id === req?.vehicleId)
        if (!req) return null
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setViewReqId(null)} />
            <div className="relative bg-white w-full max-w-3xl rounded-lg shadow-lg border mx-4">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Driver Maintenance Record</h3>
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setViewReqId(null)}
                >✕</button>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Vehicle</div>
                    <div className="text-sm font-medium text-gray-900">{vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})</div>
                    <div className="text-xs text-gray-500">Year: {vehicle?.year} • Mileage: {vehicle?.mileage?.toLocaleString?.()} km</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(req.status)}`}>{(getWorkflowStatus(req.id) || req.status).replace('_',' ')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Manager ID</div>
                    <div className="text-sm text-gray-900">{req.managerId || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Driver ID</div>
                    <div className="text-sm text-gray-900">{req.driverId || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Incident Severity</div>
                    <div className="text-sm text-gray-900">{req.incidentSeverity || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Receipt Period</div>
                    <div className="text-sm text-gray-900">{req.receiptPeriod || '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Requested By</div>
                    <div className="text-sm text-gray-900">{req.requestedBy}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Request Date</div>
                    <div className="text-sm text-gray-900">{req.requestDate}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Issue / Notes</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">{req.issueDescription || req.notes || '-'}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Estimated Cost</div>
                    <div className="text-sm text-gray-900">{typeof req.estimatedCost === 'number' ? `$${req.estimatedCost}` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Actual Cost</div>
                    <div className="text-sm text-gray-900">{typeof req.actualCost === 'number' ? `$${req.actualCost}` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Completion Date</div>
                    <div className="text-sm text-gray-900">{req.completionDate || '-'}</div>
                  </div>
                </div>

                {(req.receipts && req.receipts.length > 0) && (
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">Receipts</div>
                    <div className="space-y-2">
                      {req.receipts.map((r, idx) => (
                        <div key={r.id || idx} className="border rounded p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {String(r.fileUrl || '').toLowerCase().endsWith('.pdf') ? (
                                <div className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 text-xs font-semibold rounded">PDF</div>
                              ) : (
                                <img src={r.fileUrl} alt={r.fileName} className="w-10 h-10 object-cover rounded border" onError={(e)=>{ (e.target as HTMLImageElement).style.display='none' }} />
                              )}
                              <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all truncate">{r.fileName}</a>
                            </div>
                            <div className="text-xs text-gray-500">{r.date || ''}</div>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                            <div><span className="text-gray-500">Org:</span> {r.organization || '-'}</div>
                            <div><span className="text-gray-500">No:</span> {r.number || '-'}</div>
                            <div><span className="text-gray-500">Amt:</span> {typeof r.amount === 'number' ? r.amount : '-'}</div>
                            <div><span className="text-gray-500">Cur:</span> {r.currency || '-'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Workflow */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-medium text-gray-900">Approval Workflow</h4>
                    <span className="text-xs text-gray-600">Stage: {req.approvalStage || '—'} · Finance: {req.financeStatus || '—'}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={()=> handleApprovalAction(req.id, 'maintenance_checked')}>Maintenance Checked</button>
                    <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={()=> handleApprovalAction(req.id, 'fleet_approved')}>Fleet Manager Approved</button>
                    <div className="border rounded p-3">
                      <div className="text-sm font-medium text-gray-800 mb-2">Send to Organization (Delivery Letter)</div>
                      {req.documents?.deliveryLetterUrl ? (
                        <div className="text-xs"><a className="text-blue-600 hover:underline" href={req.documents.deliveryLetterUrl} target="_blank" rel="noreferrer">View Delivery Letter</a></div>
                      ) : (
                        <AttachmentUploader
                          action="/api/uploads"
                          buttonLabel="Upload Delivery Letter"
                          accept="image/*,application/pdf"
                          maxCount={1}
                          maxTotalBytes={5 * 1024 * 1024}
                          onError={(m)=> alert(m)}
                          onUploaded={(d:any)=>{
                            try{
                              const it = (d?.items || [])[0]
                              if (it?.url) handleApprovalAction(req.id, 'sent_to_org', { url: it.url })
                            }catch{}
                          }}
                        />
                      )}
                    </div>
                    <div className="border rounded p-3">
                      <div className="text-sm font-medium text-gray-800 mb-2">Credit Invoice from Organization</div>
                      {req.documents?.creditInvoiceUrl ? (
                        <div className="text-xs"><a className="text-blue-600 hover:underline" href={req.documents.creditInvoiceUrl} target="_blank" rel="noreferrer">View Credit Invoice</a></div>
                      ) : (
                        <AttachmentUploader
                          action="/api/uploads"
                          buttonLabel="Upload Credit Invoice"
                          accept="image/*,application/pdf"
                          maxCount={1}
                          maxTotalBytes={5 * 1024 * 1024}
                          onError={(m)=> alert(m)}
                          onUploaded={(d:any)=>{
                            try{
                              const it = (d?.items || [])[0]
                              if (it?.url) handleApprovalAction(req.id, 'credit_invoice_received', { url: it.url })
                            }catch{}
                          }}
                        />
                      )}
                    </div>
                    <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={()=> handleApprovalAction(req.id, 'sent_to_finance')}>Send Invoice to Finance</button>
                    <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50" onClick={()=> handleApprovalAction(req.id, 'finance_paid')}>Mark Finance Paid</button>
                    <div className="border rounded p-3 md:col-span-2">
                      <div className="text-sm font-medium text-gray-800 mb-2">Receipt after Payment</div>
                      {req.documents?.receiptUrl ? (
                        <div className="text-xs"><a className="text-blue-600 hover:underline" href={req.documents.receiptUrl} target="_blank" rel="noreferrer">View Receipt</a></div>
                      ) : (
                        <AttachmentUploader
                          action="/api/uploads"
                          buttonLabel="Upload Receipt"
                          accept="image/*,application/pdf"
                          maxCount={1}
                          maxTotalBytes={5 * 1024 * 1024}
                          onError={(m)=> alert(m)}
                          onUploaded={(d:any)=>{
                            try{
                              const it = (d?.items || [])[0]
                              if (it?.url) handleApprovalAction(req.id, 'receipt_received', { url: it.url })
                            }catch{}
                          }}
                        />
                      )}
                    </div>
                    <button className="px-3 py-2 text-sm rounded border hover:bg-gray-50 md:col-span-2" onClick={()=> handleApprovalAction(req.id, 'closed')}>Close Request</button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3 rounded-b-lg">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
                  onClick={() => setViewReqId(null)}
                >Close</button>
              </div>
            </div>
          </div>
        )
      })()}

      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Maintenance Requests</h3>
            <div className="flex items-center gap-3">
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Search requests"
                value={reqSearch}
                onChange={(e)=> setReqSearch(e.target.value)}
              />
              <select
                className="border rounded px-2 py-1 text-sm"
                value={reqStatusFilter}
                onChange={(e)=> setReqStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={reqPriorityFilter}
                onChange={(e)=> setReqPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <label className="text-sm text-gray-600">Rows per page</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={reqPageSize}
                onChange={(e)=> setReqPageSize(Number(e.target.value))}
              >
                {[10,25,50,100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  resetNewRequestForm()
                  setShowNewRequestModal(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                New Request
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedRequests.map(request => {
                  const vehicle = vehicles.find(v => v.id === request.vehicleId)
                  const wfStatus = getWorkflowStatus(request.id) || request.status
                  return (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle?.make} {vehicle?.model}</div>
                        <div className="text-sm text-gray-500">{vehicle?.licensePlate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{request.issueDescription}</div>
                        <div className="text-sm text-gray-500">By: {request.requestedBy}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {request.driverId || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {request.incidentSeverity || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(wfStatus)}`}>
                          {(wfStatus || 'unknown').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${request.actualCost || request.estimatedCost || 'TBD'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(wfStatus === 'pending') && (
                          <span className="inline-flex items-center gap-2 mr-3">
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              defaultValue=""
                              onChange={(e)=>{
                                const uid = e.target.value
                                const u = users.find(x => x.id === uid)
                                const label = u?.name || u?.email || uid
                                if (uid) handleWorkflowAction(request.id, 'assign', label)
                              }}
                            >
                              <option value="" disabled>Assign to…</option>
                              {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>
                              ))}
                            </select>
                          </span>
                        )}
                        {(wfStatus === 'in_progress') && (
                          <button
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handleWorkflowAction(request.id, 'complete')}
                          >Complete</button>
                        )}
                        <button className="text-gray-600 hover:text-gray-900" onClick={()=> setViewReqId(request.id)}>View</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {maintenanceRequests.length > reqPageSize && (
                <tfoot>
                  <tr>
                    <td colSpan={8} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Showing {(reqPage - 1) * reqPageSize + 1}–{Math.min(reqPage * reqPageSize, maintenanceRequests.length)} of {maintenanceRequests.length}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                            disabled={reqPage <= 1}
                            onClick={() => setReqPage(p => Math.max(1, p - 1))}
                          >Prev</button>
                          <span className="text-sm">Page {reqPage} / {totalReqPages}</span>
                          <button
                            type="button"
                            className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                            disabled={reqPage >= totalReqPages}
                            onClick={() => setReqPage(p => Math.min(totalReqPages, p + 1))}
                          >Next</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Vehicles in Maintenance</h3>
          </div>
          <div className="p-6">
            {/* Maintained Vehicles register form */}
            <div id="maintained-form" className="border rounded-lg p-4 mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Register Maintained Vehicle</h4>
              {maintainedError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-3">{maintainedError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle<span className="text-red-500">*</span></label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={maintainedForm.vehicleId}
                    onChange={(e)=> setMaintainedForm(v => ({ ...v, vehicleId: e.target.value }))}
                  >
                    <option value="">Select vehicle…</option>
                    {vehicles.filter(v => v.status === 'maintenance').map(v => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                  <input
                    type="date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={maintainedForm.completionDate || ''}
                    onChange={(e)=> setMaintainedForm(v => ({ ...v, completionDate: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Description<span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Work performed / notes"
                    value={maintainedForm.description}
                    onChange={(e)=> setMaintainedForm(v => ({ ...v, description: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Cost (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g. 1500"
                    value={typeof maintainedForm.actualCost === 'number' ? String(maintainedForm.actualCost) : ''}
                    onChange={(e)=> setMaintainedForm(v => ({ ...v, actualCost: e.target.value ? Number(e.target.value) : undefined }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Attachments</label>
                  <div className="mt-2">
                    <AttachmentUploader
                      action="/api/uploads"
                      buttonLabel="Attach files"
                      accept="image/*,application/pdf"
                      maxCount={5}
                      maxTotalBytes={10 * 1024 * 1024}
                      onError={(msg)=> alert(msg)}
                      onUploaded={(data:any)=>{
                        if (!data?.ok) { alert(data?.message || 'Upload failed'); return }
                        const items: UploadItem[] = data.items || []
                        setMaintainedForm(v => ({ ...v, attachments: items }))
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
                  onClick={resetMaintainedForm}
                  disabled={maintainedSubmitting}
                >Reset</button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  onClick={handleSubmitMaintained}
                  disabled={maintainedSubmitting}
                >{maintainedSubmitting ? 'Saving…' : 'Register Maintained'}</button>
              </div>
            </div>
            {vehicles.filter(v => v.status === 'maintenance').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No vehicles currently in maintenance</p>
            ) : (
              <div className="space-y-4">
                {vehicles
                  .filter(v => v.status === 'maintenance')
                  .map(vehicle => {
                    const request = maintenanceRequests.find(r => r.vehicleId === vehicle.id && r.status === 'in_progress')
                    return (
                      <div key={vehicle.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.licensePlate})</h4>
                            <p className="text-sm text-gray-600">Year: {vehicle.year} • Mileage: {vehicle.mileage.toLocaleString()} km</p>
                            {request && (
                              <p className="text-sm text-gray-500">Current Work: {request.issueDescription}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-600">
                              In Maintenance
                            </span>
                            <div className="mt-2 space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 text-sm">View Details</button>
                              <button
                                className="text-green-600 hover:text-green-900 text-sm"
                                onClick={() => {
                                  // Prefill maintained form with this vehicle and current request description
                                  const req = maintenanceRequests.find(r => r.vehicleId === vehicle.id && (r.status === 'in_progress' || r.status === 'pending'))
                                  setMaintainedForm(v => ({
                                    ...v,
                                    vehicleId: vehicle.id,
                                    description: req?.issueDescription || v.description,
                                  }))
                                  // Scroll to the form
                                  const el = document.getElementById('maintained-form')
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                }}
                              >Mark Complete</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Maintenance Schedule
                </h3>
                <p className="text-sm text-gray-600 mt-1">Manage and assign maintenance tasks</p>
              </div>
              
              {/* Controls
                - Manager view (/fleet/manager/maintenance): assign date + "Assign Day" only
                - Maintenance team view (/fleet/maintenance): compact change-status controls
              */}
              {isManagerView ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="text-sm bg-transparent border-none focus:ring-0 text-gray-700"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    <select
                      value={maintainedFilter}
                      onChange={async (e) => {
                        const value = e.target.value as 'all' | 'maintained' | 'not_maintained'
                        setMaintainedFilter(value)

                        // If schedules are selected, also update their status
                        if (selectedScheduleIds.length > 0) {
                          if (value === 'maintained') {
                            await handleChangeScheduleStatus('MAINTAINED')
                          } else if (value === 'not_maintained') {
                            await handleChangeScheduleStatus('PENDING')
                          }
                        }
                      }}
                      className="text-sm bg-transparent border-none focus:ring-0 text-gray-700"
                    >
                      <option value="all">All</option>
                      <option value="maintained">Maintained</option>
                      <option value="not_maintained">Not Maintained</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAssignMaintenanceDay}
                    disabled={!assignDate || selectedScheduleIds.length === 0 || assignSubmitting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !assignDate || selectedScheduleIds.length === 0 || assignSubmitting
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {assignSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Assign Day
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // Maintenance team view: only change-status controls
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-200">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <select
                      value={targetStatus}
                      onChange={(e) => setTargetStatus(e.target.value as MaintenanceStatus | '')}
                      className="text-sm bg-transparent border-none focus:ring-0 text-gray-700"
                    >
                      <option value="">Change to…</option>
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="MAINTAINED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleChangeScheduleStatus()}
                    disabled={!targetStatus || selectedScheduleIds.length === 0 || statusSubmitting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !targetStatus || selectedScheduleIds.length === 0 || statusSubmitting
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {statusSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Change Status
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            {/* Selection Info */}
            {selectedScheduleIds.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">
                    {selectedScheduleIds.length} schedule{selectedScheduleIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <button
                  onClick={() => setSelectedScheduleIds([])}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={schedules.length > 0 && schedules.every(s => selectedScheduleIds.includes(s.id))}
                        onChange={(e) => {
                          const checked = e.target.checked
                          if (checked) setSelectedScheduleIds(Array.from(new Set([...schedules.map(s => s.id)])))
                          else setSelectedScheduleIds([])
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incident Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Maintenance Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      በቲሞች ተረጋግጧል
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.filter(schedule => {
                    if (maintainedFilter === 'all') return true;
                    if (maintainedFilter === 'maintained') return schedule.status === 'MAINTAINED';
                    if (maintainedFilter === 'not_maintained') return schedule.status !== 'MAINTAINED';
                    return true;
                  }).map((s) => (
                    <tr 
                      key={s.id} 
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      onClick={() => {
                        setSelectedScheduleIds(prev => 
                          prev.includes(s.id) 
                            ? prev.filter(id => id !== s.id)
                            : [...prev, s.id]
                        )
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedScheduleIds.includes(s.id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setSelectedScheduleIds(prev => 
                              checked 
                                ? [...new Set([...prev, s.id])]
                                : prev.filter(id => id !== s.id)
                            )
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(s.incidentDate).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {s.maintenanceScheduleTime ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {new Date(s.maintenanceScheduleTime).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Scheduled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {s.vehicle ? (
                          <div>
                            <div className="font-medium">{s.vehicle.plate}</div>
                            <div className="text-gray-500 text-xs">{s.vehicle.make} {s.vehicle.model}</div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {s.user ? `${s.user.firstName} ${s.user.lastName}` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {s.location || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            s.status as any,
                          )}`}
                        >
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {s.status === 'PENDING' && 'Pending'}
                        {s.status === 'IN_PROGRESS' && 'In Progress'}
                        {s.status === 'MAINTAINED' && 'Approved'}
                        {s.status === 'REJECTED' && 'Rejected'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 max-w-[200px]">
                        <div className="truncate" title={s.description || ''}>
                          {s.description || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {schedules.filter(schedule => {
                    if (maintainedFilter === 'all') return true;
                    if (maintainedFilter === 'maintained') return schedule.status === 'MAINTAINED';
                    if (maintainedFilter === 'not_maintained') return schedule.status !== 'MAINTAINED';
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-lg font-medium mb-1">No schedules found</p>
                          <p className="text-sm">Adjust your filters or check back later</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Maintenance Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewRequestModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-lg border mx-4">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Register Maintenance Issue</h3>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewRequestModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manager ID<span className="text-red-500">*</span></label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.managerId}
                    onChange={(e) => setNewRequest(v => ({ ...v, managerId: e.target.value }))}
                    placeholder="e.g., MGR-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Driver ID<span className="text-red-500">*</span></label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.driverId}
                    onChange={(e) => setNewRequest(v => ({ ...v, driverId: e.target.value }))}
                    placeholder="e.g., DRV-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Organization<span className="text-red-500">*</span></label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.organization}
                    onChange={(e) => setNewRequest(v => ({ ...v, organization: e.target.value }))}
                    placeholder="e.g., CSC Garage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vehicle<span className="text-red-500">*</span></label>
                  <select
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.vehicleId}
                    onChange={(e) => setNewRequest(v => ({ ...v, vehicleId: e.target.value }))}
                  >
                    <option value="" disabled>Select a vehicle…</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Incident Severity</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.incidentSeverity}
                    onChange={(e) => setNewRequest(v => ({ ...v, incidentSeverity: e.target.value as 'HIGH' | 'LOW' }))}
                  >
                    <option value="LOW">LOW</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt Period</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.receiptPeriod}
                    onChange={(e) => setNewRequest(v => ({ ...v, receiptPeriod: e.target.value as any }))}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Notes / Issue Description</label>
                  <textarea
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest(v => ({ ...v, notes: e.target.value }))}
                    placeholder="Describe the maintenance issue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Attach Receipts (Images/PDFs, max 10MB total per selection)</label>
                  <div className="mt-2">
                    <AttachmentUploader
                      action="/api/uploads"
                      buttonLabel="Attach receipts"
                      accept="image/*,application/pdf"
                      maxCount={5}
                      maxTotalBytes={10 * 1024 * 1024}
                      onError={(msg)=> alert(msg)}
                      onUploaded={(data:any)=>{
                        if (!data?.ok) { alert(data?.message || 'Upload failed'); return }
                        const items: UploadItem[] = data.items || []
                        setNewRequest(v => ({
                          ...v,
                          receipts: [
                            ...v.receipts,
                            ...items.map((it, idx) => ({
                              id: `${Date.now()}-${idx}`,
                              organization: v.organization || 'Unknown Org',
                              amount: 0,
                              currency: 'ETB',
                              fileName: it.name,
                              fileUrl: it.url,
                            }))
                          ]
                        }))
                      }}
                    />
                  </div>
                </div>
                {newRequest.receipts.length > 0 && (
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">Receipts</div>
                    <div className="space-y-3">
                      {newRequest.receipts.map((r, idx) => (
                        <div key={r.id || idx} className="border rounded p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              {String(r.fileUrl || '').toLowerCase().endsWith('.pdf') ? (
                                <div className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 font-semibold rounded">PDF</div>
                              ) : (
                                <img src={r.fileUrl} alt={r.fileName} className="w-12 h-12 object-cover rounded border" onError={(e)=>{ (e.target as HTMLImageElement).style.display='none' }} />
                              )}
                              <a href={r.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all truncate">{r.fileName}</a>
                            </div>
                            <button
                              type="button"
                              className="text-red-600 text-sm"
                              onClick={() => setNewRequest(v => ({ ...v, receipts: v.receipts.filter((_, i) => i !== idx) }))}
                            >Remove</button>
                          </div>
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                            <input
                              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Organization"
                              value={r.organization || ''}
                              onChange={(e) => setNewRequest(v => ({ ...v, receipts: v.receipts.map((x, i) => i===idx ? { ...x, organization: e.target.value } : x) }))}
                            />
                            <input
                              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              placeholder="Receipt No."
                              value={r.number || ''}
                              onChange={(e) => setNewRequest(v => ({ ...v, receipts: v.receipts.map((x, i) => i===idx ? { ...x, number: e.target.value } : x) }))}
                            />
                            <input
                              type="date"
                              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              value={r.date || ''}
                              onChange={(e) => setNewRequest(v => ({ ...v, receipts: v.receipts.map((x, i) => i===idx ? { ...x, date: e.target.value } : x) }))}
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Amount"
                                value={String(r.amount ?? 0)}
                                onChange={(e) => setNewRequest(v => ({ ...v, receipts: v.receipts.map((x, i) => i===idx ? { ...x, amount: Number(e.target.value || 0) } : x) }))}
                              />
                              <select
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                value={r.currency || 'ETB'}
                                onChange={(e) => setNewRequest(v => ({ ...v, receipts: v.receipts.map((x, i) => i===idx ? { ...x, currency: e.target.value } : x) }))}
                              >
                                <option value="ETB">ETB</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3 rounded-b-lg">
              <button
                type="button"
                className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
                onClick={() => setShowNewRequestModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleSubmitNewRequest}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}