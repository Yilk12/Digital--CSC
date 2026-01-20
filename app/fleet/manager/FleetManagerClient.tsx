'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/app/components/toast-provider'
import { Vehicle, Driver, Assignment, FleetRequestDTO, AssignmentRequest } from '@/app/components/fleet-manager/types'
import OverviewTab from '@/app/components/fleet-manager/OverviewTab'
import VehiclesTab from '@/app/components/fleet-manager/VehiclesTab'
import DriversTab from '@/app/components/fleet-manager/DriversTab'
import AssignmentsTab from '@/app/components/fleet-manager/AssignmentsTab'
import RequestsTab from '@/app/components/fleet-manager/RequestsTab'
import MaintainedTab from '@/app/components/fleet-manager/MaintainedTab'
import ServicedTab from '@/app/components/fleet-manager/ServicedTab'

export default function FleetManagerClient() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [requests, setRequests] = useState<FleetRequestDTO[]>([])
  const [assignmentRequests, setAssignmentRequests] = useState<AssignmentRequest[]>([])
  const [serviceRegistrations, setServiceRegistrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<
    'overview' | 'vehicles' | 'drivers' | 'assignments' | 'requests' | 'maintained' | 'serviced'
  >('overview')
  const { show: toast } = useToast()

  // Initialize active tab from URL ?tab=...
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const sp = new URLSearchParams(window.location.search)
      const tabParam = (sp.get('tab') || '').toLowerCase()
      const allowed = [
        'overview',
        'vehicles',
        'drivers',
        'assignments',
        'requests',
        'maintained',
        'serviced',
      ] as const
      if (allowed.includes(tabParam as any)) {
        setActiveTab(tabParam as any)
      }
    } catch {}
  }, [])

  const loadServiceRegistrations = async () => {
    try {
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') ||
        ''

      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const url = apiBase
        ? `${apiBase}/api/fleet/service-registrations`
        : '/api/fleet/service-registrations'

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!res.ok) {
        console.error('Failed to load service registrations', await res.text())
        setServiceRegistrations([])
        return
      }

      const data = await res.json()
      const items: any[] = Array.isArray(data) ? data : data?.items || data?.data || []
      setServiceRegistrations(items || [])
    } catch (err) {
      console.error('Error fetching service registrations:', err)
      setServiceRegistrations([])
    }
  }

  const activeServiceRegistrationsCount = Array.isArray(serviceRegistrations)
    ? serviceRegistrations.filter((r: any) => {
        if (!r) return false

        const rawStatus = (r.status || '').toString().toUpperCase().trim()

        // Explicitly exclude COMPLETED (or any other non-active) statuses
        if (rawStatus === 'COMPLETED' || rawStatus === 'DONE' || rawStatus === 'FINISHED') {
          return false
        }

        // Only treat PENDING / IN_PROGRESS / empty as potentially active
        const isActiveStatus =
          rawStatus === 'PENDING' || rawStatus === 'IN_PROGRESS' || rawStatus === ''

        if (!isActiveStatus) return false

        // If serviceEnd is in the past, also treat as no longer active
        const endRaw: string | undefined = (r as any).serviceEnd
        if (endRaw) {
          const end = new Date(endRaw)
          if (!Number.isNaN(end.getTime())) {
            const now = new Date()
            if (now >= end) return false
          }
        }

        return true
      }).length
    : 0

  const servicedVehiclesCount = Array.isArray(serviceRegistrations)
    ? serviceRegistrations.filter((r: any) => {
        if (!r) return false

        const rawStatus = (r.status || '').toString().toUpperCase().trim()

        // 1) If status text clearly indicates completion, count it.
        if (
          rawStatus === 'COMPLETED' ||
          rawStatus === 'DONE' ||
          rawStatus === 'FINISHED' ||
          rawStatus === 'APPROVED' ||
          rawStatus === 'COMPLETE'
        ) {
          return true
        }

        // 2) If status is missing/unclear but serviceEnd is in the past,
        // also treat as completed.
        const endRaw: string | undefined = (r as any).serviceEnd
        if (endRaw) {
          const end = new Date(endRaw)
          if (!Number.isNaN(end.getTime())) {
            const now = new Date()
            if (now >= end) return true
          }
        }

        return false
      }).length
    : 0

  const stats = {
    totalVehicles: Array.isArray(vehicles) ? vehicles.length : 0,
    availableVehicles: Array.isArray(vehicles)
      ? vehicles.filter((v) => v?.status === 'available').length
      : 0,
    assignedVehicles: Array.isArray(vehicles)
      ? vehicles.filter((v) => v?.status === 'assigned').length
      : 0,
    // Number of vehicles currently registered "on service" based on
    // Service Registration History (pending or in-progress records).
    maintenanceVehicles: activeServiceRegistrationsCount,
    totalDrivers: Array.isArray(drivers) ? drivers.length : 0,
    activeDrivers: Array.isArray(drivers) ? drivers.filter((d) => d?.isActive).length : 0,
    activeAssignments: Array.isArray(assignments)
      ? assignments.filter((a) => a?.status === 'active').length
      : 0,
  }

  const assignedVehiclesCount = Array.isArray(assignmentRequests)
    ? assignmentRequests.reduce((sum, req) => sum + (req.vehicles ? req.vehicles.length : 0), 0)
    : 0

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const token =
        localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') ||
        ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      setVehicles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error fetching vehicles:', err)
      setFetchError('Failed to load vehicles. Please try again later.')
      setVehicles([])
      toast({
        title: 'Error',
        description: 'Failed to load vehicles. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadDrivers = async () => {
    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/driver`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const data = await res.json()
      const driversData = data.data || data.items || data.drivers || data || []
      setDrivers(driversData)
    } catch (err) {
      console.error('Error fetching drivers:', err)
      toast({ title: 'Error', description: 'Failed to load drivers.', variant: 'destructive' })
    }
  }

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('accessToken') || ''
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/requests/approved`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) throw new Error(`Error: ${res.status}`)
      const data = await res.json()
      const arr = (data?.data || data?.items || data) as any
      const list: FleetRequestDTO[] = Array.isArray(arr) ? arr : []
      setRequests(list)
    } catch (err) {
      console.error('Error fetching approved requests:', err)
      toast({
        title: 'Error',
        description: 'Failed to load approved requests.',
        variant: 'destructive',
      })
    }
  }

  const loadAssignmentDetails = async () => {
    try {
      const token = localStorage.getItem('accessToken') || ''
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const res = await fetch(
        `${apiBase}/api/fleet/requests/summary`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      )
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      const arr = (data?.data || data?.items || []) as any
      console.log("========================",arr)
      const list: AssignmentRequest[] = Array.isArray(arr) ? arr : []
      setAssignmentRequests((prev) => {
        const map = new Map<string | number, AssignmentRequest>()

        ;(prev || []).forEach((req) => {
          if (req) map.set(req.id, req)
        })

        list.forEach((req) => {
          if (req) map.set(req.id, req)
        })

        return Array.from(map.values())
      })
    } catch (err) {
      console.error('Error fetching assignment details:', err)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchVehicles(),
        loadDrivers(),
        loadRequests(),
        loadAssignmentDetails(),
        loadServiceRegistrations(),
      ])
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fleet data...</div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{fetchError}</p>
          <button
            onClick={fetchVehicles}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Link
                href="/fleet/vehicleAdd"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                መኪና ይመዝግቡ
              </Link>
              <button
                type="button"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => setActiveTab('requests')}
              >
                ሹፌር ይመድቡ
              </button>
              <button
                type="button"
                onClick={() => router.push('/finance/fleet-costs')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ጠቅላላ የመኪና ወጪ መመዝገቢያ
              </button>
              <Link
                href="/fleet/manager/fuel-requests"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                የመጡ የነዳጅ ጥያቄዎች
              </Link>
              <Link
                href="/fleet/manager/maintenance"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Maintenance request
              </Link>
              <button
                type="button"
                onClick={() => router.push('/fleet/manager/reports')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ጠቅላላ ሪፖርት
              </button>
            </div>
          </div>
          <div className="flex-none ml-4">
            <Link
              href="/fleet"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← ወደኋላ ይመለሱ
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className="bg-[#B0E0E6] p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('vehicles')
            router.push('/fleet/manager?tab=vehicles')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ጠቅላላ የተመዘገበ መኪና</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalVehicles}</p>
            </div>
          </div>
        </div>

        <div
          className="bg-[#B0E0E6] p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('requests')
            router.push('/fleet/manager?tab=requests')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">የመኪና ጥያቄዎቸ</p>
              <p className="text-2xl font-semibold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>

        <div
          className="bg-[#B0E0E6] p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('drivers')
            router.push('/fleet/manager?tab=drivers&status=unassigned')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-9-5.197"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">መስክ ላይ ያልሆኑ ሹፌሮች</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeDrivers}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Additional Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div
          className="bg-[#B0E0E6] p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('assignments')
            router.push('/fleet/manager?tab=assignments')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">የተመደበ መኪና</p>
              <p className="text-2xl font-semibold text-gray-900">{assignedVehiclesCount}</p>
            </div>
          </div>
        </div>

        <div
          className="bg-[#B0E0E6] p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/fleet/service-time')}
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ሰርቪስ ላይ ያሉ መኪኖች</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.maintenanceVehicles}</p>
            </div>
          </div>
        </div>

        <div
          className="bg-[#B0E0E6] p-6 rounded-lg shadow border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            setActiveTab('serviced')
            router.push('/fleet/manager?tab=serviced')
          }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ሰርቪስ የተደረገላቸዉ መኪኖች</p>
              <p className="text-2xl font-semibold text-gray-900">{servicedVehiclesCount}</p>
            </div>
          </div>
        </div>

      </div>

      {activeTab === 'overview' && (
        <OverviewTab vehicles={vehicles} drivers={drivers} assignments={assignments} stats={stats} />
      )}

      {activeTab === 'vehicles' && (
        <VehiclesTab
          vehicles={vehicles}
          drivers={drivers}
          assignments={assignmentRequests}
          serviceRegistrations={serviceRegistrations}
          onVehiclesUpdate={setVehicles}
        />
      )}

      {activeTab === 'drivers' && <DriversTab drivers={drivers} onDriversUpdate={setDrivers} />}

      {activeTab === 'requests' && (
        <RequestsTab requests={requests} onRequestsUpdate={setRequests} />
      )}

      {activeTab === 'assignments' && (
        <AssignmentsTab
          requests={assignmentRequests}
          onAssignmentsUpdate={setAssignmentRequests}
        />
      )}

      {activeTab === 'maintained' && (
        <MaintainedTab vehicles={vehicles} onVehiclesUpdate={setVehicles} />
      )}

      {activeTab === 'serviced' && <ServicedTab />}
    </div>
  )
}
