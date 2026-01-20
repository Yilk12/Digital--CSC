"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/app/components/ui/form"
import { listVehicles, createFleetRequest, listFleetRequests, type VehicleDTO, type FleetRequestDTO } from "@/app/lib/fleet-api"
import { getCurrentUserPrimaryRole, getCurrentUserEmail, getCurrentUserId } from "@/app/lib/auth"

function VehicleSelect({ value, onChange, vehicles }: { value?: string; onChange: (v: string) => void; vehicles: VehicleDTO[] }) {
  const hasSingleVehicle = vehicles.length === 1

  return (
    <select
      className="w-full border rounded h-9 px-2 bg-white disabled:bg-gray-100 disabled:text-gray-600"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      disabled={hasSingleVehicle}
    >
      {!hasSingleVehicle && <option value="">Select vehicle</option>}
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>{v.plate}{v.make ? ` - ${v.make}` : ''}{v.model ? ` ${v.model}` : ''}</option>
      ))}
    </select>
  )
}

export default function FleetRequestForms({ initialTab = 'issue', driverId, driverVehicleId }: { initialTab?: 'issue' | 'fuel' | 'maintenance'; driverId?: string | null; driverVehicleId?: string | null }) {
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [fuelHistory, setFuelHistory] = useState<any[]>([])
  const [loadingFuelHistory, setLoadingFuelHistory] = useState(false)
  const [fuelPage, setFuelPage] = useState(1)
  const [selectedFuelIds, setSelectedFuelIds] = useState<string[]>([])
  const [bulkFuelStatus, setBulkFuelStatus] = useState<'' | 'FUELED' | 'NOT_FUELED' | 'HALF_FUELED'>('')
  const [fuelExportFormat, setFuelExportFormat] = useState<'excel' | 'word' | 'pdf'>('excel')
  const [fuelReportRange, setFuelReportRange] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('all')
  const [updatingFuelStatus, setUpdatingFuelStatus] = useState(false)
  const [submitState, setSubmitState] = useState<{ kind: string; status: 'idle' | 'submitting' | 'success' | 'error'; message?: string }>({ kind: 'ISSUE', status: 'idle' })
  const role = getCurrentUserPrimaryRole()
  const [tab, setTab] = useState<'issue' | 'fuel' | 'maintenance'>(initialTab)
  // Attachment state per form
  const [issueFiles, setIssueFiles] = useState<File[]>([])
  const [fuelFiles, setFuelFiles] = useState<File[]>([])
  const [maintFiles, setMaintFiles] = useState<File[]>([])
  const [issueFileError, setIssueFileError] = useState<string>('')
  const [fuelFileError, setFuelFileError] = useState<string>('')
  const [maintFileError, setMaintFileError] = useState<string>('')
  const [returnOdometerEdits, setReturnOdometerEdits] = useState<Record<string, string>>({})

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const allowMime = (mime: string) => mime?.startsWith('image/') || mime === 'application/pdf'
  function validateAndSet(kind: 'ISSUE' | 'FUEL' | 'MAINTENANCE', list: FileList | null) {
    const files = Array.from(list || [])
    const invalidType = files.filter(f => !allowMime(f.type)).map(f => f.name)
    const tooLarge = files.filter(f => f.size > MAX_SIZE).map(f => f.name)
    const valid = files.filter(f => allowMime(f.type) && f.size <= MAX_SIZE)
    const msgParts = [] as string[]
    if (invalidType.length) msgParts.push(`Invalid type: ${invalidType.join(', ')}`)
    if (tooLarge.length) msgParts.push(`Too large (>5MB): ${tooLarge.join(', ')}`)
    const msg = msgParts.join(' | ')
    if (kind === 'ISSUE') { setIssueFiles(valid); setIssueFileError(msg) }
    if (kind === 'FUEL') { setFuelFiles(valid); setFuelFileError(msg) }
    if (kind === 'MAINTENANCE') { setMaintFiles(valid); setMaintFileError(msg) }
  }

  const handleFuelExport = () => {
    if (fuelExportFormat === 'excel') return handleExportFuelExcel()
    if (fuelExportFormat === 'word') return handleExportFuelWord()
    if (fuelExportFormat === 'pdf') return handleExportFuelPdf()
  }

  const handleFuelRangeExport = (range: 'weekly' | 'monthly' | 'yearly') => {
    setFuelReportRange(range)
    // Give React a tick to update state before building the report
    setTimeout(() => {
      handleFuelExport()
    }, 0)
  }

  async function loadHistory() {
    try {
      setLoadingHistory(true)

      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('accessToken') ||
            window.localStorage.getItem('jwt') ||
            window.localStorage.getItem('token')
          : null

      if (!token) {
        setHistory([])
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/maintenance/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json().catch(() => ({}))
      const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []

      setHistory(items.slice(0, 20))
    } catch {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  async function loadFuelHistory() {
    try {
      setLoadingFuelHistory(true)

      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('accessToken') ||
            window.localStorage.getItem('jwt') ||
            window.localStorage.getItem('token')
          : null

      if (!token) {
        setFuelHistory([])
        return
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/fuel-requests/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json().catch(() => ({}))
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []

      setFuelHistory(items)
    } catch {
      setFuelHistory([])
    } finally {
      setLoadingFuelHistory(false)
    }
  }

  async function updateSelectedFuelStatuses() {
    if (!bulkFuelStatus || selectedFuelIds.length === 0) return

    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('accessToken') ||
          window.localStorage.getItem('jwt') ||
          window.localStorage.getItem('token')
        : null

    if (!token) return

    try {
      setUpdatingFuelStatus(true)

      await Promise.all(
        selectedFuelIds.map(id =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/fuel-requests/${id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: bulkFuelStatus }),
          }),
        ),
      )

      await loadFuelHistory()
      setSelectedFuelIds([])
    } finally {
      setUpdatingFuelStatus(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingVehicles(true)
        const list = await listVehicles()

        const all = Array.isArray(list) ? list : []

        const me = getCurrentUserId()

        let filtered = all

        // If a specific vehicle has been assigned to this driver (e.g. on /fleet/driver),
        // only expose that vehicle in the dropdown.
        if (driverVehicleId) {
          const byAssignedVehicle = all.filter(v => v.id === driverVehicleId)
          if (byAssignedVehicle.length > 0) {
            filtered = byAssignedVehicle
          }
        } else if (me) {
          const assigned = all.filter(v => v.driverId === me || v.assignedTo === me)
          if (assigned.length > 0) {
            filtered = assigned
          }
        }

        setVehicles(filtered)
      } catch (e) {
        // ignore; keep empty
      } finally {
        setLoadingVehicles(false)
      }
    }
    load()
  }, [driverId, driverVehicleId])

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    if (tab === 'fuel') {
      loadFuelHistory()
    }
  }, [tab])

  const issueForm = useForm<{ vehicleId?: string; date: string; description: string }>(
    { defaultValues: { vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '' } }
  )

  const fuelForm = useForm<{ vehicleId?: string; date: string; odometer?: number; amount?: number; cost?: number; description?: string; amountType?: 'LITER' | 'COUPON' | 'CASH'; fuelType?: string; currentOdometer?: number }>(
    {
      defaultValues: {
        vehicleId: '',
        date: new Date().toISOString().slice(0, 10),
        odometer: undefined,
        amount: undefined,
        cost: undefined,
        description: '',
        amountType: undefined,
        fuelType: undefined,
        // Current odometer reading defaults to 0
        currentOdometer: 0,
      },
    },
  )

  const maintForm = useForm<{ vehicleId?: string; date: string; description: string; cost?: number; severity?: string; fuelLevelStatus?: string; currentOdometer?: number }>(
    { defaultValues: { vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '', cost: undefined, severity: undefined, fuelLevelStatus: undefined, currentOdometer: undefined } }
  )

  // If exactly one vehicle is available for this driver, preselect it
  useEffect(() => {
    if (vehicles.length === 1) {
      const onlyId = vehicles[0]?.id
      if (onlyId) {
        const issueCurrent = issueForm.getValues('vehicleId')
        const fuelCurrent = fuelForm.getValues('vehicleId')
        const maintCurrent = maintForm.getValues('vehicleId')

        if (!issueCurrent) issueForm.setValue('vehicleId', onlyId)
        if (!fuelCurrent) fuelForm.setValue('vehicleId', onlyId)
        if (!maintCurrent) maintForm.setValue('vehicleId', onlyId)
      }
    }
  }, [vehicles, issueForm, fuelForm, maintForm])

  // If this form is being used for a specific driver (e.g. on /fleet/driver),
  // and the current tab is 'issue', switch to 'fuel' so we don't land on a hidden tab.
  useEffect(() => {
    if (driverId && tab === 'issue') {
      setTab('fuel')
    }
  }, [driverId, tab])

  // Helper to upload files to server and return URLs
  async function uploadFiles(files: File[]): Promise<Array<{ name: string; url: string }>> {
    if (!files || files.length === 0) return []
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const res = await fetch('/api/uploads', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = data?.message || (data?.invalidType || data?.tooLarge ? JSON.stringify({ invalidType: data?.invalidType, tooLarge: data?.tooLarge }) : '')
      throw new Error(detail ? `Upload failed: ${detail}` : 'Failed to upload attachments')
    }
    const items = data?.items || []
    return items.map((it: any) => ({ name: it?.name || 'file', url: it?.url }))
  }

  async function handleSubmit(kind: 'ISSUE' | 'FUEL' | 'MAINTENANCE', values: any) {
    setSubmitState({ kind, status: 'submitting' })
    try {
      const requestorId = getCurrentUserId()
      if (!requestorId) {
        throw new Error('User not authenticated')
      }
      const filesToAttach = kind === 'ISSUE' ? issueFiles : kind === 'FUEL' ? fuelFiles : maintFiles
      const uploaded = filesToAttach && filesToAttach.length > 0 ? await uploadFiles(filesToAttach) : []
      if (kind === 'MAINTENANCE') {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('accessToken') ||
              window.localStorage.getItem('jwt') ||
              window.localStorage.getItem('token')
            : null

        if (!token) {
          throw new Error('No authentication token found')
        }

        const scheduleBody = {
          incidentDate: values.date,
          description: values.description || undefined,
          fuelLevelStatus: values.fuelLevelStatus || undefined,
          remainingFuelKm: values.currentOdometer != null && values.currentOdometer !== ''
            ? Number(values.currentOdometer)
            : undefined,
          severity: values.severity || undefined,
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/maintenance/schedules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(scheduleBody),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message || 'Failed to create maintenance schedule')
        }
      } else if (kind === 'FUEL') {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('accessToken') ||
              window.localStorage.getItem('jwt') ||
              window.localStorage.getItem('token')
            : null

        if (!token) {
          throw new Error('No authentication token found')
        }

        const fuelBody = {
          vehicleId: values.vehicleId,
          date: values.date,
          odometer: Number(values.odometer),
          amount: Number(values.amount),
          amountType: String(values.amountType || '').toUpperCase() as 'LITER' | 'COUPON' | 'CASH',
          notes: values.description || undefined,
          // send current odometer reading to backend as remainingFuelRequest
          remainingFuelRequest: Number(values.currentOdometer ?? 0),
        }

        console.log("Value to send is",fuelBody)

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/fuel-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(fuelBody),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.message || 'Failed to create fuel request')
        }
        await loadFuelHistory() // Refresh fuelHistory after creating a FUEL request
      } else {
        const payload = {
          type: kind,
          date: new Date(values.date).toISOString(),
          requestorId,
          vehicleId: values.vehicleId || undefined,
          description: values.description || undefined,
          odometer: values.odometer ? Number(values.odometer) : undefined,
          amount: values.amount ? Number(values.amount) : undefined,
          amountType: values.amountType ? String(values.amountType).toUpperCase() : undefined,
          cost: values.cost ? Number(values.cost) : undefined,
          severity: values.severity ? String(values.severity).toUpperCase() : undefined,
          attachments: uploaded.length ? uploaded : undefined,
        }
        await createFleetRequest(payload as any)
      }
      setSubmitState({ kind, status: 'success', message: `${kind} request submitted` })
      await loadHistory()
      // reset relevant form
      if (kind === 'ISSUE') issueForm.reset({ vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '' })
      if (kind === 'FUEL')
        fuelForm.reset({
          vehicleId: '',
          date: new Date().toISOString().slice(0, 10),
          odometer: undefined,
          amount: undefined,
          cost: undefined,
          description: '',
          amountType: undefined,
          // keep explicit default of 0 after submit
          currentOdometer: 0,
        })
      if (kind === 'MAINTENANCE') maintForm.reset({ vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '', cost: undefined, severity: undefined })
      // clear attachments for that kind
      if (kind === 'ISSUE') setIssueFiles([])
      if (kind === 'FUEL') setFuelFiles([])
      if (kind === 'MAINTENANCE') setMaintFiles([])
    } catch (e: any) {
      setSubmitState({ kind, status: 'error', message: e?.message || 'Submit failed' })
    }
  }

  const roleHint = useMemo(() => {
    if (role === 'department_head') return 'You can submit on behalf of your department.'
    if (role === 'admin' || role === 'manager') return 'You have elevated permissions to manage requests.'
    return 'As a driver/employee, provide accurate details.'
  }, [role])

  // Derived UI labels for Fuel form based on amountType
  const fuelAmountType = fuelForm?.watch ? fuelForm.watch('amountType') : undefined
  const fuelAmountValue = fuelForm?.watch ? fuelForm.watch('amount') : undefined
  useEffect(() => {
    if (fuelAmountType === 'LITER') {
      const amountNum = Number(fuelAmountValue)
      if (amountNum > 0) {
        const autoOdometer = 4.5 * amountNum
        fuelForm.setValue('odometer', Number(autoOdometer.toFixed(2)), { shouldValidate: true, shouldDirty: true })
      }
    }
  }, [fuelAmountType, fuelAmountValue, fuelForm])
  const fuelAmountLabel = fuelAmountType === 'CASH'
    ? 'Amount (Cash)'
    : fuelAmountType === 'COUPON'
      ? 'Amount (Coupon)'
      : 'Fuel Amount (L)'
  const fuelAmountPlaceholder = fuelAmountType === 'CASH'
    ? 'e.g. 3000'
    : fuelAmountType === 'COUPON'
      ? 'e.g. 2'
      : 'e.g. 40'
  const fuelAmountHelp = fuelAmountType === 'CASH'
    ? 'Enter the cash amount requested.'
    : fuelAmountType === 'COUPON'
      ? 'Enter number of coupons or coupon value count.'
      : 'Enter liters requested.'

  const totalFuelOdometer = useMemo(() => {
    if (!Array.isArray(fuelHistory) || fuelHistory.length === 0) return 0
    return fuelHistory.reduce((sum: number, req: any) => {
      const value = Number(req?.odometer)
      return sum + (isNaN(value) ? 0 : value)
    }, 0)
  }, [fuelHistory])

  const latestRemainingKm = useMemo(() => {
    if (!Array.isArray(fuelHistory) || fuelHistory.length === 0) return 0

    // newest request by date
    const sortedDesc = [...fuelHistory].sort((a: any, b: any) => {
      const da = a?.date ? new Date(a.date).getTime() : 0
      const db = b?.date ? new Date(b.date).getTime() : 0
      return db - da
    })

    const latest = sortedDesc[0]
    // Prefer the raw currentOdometer field, but fall back to remainingFuelRequest
    const raw =
      latest && (latest as any).currentOdometer != null && (latest as any).currentOdometer !== ''
        ? (latest as any).currentOdometer
        : (latest as any).remainingFuelRequest

    const value = Number(raw ?? 0)
    return isNaN(value) ? 0 : value
  }, [fuelHistory])

  const combinedTotalKm = useMemo(() => {
    return Number(totalFuelOdometer || 0) + Number(latestRemainingKm || 0)
  }, [totalFuelOdometer, latestRemainingKm])

  const getFuelReportRangeStart = (range: 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date()
    if (range === 'daily') {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      return d
    }
    if (range === 'weekly') {
      const d = new Date(now)
      const day = d.getDay()
      const diff = day === 0 ? 6 : day - 1
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - diff)
      return d
    }
    if (range === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }
    if (range === 'yearly') {
      return new Date(now.getFullYear(), 0, 1)
    }
    return null
  }

  const getFuelReportRangeEnd = (range: 'all' | 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date()
    if (range === 'daily') {
      const d = new Date(now)
      d.setHours(23, 59, 59, 999)
      return d
    }
    if (range === 'weekly') {
      const start = getFuelReportRangeStart('weekly')
      if (!start) return null
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      return end
    }
    if (range === 'monthly') {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }
    if (range === 'yearly') {
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    }
    return null
  }

  const FUEL_ROWS_PER_PAGE = 10

  useEffect(() => {
    // Reset to first page when history or filters change (e.g. after creating a new request or changing range/status)
    setFuelPage(1)
  }, [fuelHistory.length, fuelReportRange, bulkFuelStatus])

  const fuelHistoryWithRunningTotal = useMemo(
    () => {
      if (!Array.isArray(fuelHistory) || fuelHistory.length === 0) {
        return [] as Array<{ req: any; runningTotalKm: number }>
      }

      // Sort by date (newest first) so the latest request appears on the first row
      const sortedDesc = [...fuelHistory].sort((a: any, b: any) => {
        const da = a?.date ? new Date(a.date).getTime() : 0
        const db = b?.date ? new Date(b.date).getTime() : 0
        return db - da
      })

      // Newest row: use combinedTotalKm (sum of the two green buttons)
      // Older rows: per-request total (odometer + remainingFuelRequest)
      return sortedDesc.map((req: any, index: number) => {
        if (index === 0) {
          return { req, runningTotalKm: combinedTotalKm }
        }
        const baseOdometer = Number(req?.odometer)
        const remaining = Number(req?.remainingFuelRequest ?? 0)
        const total = (isNaN(baseOdometer) ? 0 : baseOdometer) + (isNaN(remaining) ? 0 : remaining)
        return { req, runningTotalKm: total }
      })
    },
    [fuelHistory, combinedTotalKm],
  )

  const filteredFuelHistoryWithRunningTotal = useMemo(() => {
    const rangeStart = getFuelReportRangeStart(fuelReportRange)

    return fuelHistoryWithRunningTotal.filter(({ req }) => {
      // Filter by date range if a range is selected
      if (fuelReportRange !== 'all') {
        if (!req.date || !rangeStart) return false
        const d = new Date(req.date)
        if (isNaN(d.getTime())) return false
        if (d < rangeStart) return false
      }

      // Filter by status if a bulkFuelStatus is selected
      if (bulkFuelStatus && req.status) {
        const status = String(req.status).toUpperCase()
        if (status !== bulkFuelStatus) return false
      }

      return true
    })
  }, [fuelHistoryWithRunningTotal, fuelReportRange, bulkFuelStatus])

  const monthlyKmAndFuel = useMemo(() => {
    if (fuelReportRange !== 'monthly') {
      return { km: 0, liters: 0 }
    }

    if (!Array.isArray(filteredFuelHistoryWithRunningTotal) || filteredFuelHistoryWithRunningTotal.length === 0) {
      return { km: 0, liters: 0 }
    }

    let km = 0
    let liters = 0

    filteredFuelHistoryWithRunningTotal.forEach(({ req }) => {
      const status = String(req?.status || '').toUpperCase()
      if (status !== 'FUELED' && status !== 'HALF_FUELED') {
        return
      }

      const odometerVal = Number(req?.odometer)
      if (!isNaN(odometerVal)) {
        km += odometerVal
      }

      const amountVal = Number(req?.amount)
      if (!isNaN(amountVal)) {
        liters += amountVal
      }
    })

    return { km, liters }
  }, [filteredFuelHistoryWithRunningTotal, fuelReportRange])

  const fuelReportRangeLabel = useMemo(() => {
    if (fuelReportRange === 'all') return ''

    // If there are no rows after filtering, don't show a range label
    if (!filteredFuelHistoryWithRunningTotal.length) return ''

    const start = getFuelReportRangeStart(fuelReportRange)
    const end = getFuelReportRangeEnd(fuelReportRange)
    if (!start || !end) return ''

    const prefix =
      fuelReportRange === 'daily'
        ? 'Today'
        : fuelReportRange === 'weekly'
          ? 'This week'
          : fuelReportRange === 'monthly'
            ? 'This month'
            : 'This year'

    const fmt = (d: Date) => d.toLocaleDateString('en-GB')
    return `${prefix}: ${fmt(start)} – ${fmt(end)}`
  }, [fuelReportRange, filteredFuelHistoryWithRunningTotal.length])

  const paginatedFuelHistory = useMemo(() => {
    const start = (fuelPage - 1) * FUEL_ROWS_PER_PAGE
    const end = start + FUEL_ROWS_PER_PAGE
    return filteredFuelHistoryWithRunningTotal.slice(start, end)
  }, [filteredFuelHistoryWithRunningTotal, fuelPage])

  // Total fuel requested (amount) for the currently filtered fuel history range.
  // If exactly one vehicle is assigned/visible for this driver, we treat this chip
  // as a per-vehicle total so it aligns with the manager report's per-vehicle
  // "በወር ዉስጥ የተቀዳ ነዳጅ በሊትር" column.
  const totalFilteredFuelLiters = useMemo(() => {
    if (!Array.isArray(filteredFuelHistoryWithRunningTotal) || filteredFuelHistoryWithRunningTotal.length === 0) {
      return 0
    }

    const singleVehicleId = vehicles.length === 1 ? (vehicles[0] as any)?.id : null

    return filteredFuelHistoryWithRunningTotal.reduce((sum, { req }) => {
      // When only one vehicle is in scope, restrict the total to that vehicle's
      // fuel requests so the value is per-vehicle, matching the manager view.
      if (singleVehicleId) {
        const reqVehicleId = (req as any)?.vehicleId || (req as any)?.vehicle?.id || null
        if (reqVehicleId && String(reqVehicleId) !== String(singleVehicleId)) {
          return sum
        }
      }

      const value = Number((req as any)?.amount)
      return sum + (Number.isNaN(value) ? 0 : value)
    }, 0)
  }, [filteredFuelHistoryWithRunningTotal, vehicles])

  const handleUpdateReturnOdometer = async (id: string, value: string) => {
    const trimmed = (value || '').trim()
    if (!trimmed) {
      setReturnOdometerEdits(prev => ({ ...prev, [id]: '' }))
      return
    }
    const numeric = Number(trimmed)
    if (!Number.isFinite(numeric) || numeric < 0) {
      alert('Invalid የተመለሰበት ኪ.ሜ value')
      return
    }

    const token =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('accessToken') ||
          window.localStorage.getItem('jwt') ||
          window.localStorage.getItem('token')
        : null

    if (!token) {
      alert('No authentication token found')
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/fuel-requests/${id}/return-odometer`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ returnOdometerKm: numeric }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || 'Failed to update return odometer')
      }

      setReturnOdometerEdits(prev => ({ ...prev, [id]: trimmed }))
      await loadFuelHistory()
    } catch (e: any) {
      alert(e?.message || 'Failed to update የተመለሰበት ኪ.ሜ')
    }
  }

  const buildFuelHistoryReport = () => {
    const rows: Array<{
      index: number
      date: string
      vehicle: string
      odometer: string
      remainingKm: string
      totalKm: string
      amount: string
      type: string
      status: string
      notes: string
    }> = []

    const now = new Date()
    const rangeMs = (() => {
      if (fuelReportRange === 'daily') return 1 * 24 * 60 * 60 * 1000
      if (fuelReportRange === 'weekly') return 7 * 24 * 60 * 60 * 1000
      if (fuelReportRange === 'monthly') return 30 * 24 * 60 * 60 * 1000
      if (fuelReportRange === 'yearly') return 365 * 24 * 60 * 60 * 1000
      return 0
    })()

    fuelHistoryWithRunningTotal.forEach(({ req, runningTotalKm }, index) => {
      if (fuelReportRange !== 'all' && req.date) {
        const d = new Date(req.date)
        if (!isNaN(d.getTime())) {
          const diff = now.getTime() - d.getTime()
          if (diff > rangeMs) {
            return
          }
        }
      }
      const vehicleLabel = req.vehicle
        ? `${req.vehicle.plate || ''}${req.vehicle.make ? ` - ${req.vehicle.make}` : ''}${req.vehicle.model ? ` ${req.vehicle.model}` : ''}`.trim() || req.vehicle.id || '-'
        : req.vehicleId || '-'

      // If a status filter is selected, only include rows with that status
      if (bulkFuelStatus && req.status) {
        const status = String(req.status).toUpperCase()
        if (status !== bulkFuelStatus) {
          return
        }
      }

      rows.push({
        index: index + 1,
        date: req.date ? new Date(req.date).toLocaleDateString('en-GB') : '-',
        vehicle: vehicleLabel,
        odometer: req.odometer != null ? String(req.odometer) : '-',
        // ቀሪ ነዳጅ በኪ.ሜ -> remainingFuelRequest from backend
        remainingKm: req.remainingFuelRequest != null ? String(req.remainingFuelRequest) : '0',
        // በወር ውስጥ የተጓዘዉ ጠቅላላ ኪ.ሜ -> odometer + remainingFuelRequest (runningTotalKm from memo)
        totalKm: runningTotalKm > 0 ? String(runningTotalKm) : '-',
        amount: req.amount != null ? String(req.amount) : '-',
        type: req.amountType || '-',
        status: req.status || '-',
        notes: req.notes || '-',
      })
    })

    return rows
  }

  const handleExportFuelExcel = () => {
    if (typeof window === 'undefined') return
    const rows = buildFuelHistoryReport()
    if (!rows.length) return

    const header = [
      '№',
      'ቀን',
      'መኪና',
      'የተጠየቀዉ ሊትር በኪ.ሜ',
      'ቀሪ ነዳጅ በኪ.ሜ',
      'ጠቅላላ የተመዘገበ ኪ.ሜ',
      'Amount',
      'Type',
      'Status',
      'Notes',
    ]
    const csvLines = [
      header.join(','),
      ...rows.map(r => [
        r.index,
        `"${r.date}"`,
        `"${r.vehicle.replace(/"/g, '""')}"`,
        r.odometer,
        r.remainingKm,
        r.totalKm,
        r.amount,
        r.type,
        r.status,
        `"${r.notes.replace(/"/g, '""')}"`,
      ].join(',')),
    ]

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fuel-requests-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportFuelWord = () => {
    if (typeof window === 'undefined') return
    const rows = buildFuelHistoryReport()
    if (!rows.length) return

    const headerHtml = `
      <tr>
        <th>№</th>
        <th>ቀን</th>
        <th>መኪና</th>
        <th>የተጠየቀዉ ሊትር በኪ.ሜ</th>
        <th>ቀሪ ነዳጅ በኪ.ሜ</th>
        <th>ጠቅላላ የተመዘገበ ኪ.ሜ</th>
        <th>Amount</th>
        <th>Type</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>`

    const bodyHtml = rows.map(r => `
      <tr>
        <td>${r.index}</td>
        <td>${r.date}</td>
        <td>${r.vehicle}</td>
        <td>${r.odometer}</td>
        <td>${r.remainingKm}</td>
        <td>${r.totalKm}</td>
        <td>${r.amount}</td>
        <td>${r.type}</td>
        <td>${r.status}</td>
        <td>${r.notes}</td>
      </tr>`).join('')

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Recent Fuel Requests</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>
          <h1>Recent Fuel Requests</h1>
          <table>
            <thead>${headerHtml}</thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </body>
      </html>`

    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fuel-requests-${new Date().toISOString().slice(0,10)}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportFuelPdf = () => {
    if (typeof window === 'undefined') return
    const rows = buildFuelHistoryReport()
    if (!rows.length) return

    const headerHtml = `
      <tr>
        <th>№</th>
        <th>ቀን</th>
        <th>መኪና</th>
        <th>የተጠየቀዉ ሊትር በኪ.ሜ</th>
        <th>ቀሪ ነዳጅ በኪ.ሜ</th>
        <th>ጠቅላላ የተመዘገበ ኪ.ሜ</th>
        <th>Amount</th>
        <th>Type</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>`

    const bodyHtml = rows.map(r => `
      <tr>
        <td>${r.index}</td>
        <td>${r.date}</td>
        <td>${r.vehicle}</td>
        <td>${r.odometer}</td>
        <td>${r.remainingKm}</td>
        <td>${r.totalKm}</td>
        <td>${r.amount}</td>
        <td>${r.type}</td>
        <td>${r.status}</td>
        <td>${r.notes}</td>
      </tr>`).join('')

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Recent Fuel Requests</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11pt; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>
          <h1>Recent Fuel Requests</h1>
          <table>
            <thead>${headerHtml}</thead>
            <tbody>${bodyHtml}</tbody>
          </table>
        </body>
      </html>`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.open()
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="space-y-4">

      <Tabs
        value={tab}
        onValueChange={(v: string) => {
          if (v === 'fuel' || v === 'maintenance') setTab(v)
        }}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="fuel">የነዳጅ ጥያቄ ማቅረቢያ</TabsTrigger>
          <TabsTrigger value="maintenance">የመኪና ጥገና መጠየቂያ</TabsTrigger>
        </TabsList>

        <TabsContent value="fuel">
          <Card>
            <CardHeader><CardTitle>የነዳጅ መጠየቂያ</CardTitle></CardHeader>
            <CardContent>
              <Form {...fuelForm}>
                <form className="grid gap-4" onSubmit={fuelForm.handleSubmit(v => handleSubmit('FUEL', v))}>
                  <FormField control={fuelForm.control} name="vehicleId" rules={{ required: 'Vehicle is required' }} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <VehicleSelect value={field.value} onChange={field.onChange} vehicles={vehicles} />
                      </FormControl>
                      <FormDescription>{loadingVehicles ? 'Loading vehicles…' : 'Select the assigned vehicle.'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={fuelForm.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField control={fuelForm.control} name="odometer" render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Odometer <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g. 45210"
                            readOnly
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField
                      control={fuelForm.control}
                      name="amount"
                      rules={{
                        validate: (value) => {
                          const amount = Number(value)
                          const odometer = Number(fuelForm.getValues("odometer"))
                          if (!amount || amount <= 0 || !odometer || odometer <= 0) {
                            return true
                          }
                          const rate = odometer / amount
                          const target = 4.5
                          const tolerance = 0.5
                          if (Math.abs(rate - target) > tolerance) {
                            return "የኦዶሜትር እና የነዳጅ መጠን መጠናቀቂያ መጠኑ (Odometer / Fuel Amount) ከ 4.5 ጋር ቅርብ መሆን አለበት።"
                          }
                          return true
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {fuelAmountLabel} <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder={fuelAmountPlaceholder} {...field} />
                          </FormControl>
                          <FormDescription>{fuelAmountHelp}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={fuelForm.control} name="amountType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Amount Type <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <select
                            className="w-full border rounded h-9 px-2"
                            value={field.value || ''}
                            onChange={(e) => field.onChange((e.target.value || undefined) as any)}
                          >
                            <option value="">Select type</option>
                            <option value="LITER">In Liter</option>
                            <option value="COUPON">Coupon</option>
                            <option value="CASH">Cash</option>
                          </select>
                        </FormControl>
                        <FormDescription>Choose how the fuel amount is measured.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={fuelForm.control} name="fuelType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <FormControl>
                          <select
                            className="w-full border rounded h-9 px-2"
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.value || undefined)}
                          >
                            <option value="">Select fuel type</option>
                            <option value="DIESEL">Diesel</option>
                            <option value="BENZENE">Benzene</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                  <FormField control={fuelForm.control} name="currentOdometer" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Odometer Reading (Km)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 45210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={fuelForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitState.status === 'submitting' && submitState.kind === 'FUEL'}>
                      {submitState.status === 'submitting' && submitState.kind === 'FUEL' ? 'Submitting…' : 'Submit Fuel Request'}
                    </Button>
                    {submitState.kind === 'FUEL' && submitState.status === 'error' && (
                      <div className="text-sm text-red-600">{submitState.message}</div>
                    )}
                    {submitState.kind === 'FUEL' && submitState.status === 'success' && (
                      <div className="text-sm text-green-700">{submitState.message}</div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle></CardTitle></CardHeader>
            <CardContent>
              <Form {...maintForm}>
                <form className="grid gap-4" onSubmit={maintForm.handleSubmit(v => handleSubmit('MAINTENANCE', v))}>
                  <FormField control={maintForm.control} name="vehicleId" rules={{ required: 'Vehicle is required' }} render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <VehicleSelect value={field.value} onChange={field.onChange} vehicles={vehicles} />
                      </FormControl>
                      <FormDescription>{loadingVehicles ? 'Loading vehicles…' : 'Select the assigned vehicle.'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Date <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Description <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Describe maintenance needed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={maintForm.control} name="fuelLevelStatus" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Level Status</FormLabel>
                        <FormControl>
                          <select
                            className="w-full border rounded h-9 px-2"
                            value={field.value || ''}
                            onChange={e => field.onChange(e.target.value || undefined)}
                          >
                            <option value="">Select level</option>
                            <option value="FULL">Full</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW_EMPTY">Low / Empty</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                  <FormField control={maintForm.control} name="currentOdometer" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ቀሪ ነዳጅ በኪ.ሜ (Km)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 45210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="severity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Type of Accident <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <select
                          className="w-full border rounded h-9 px-2"
                          value={field.value || ''}
                          onChange={(e) => field.onChange((e.target.value || undefined) as any)}
                        >
                          <option value="">Select severity</option>
                          <option value="1">ቅድመ ጥገና</option>
                          <option value="2">ከሞተር ጋር የተገናኙ ችግሮች</option>
                          <option value="3">የብሬክ ሲስተም ጉዳዮች</option>
                          <option value="4">የኤሌክትሪክ እና የመብራት ችግሮች</option>
                          <option value="5">የጎማና ተዛማጅ ችግሮች</option>
                          <option value="6">የደህንነት እና ቁጥጥር ስርዓት ጉዳዮች</option>
                          <option value="7">የሰውነት, ውጫዊ እና ውስጣዊ ችግሮች</option>
                          <option value="8">ማቀዝቀዥ፣ ማሞቂያ እና የ AC ችግሮች</option>
                          <option value="9">ከነዳጅ ጋር የተገናኙ ችግሮች</option>
                          <option value="10">አደጋ</option>
                        </select>
                      </FormControl>
                      <FormDescription></FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitState.status === 'submitting' && submitState.kind === 'MAINTENANCE'}>
                      {submitState.status === 'submitting' && submitState.kind === 'MAINTENANCE' ? 'Submitting…' : 'Submit Maintenance Request'}
                    </Button>
                    {submitState.kind === 'MAINTENANCE' && submitState.status === 'error' && (
                      <div className="text-sm text-red-600">{submitState.message}</div>
                    )}
                    {submitState.kind === 'MAINTENANCE' && submitState.status === 'success' && (
                      <div className="text-sm text-green-700">{submitState.message}</div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {tab === 'maintenance' && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Vehicle Issue History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-sm text-muted-foreground">Loading history…</div>
            ) : history.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent requests found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-left">№</th>
                      <th className="border px-3 py-2 text-left">ቀን</th>
                      <th className="border px-3 py-2 text-left">መኪና</th>
                      <th className="border px-3 py-2 text-left">ማስታወቂያ ጊዜ</th>
                      <th className="border px-3 py-2 text-left">አይነት</th>
                      <th className="border px-3 py-2 text-left">ሁኔታ</th>
                      <th className="border px-3 py-2 text-left">መግለጫ</th>
                      <th className="border px-3 py-2 text-left">ቀሪ ነዳጅ በኪ.ሜ</th>
                      <th className="border px-3 py-2 text-left">Types of Accident</th>
                      <th className="border px-3 py-2 text-left">Fuel Level Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((req, index) => {
                      const vehicleLabel = req.vehicle
                        ? `${req.vehicle.plate || ''}${req.vehicle.make ? ` - ${req.vehicle.make}` : ''}${req.vehicle.model ? ` ${req.vehicle.model}` : ''}`.trim() || req.vehicle.id || '-'
                        : req.vehicleId || '-'

                      const scheduleTime = req.maintenanceScheduleTime
                        ? new Date(req.maintenanceScheduleTime).toLocaleString('en-GB')
                        : '-'

                      return (
                        <tr key={req.id || index} className="hover:bg-gray-50">
                          <td className="border px-3 py-2 align-top">{index + 1}</td>
                          <td className="border px-3 py-2 align-top">
                            {req.incidentDate ? new Date(req.incidentDate).toLocaleDateString('en-GB') : '-'}
                          </td>
                          <td className="border px-3 py-2 align-top">{vehicleLabel}</td>
                          <td className="border px-3 py-2 align-top">{scheduleTime}</td>
                          <td className="border px-3 py-2 align-top">MAINTENANCE</td>
                          <td className="border px-3 py-2 align-top">{req.status || 'PENDING'}</td>
                          <td
                            className="border px-3 py-2 align-top max-w-xs truncate"
                            title={req.description || ''}
                          >
                            {req.description || '-'}
                          </td>
                          <td className="border px-3 py-2 align-top">
                            {req.remainingFuelKm ?? req.remainingFuel ?? req.currentOdometer ?? '-'}
                          </td>
                          <td className="border px-3 py-2 align-top">
                            {req.accidentType || req.typesOfAccident || '-'}
                          </td>
                          <td className="border px-3 py-2 align-top">
                            {req.fuelLevelStatus || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'fuel' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Recent Fuel Requests</CardTitle>
              <div className="flex items-center gap-3 flex-wrap text-xs">
                {/* Summary chip: total fuel in liters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1 rounded-full bg-blue-500 text-white font-semibold">
                    ጠቅላላ የተቀዳ ነዳጅ በሊትር: {totalFilteredFuelLiters.toLocaleString()} L
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-gray-600">Report range:</span>
                  <select
                    className="border rounded h-8 px-2 text-xs bg-white"
                    value={fuelReportRange}
                    onChange={e => setFuelReportRange(e.target.value as any)}
                  >
                    <option value="all">All</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingFuelHistory ? (
              <div className="text-sm text-muted-foreground">Loading fuel requests…</div>
            ) : fuelHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground">No fuel requests found.</div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-4 py-2 rounded-md bg-sky-600 text-white text-sm font-semibold shadow-sm">
                      መነሻ ኪ.ሜ: {totalFuelOdometer} Km
                    </div>
                    {fuelReportRange === 'monthly' && (
                      <>
                        <div className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold shadow-sm">
                          በወር ውስጥ የተጓዘዉ ጠቅላላ ኪ.ሜ: {monthlyKmAndFuel.km} Km
                        </div>
                        <div className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-semibold shadow-sm">
                          በወር ውስጥ የተቀዳ ነዳጅ በሊትር: {monthlyKmAndFuel.liters} L
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-600 mr-1">Export:</span>
                      <select
                        className="border rounded h-8 px-2 text-xs bg-white"
                        value={fuelExportFormat}
                        onChange={e => setFuelExportFormat(e.target.value as 'excel' | 'word' | 'pdf')}
                      >
                        <option value="excel">Excel</option>
                        <option value="word">Word</option>
                        <option value="pdf">PDF</option>
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleFuelExport}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                </div>

                {fuelReportRangeLabel && (
                  <div className="text-xs text-gray-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block">
                    {fuelReportRangeLabel}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <select
                    className="border rounded h-9 px-2 text-sm"
                    value={bulkFuelStatus}
                    onChange={e => setBulkFuelStatus(e.target.value as any)}
                  >
                    <option value="">Select status</option>
                    <option value="FUELED">FUELED</option>
                    <option value="NOT_FUELED">NOT_FUELED</option>
                    <option value="HALF_FUELED">HALF_FUELED</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!bulkFuelStatus || selectedFuelIds.length === 0 || updatingFuelStatus}
                    onClick={updateSelectedFuelStatuses}
                  >
                    {updatingFuelStatus ? 'Updating…' : 'Update Status'}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {selectedFuelIds.length} selected
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={
                              fuelHistory.length > 0 &&
                              selectedFuelIds.length === fuelHistory.length
                            }
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedFuelIds(
                                  fuelHistory
                                    .map((r: any) => r.id)
                                    .filter((id: any) => typeof id === 'string'),
                                )
                              } else {
                                setSelectedFuelIds([])
                              }
                            }}
                          />
                        </th>
                        <th className="border px-3 py-2 text-left">№</th>
                        <th className="border px-3 py-2 text-left">ቀን</th>
                        <th className="border px-3 py-2 text-left">መኪና</th>
                        <th className="border px-3 py-2 text-left">የተጠየቀዉ ሊትር በኪ.ሜ</th>
                        <th className="border px-3 py-2 text-left">ቀሪ ነዳጅ በኪ.ሜ</th>
                        <th className="border px-3 py-2 text-left">ጠቅላላ የተመዘገበ ኪ.ሜ</th>
                        <th className="border px-3 py-2 text-left">Amount</th>
                        <th className="border px-3 py-2 text-left">Type</th>
                        <th className="border px-3 py-2 text-left">Status</th>
                        <th className="border px-3 py-2 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFuelHistory.map(({ req, runningTotalKm }, index) => {
                        const globalIndex = (fuelPage - 1) * FUEL_ROWS_PER_PAGE + index
                        const vehicleLabel = req.vehicle
                          ? `${req.vehicle.plate || ''}${req.vehicle.make ? ` - ${req.vehicle.make}` : ''}${req.vehicle.model ? ` ${req.vehicle.model}` : ''}`.trim() || req.vehicle.id || '-'
                          : req.vehicleId || '-'

                        const isChecked = selectedFuelIds.includes(req.id as string)

                        return (
                          <tr key={req.id || index} className="hover:bg-gray-50">
                            <td className="border px-3 py-2 align-top">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  const id = req.id as string | undefined
                                  if (!id) return
                                  setSelectedFuelIds(prev =>
                                    e.target.checked
                                      ? Array.from(new Set([...prev, id]))
                                      : prev.filter(x => x !== id),
                                  )
                                }}
                              />
                            </td>
                            <td className="border px-3 py-2 align-top">{globalIndex + 1}</td>
                            <td className="border px-3 py-2 align-top">
                              {req.date ? new Date(req.date).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="border px-3 py-2 align-top">{vehicleLabel}</td>
                            <td className="border px-3 py-2 align-top">{req.odometer ?? '-'}</td>
                            {/* ቀሪ ነዳጅ በኪ.ሜ -> show remainingFuelRequest (current odometer reading) */}
                            <td className="border px-3 py-2 align-top">{req.remainingFuelRequest ?? 0}</td>
                            {/* በወር ውስጥ የተጓዘዉ ጠቅላላ ኪ.ሜ -> odometer + remainingFuelRequest */}
                            <td className="border px-3 py-2 align-top">
                              {runningTotalKm > 0 ? `${runningTotalKm} Km` : '-'}
                            </td>
                            <td className="border px-3 py-2 align-top">{req.amount ?? '-'}</td>
                            <td className="border px-3 py-2 align-top">{req.amountType || '-'}</td>
                            <td className="border px-3 py-2 align-top">{req.status || '-'}</td>
                            <td
                              className="border px-3 py-2 align-top max-w-xs truncate"
                              title={req.notes || ''}
                            >
                              {req.notes || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                  <div>
                    Page {fuelPage} of {Math.max(1, Math.ceil(filteredFuelHistoryWithRunningTotal.length / FUEL_ROWS_PER_PAGE))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 border rounded disabled:opacity-50"
                      disabled={fuelPage <= 1}
                      onClick={() => setFuelPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 border rounded disabled:opacity-50"
                      disabled={fuelPage >= Math.ceil(filteredFuelHistoryWithRunningTotal.length / FUEL_ROWS_PER_PAGE)}
                      onClick={() =>
                        setFuelPage(p =>
                          Math.min(Math.max(1, Math.ceil(filteredFuelHistoryWithRunningTotal.length / FUEL_ROWS_PER_PAGE)), p + 1),
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
