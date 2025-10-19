'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { updateVehicle } from '@/app/lib/fleet-api'
import {
  listFleetRequests,
  approveFleetRequest,
  rejectFleetRequest,
  type FleetRequestDTO,
} from '@/app/lib/fleet-api'

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

interface Driver {
  id: string
  name: string
  licenseNumber: string
  licenseClass: string
  status: 'active' | 'inactive' | 'suspended'
  available: boolean
  assignedVehicle?: string
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
}

export default function FleetManagerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const initialTabParam = (searchParams?.get('tab') || '').toLowerCase()
  const initialTab = (['overview','vehicles','drivers','assignments','requests'] as const).includes(initialTabParam as any)
    ? (initialTabParam as 'overview' | 'vehicles' | 'drivers' | 'assignments' | 'requests')
    : 'overview'
  const [activeTab, setActiveTab] = useState<'overview' | 'vehicles' | 'drivers' | 'assignments' | 'requests'>(initialTab)
  const [savingByVehicle, setSavingByVehicle] = useState<Record<string, 'idle' | 'saving'>>({})
  const [selectedDriverByVehicle, setSelectedDriverByVehicle] = useState<Record<string, string>>({})

  // Fleet requests state
  const [requests, setRequests] = useState<FleetRequestDTO[]>([])
  const [reqLoading, setReqLoading] = useState(false)
  const [actingId, setActingId] = useState<string>('')
  // Vehicle/trip request notifications
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifItems, setNotifItems] = useState<FleetRequestDTO[]>([])
  const [seenIds, setSeenIds] = useState<Record<string, boolean>>({})

  // Documents management state (per driver)
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [driverDocs, setDriverDocs] = useState<Array<{ id: string; name: string; docType: string; uploadedAt: string; url?: string }>>([])
  const [uploadingType, setUploadingType] = useState<string>('')

  // Requests helpers (defined before useEffect)
  const loadRequests = async () => {
    try {
      setReqLoading(true)
      const items = await listFleetRequests({ status: 'PENDING' })
      setRequests(Array.isArray(items) ? items : [])
    } catch {
      setRequests([])
    } finally {
      setReqLoading(false)
    }
  }

  const actOn = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActingId(id)
      if (action === 'approve') await approveFleetRequest(id)
      else await rejectFleetRequest(id)
      await loadRequests()
    } finally {
      setActingId('')
    }
  }

  useEffect(() => {
    loadFleetData()
    loadRequests()
    // poll for new vehicle/trip requests approved for assignment
    const id = setInterval(async () => {
      try {
        const r = await fetch('/api/fleet/requests')
        const d = await r.json()
        const items: FleetRequestDTO[] = Array.isArray(d?.items) ? d.items : []
        const approved = items.filter((x:any) => String(x.status).toUpperCase() === 'APPROVED')
        const tripLike = approved.filter((x:any) => {
          const t = String(x.type||'').toUpperCase()
          const c = String(x.category||'').toUpperCase()
          const p = String(x.purpose||x.title||'').toUpperCase()
          return t.includes('TRIP') || c.includes('TRIP') || p.includes('TRIP') || t.includes('VEHICLE') || c.includes('VEHICLE')
        })
        const fresh = tripLike.filter((x:any) => !seenIds[String(x.id)])
        if (fresh.length > 0) {
          setNotifItems(fresh.slice(0,5))
          setNotifOpen(true)
          setSeenIds(prev => ({ ...prev, ...Object.fromEntries(fresh.map((f:any)=>[String(f.id), true])) }))
        }
      } catch {}
    }, 15000)
    return () => clearInterval(id)
  }, [])

  const loadFleetData = async () => {
    try {
      setLoading(true)

      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      const vv = vehiclesData.items || []
      setVehicles(vv)

      // Load drivers
      const driversRes = await fetch('/api/fleet/drivers')
      const driversData = await driversRes.json()
      const dd = driversData.items || []
      setDrivers(dd)

      // initialize selection map from current assignments if possible
      const nextSel: Record<string, string> = {}
      for (const v of vv) {
        const found = dd.find((d: any) => (d.name || '').trim() === (v.assignedTo || '').trim())
        if (found?.id) nextSel[v.id] = found.id
      }
      setSelectedDriverByVehicle(nextSel)

      // Load assignments (sample/mock)
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
        },
      ])
    } catch (error) {
      console.error('Error loading fleet data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load documents for a driver
  const loadDriverDocs = async (driverId: string) => {
    try {
      if (!driverId) return
      const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(driverId)}/documents`)
      const data = await res.json()
      setDriverDocs(Array.isArray(data.items) ? data.items : [])
    } catch {
      setDriverDocs([])
    }
  }

  const uploadDriverDoc = async (driverId: string, docType: string, file: File) => {
    if (!driverId) return alert('Select a driver first')
    try {
      setUploadingType(docType)
      const fd = new FormData()
      fd.append('docType', docType)
      fd.append('file', file)
      const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(driverId)}/documents`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      await loadDriverDocs(driverId)
    } catch (e: any) {
      alert(e?.message || 'Upload failed')
    } finally {
      setUploadingType('')
    }
  }

  // Assignment helpers
  const saveAssignment = async (vehicleId: string) => {
    try {
      setSavingByVehicle(prev => ({ ...prev, [vehicleId]: 'saving' }))
      const driverId = selectedDriverByVehicle[vehicleId] || ''
      const driver = drivers.find(d => d.id === driverId)
      const payload: any = {
        assignedTo: driver ? driver.name : '',
      }
      await updateVehicle(vehicleId, payload)
      setVehicles(prev => prev.map(v => (v.id === vehicleId ? { ...v, assignedTo: payload.assignedTo || undefined } : v)))
    } finally {
      setSavingByVehicle(prev => ({ ...prev, [vehicleId]: 'idle' }))
    }
  }

  const unassign = async (vehicleId: string) => {
    setSelectedDriverByVehicle(prev => ({ ...prev, [vehicleId]: '' }))
    await saveAssignment(vehicleId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100'
      case 'assigned': return 'text-blue-600 bg-blue-100'
      case 'maintenance': return 'text-yellow-600 bg-yellow-100'
      case 'out_of_service': return 'text-red-600 bg-red-100'
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      case 'suspended': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const stats = {
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter(v => v.status === 'available').length,
    assignedVehicles: vehicles.filter(v => v.status === 'assigned').length,
    maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.status === 'active').length,
    activeAssignments: assignments.filter(a => a.status === 'active').length,
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fleet data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fleet Manager Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage vehicles, drivers, and assignments</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/fleet/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Register Vehicle
            </Link>
            <Link href="/fleet/accessories/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
              Register Accessory
            </Link>
            <Link href="/fleet/drivers/register" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
              Register Driver
            </Link>
            <button
              type="button"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
              onClick={() => {
                setActiveTab('requests')
                setTimeout(() => {
                  const el = document.querySelector('#requests-section') as HTMLElement | null
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 0)
              }}
            >
              Assign Driver
            </button>
            <Link href="/fleet/manager/driver-management" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors">
              Driver Management
            </Link>
            <Link
              href="/fleet"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Fleet Hub
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalVehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.availableVehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Drivers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeDrivers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex items-center gap-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'vehicles', label: 'Vehicles' },
            { id: 'drivers', label: 'Drivers' },
            { id: 'assignments', label: 'Assignments' },
            { id: 'requests', label: 'Requests' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Popup: New vehicle/trip requests */}
      {notifOpen && (
        <div className="fixed top-6 right-6 z-[100] bg-white border shadow-xl rounded-lg w-[360px] max-w-[92vw]">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="font-semibold text-gray-900">New Vehicle/Trip Requests</div>
            <button onClick={()=>setNotifOpen(false)} className="text-gray-500 hover:text-gray-700 text-sm">Dismiss</button>
          </div>
          <div className="p-4 space-y-3">
            {notifItems.map((r:any)=> (
              <div key={r.id} className="border rounded p-3">
                <div className="font-medium text-gray-900">{r.purpose || r.title || `Request ${r.id}`}</div>
                <div className="text-xs text-gray-500">{new Date(r.date||r.datetime||Date.now()).toLocaleString()}</div>
                <div className="mt-2 flex items-center gap-2">
                  <a href={`/fleet/manager/assign/${encodeURIComponent(r.id)}`} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs">Assign Driver</a>
                  <button
                    className="px-2 py-1 rounded border text-xs"
                    onClick={() => {
                      setActiveTab('requests')
                      setNotifOpen(false)
                      setTimeout(()=>{
                        (document.querySelector('#requests-section') as HTMLElement | null)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 0)
                    }}
                  >View Requests</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Recent Assignments */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Recent Assignments</h3>
            </div>
            <div className="p-6">
              {assignments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No assignments found</p>
              ) : (
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
                    const driver = drivers.find(d => d.id === assignment.driverId)
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{vehicle?.make} {vehicle?.model} - {vehicle?.licensePlate}</p>
                          <p className="text-sm text-gray-600">Assigned to {driver?.name} ({assignment.department})</p>
                          <p className="text-sm text-gray-500">Purpose: {assignment.purpose}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status || 'unknown')}`}>
                          {assignment.status || 'unknown'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Status Summary */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Vehicle Status Summary</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.availableVehicles}</div>
                  <div className="text-sm text-gray-600">Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.assignedVehicles}</div>
                  <div className="text-sm text-gray-600">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.maintenanceVehicles}</div>
                  <div className="text-sm text-gray-600">Maintenance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.totalVehicles - stats.availableVehicles - stats.assignedVehicles - stats.maintenanceVehicles}
                  </div>
                  <div className="text-sm text-gray-600">Out of Service</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/fleet/register" className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Register Vehicle</div>
                      <div className="text-sm text-gray-500">Add new vehicle to fleet</div>
                    </div>
                  </div>
                </Link>

                <Link href="/fleet/accessories/register" className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Register Accessory</div>
                      <div className="text-sm text-gray-500">Add fleet accessories</div>
                    </div>
                  </div>
                </Link>

                <Link href="/fleet/drivers/register" className="p-4 border rounded-lg hover:bg-gray-50 text-left transition-colors">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Register Driver</div>
                      <div className="text-sm text-gray-500">Add new driver</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div id="requests-section" className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Pending Fleet Requests (Manager)</h3>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={loadRequests}
                disabled={reqLoading}
              >
                {reqLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              {requests.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No pending requests.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests
                      .filter(r => r.type === 'ISSUE' || r.type === 'MAINTENANCE')
                      .map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{r.type}</span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(r.date).toLocaleString()}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{r.vehicleId || '-'}</td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            <div>{r.description || '-'}</div>
                            {r.severity && <div className="text-xs text-gray-500">Severity: {String(r.severity)}</div>}
                            {typeof r.cost !== 'undefined' && <div className="text-xs text-gray-500">Est. Cost: {r.cost}</div>}
                            {Array.isArray((r as any).attachments) && (r as any).attachments.length > 0 && (
                              <div className="mt-2 text-xs">
                                <div className="text-gray-600 font-medium">Attachments:</div>
                                <ul className="list-disc pl-5">
                                  {(r as any).attachments.map((a: any, idx: number) => (
                                    <li key={idx}>
                                      {a?.url ? (
                                        <a
                                          href={a.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 hover:underline"
                                        >
                                          {a?.name || `File ${idx + 1}`}
                                        </a>
                                      ) : (
                                        <span className="text-gray-700">{a?.name || `File ${idx + 1}`}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <button
                              className="text-green-600 hover:text-green-800 mr-3 disabled:opacity-50"
                              onClick={() => actOn(r.id, 'approve')}
                              disabled={actingId === r.id}
                            >
                              Approve
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              onClick={() => actOn(r.id, 'reject')}
                              disabled={actingId === r.id}
                            >
                              Reject
                            </button>
                            <Link
                              href={`/fleet/manager/assign/${encodeURIComponent(r.id)}`}
                              className="ml-3 text-blue-600 hover:text-blue-800"
                            >
                              Assign
                            </Link>
                            <Link
                              href={`/finance/tco?requestId=${encodeURIComponent(r.id)}`}
                              className="ml-3 text-indigo-600 hover:text-indigo-800"
                            >
                              Compute TCO
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'vehicles' && (
        <div id="vehicles-section" className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Vehicle Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handover/Return</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicles.map(vehicle => (
                  <tr key={vehicle.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vehicle.make} {vehicle.model}</div>
                        <div className="text-sm text-gray-500">{vehicle.year} • {vehicle.fuelType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/fleet/manager/vehicles/handover/${encodeURIComponent(vehicle.id)}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Open Form
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vehicle.licensePlate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vehicle.status || 'unknown')}`}>
                        {(vehicle.status || 'unknown').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vehicle.assignedTo || 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded h-9 px-2"
                          value={selectedDriverByVehicle[vehicle.id] || ''}
                          onChange={e => setSelectedDriverByVehicle(prev => ({ ...prev, [vehicle.id]: e.target.value }))}
                        >
                          <option value="">Unassigned</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded disabled:opacity-50"
                          onClick={() => saveAssignment(vehicle.id)}
                          disabled={savingByVehicle[vehicle.id] === 'saving'}
                        >
                          {savingByVehicle[vehicle.id] === 'saving' ? 'Saving…' : 'Save'}
                        </button>
                        {selectedDriverByVehicle[vehicle.id] && (
                          <button
                            className="text-red-600 hover:text-red-800 px-2 py-1"
                            onClick={() => unassign(vehicle.id)}
                            disabled={savingByVehicle[vehicle.id] === 'saving'}
                          >
                            Unassign
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'drivers' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Driver Management</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map(driver => (
                  <tr key={driver.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driver.licenseNumber}</div>
                      <div className="text-sm text-gray-500">{driver.licenseClass}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(driver.status || 'unknown')}`}>
                        {driver.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.assignedVehicle ? vehicles.find(v => v.id === driver.assignedVehicle)?.licensePlate : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-900 mr-3">Remove</button>
                      <button
                        className="text-purple-600 hover:text-purple-900"
                        onClick={() => {
                          const id = driver.id
                          setSelectedDriverId(id)
                          loadDriverDocs(id)
                          setTimeout(() => {
                            document.getElementById('driver-docs-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }, 50)
                        }}
                      >
                        Manage Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Documents panel */}
          <div id="driver-docs-panel" className="px-6 py-4 border-t">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Driver Documents</h4>
            {!selectedDriverId ? (
              <div className="text-sm text-gray-500">Select a driver and click "Manage Documents" to upload or view attachments.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">Driver ID: <span className="font-mono font-medium">{selectedDriverId}</span></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Educational paper</div>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      disabled={uploadingType === 'educational_paper'}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadDriverDoc(selectedDriverId, 'educational_paper', f)
                        e.currentTarget.value = ''
                      }}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">License certificate</div>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      disabled={uploadingType === 'license_certificate'}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadDriverDoc(selectedDriverId, 'license_certificate', f)
                        e.currentTarget.value = ''
                      }}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Any documents</div>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      disabled={uploadingType === 'other_documents'}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadDriverDoc(selectedDriverId, 'other_documents', f)
                        e.currentTarget.value = ''
                      }}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-medium mb-2">Agreement paper</div>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      disabled={uploadingType === 'agreement_paper'}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadDriverDoc(selectedDriverId, 'agreement_paper', f)
                        e.currentTarget.value = ''
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Uploaded</h5>
                  {driverDocs.length === 0 ? (
                    <div className="text-sm text-gray-500">No documents uploaded yet.</div>
                  ) : (
                    <ul className="divide-y">
                      {driverDocs.map(d => (
                        <li key={d.id} className="py-2 text-sm flex items-center justify-between">
                          <div>
                            <div className="font-medium">{d.name}</div>
                            <div className="text-gray-500">{d.docType} • {new Date(d.uploadedAt).toLocaleString()}</div>
                          </div>
                          {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Assignment Management</h3>
          </div>
          <div className="p-6">
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assignments found</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
                  const driver = drivers.find(d => d.id === assignment.driverId)
                  return (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})
                          </h4>
                          <p className="text-sm text-gray-600">Assigned to: {driver?.name}</p>
                          <p className="text-sm text-gray-500">Department: {assignment.department}</p>
                          <p className="text-sm text-gray-500">Purpose: {assignment.purpose}</p>
                          <p className="text-sm text-gray-500">Date: {assignment.assignedDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status || 'unknown')}`}>
                            {assignment.status || 'unknown'}
                          </span>
                          <div className="mt-2 space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 text-sm">Edit</button>
                            <button className="text-red-600 hover:text-red-900 text-sm">Cancel</button>
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
    </div>
  )
}