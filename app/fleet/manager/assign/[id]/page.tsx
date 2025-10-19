'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateVehicle } from '@/app/lib/fleet-api'

interface FleetRequest {
  id: string
  type?: string
  category?: string
  date?: string
  datetime?: string
  status?: string
  department?: string
  vehicleId?: string
  description?: string
  purpose?: string
  title?: string
}

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

export default function AssignDriverPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const requestId = params?.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [request, setRequest] = useState<FleetRequest | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')
  const [scheduleDate, setScheduleDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  // Trip details and process controls
  const [pickupLocation, setPickupLocation] = useState<string>('')
  const [dropoffLocation, setDropoffLocation] = useState<string>('')
  const [tripPurpose, setTripPurpose] = useState<string>('')
  const [passengers, setPassengers] = useState<number>(1)
  const [specialReq, setSpecialReq] = useState<string>('')
  const [approvalConfirmed, setApprovalConfirmed] = useState<boolean>(false)
  const [suitabilityNotes, setSuitabilityNotes] = useState<string>('')
  const [notifyDriver, setNotifyDriver] = useState<boolean>(true)
  const [notifyEmployee, setNotifyEmployee] = useState<boolean>(true)
  const [employeeName, setEmployeeName] = useState<string>('')
  const [employeeDepartment, setEmployeeDepartment] = useState<string>('')
  const [driverContact, setDriverContact] = useState<string>('')
  const [employeeContact, setEmployeeContact] = useState<string>('')
  const [preTripChecked, setPreTripChecked] = useState<boolean>(false)
  const [enableMonitoring, setEnableMonitoring] = useState<boolean>(false)
  // Pre-trip checklist individual items
  const [preTripInspection, setPreTripInspection] = useState<boolean>(false)
  const [preTripFuel, setPreTripFuel] = useState<boolean>(false)
  const [preTripTires, setPreTripTires] = useState<boolean>(false)
  const [preTripLights, setPreTripLights] = useState<boolean>(false)
  const [preTripClean, setPreTripClean] = useState<boolean>(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Load request (try by id endpoint, fallback to list and find)
        let req: FleetRequest | null = null
        try {
          const r = await fetch(`/api/fleet/requests/${encodeURIComponent(requestId)}`)
          if (r.ok) {
            const d = await r.json()
            req = (d && (d.item || d.data)) || null
          }
        } catch {}
        if (!req) {
          try {
            const rr = await fetch('/api/fleet/requests')
            const dd = await rr.json()
            const items: FleetRequest[] = Array.isArray(dd?.items) ? dd.items : []
            req = items.find(x => String(x.id) === String(requestId)) || null
          } catch {}
        }
        setRequest(req)

        // Load vehicles and drivers
        const [vRes, dRes] = await Promise.all([
          fetch('/api/fleet/vehicles'),
          fetch('/api/fleet/drivers'),
        ])
        const vData = await vRes.json()
        const dData = await dRes.json()
        const vv: Vehicle[] = vData.items || []
        const dd: Driver[] = dData.items || []
        setVehicles(vv)
        setDrivers(dd)

        // Preselect if request hints exist
        if (req?.vehicleId) setSelectedVehicleId(req.vehicleId)
        // Prefill from request when possible
        if (req) {
          setTripPurpose(req.purpose || req.description || req.title || '')
          setEmployeeDepartment(req.department || '')
        }
      } finally {
        setLoading(false)
      }
    }
    if (requestId) load()
  }, [requestId])

  const availableVehicles = useMemo(
    () => vehicles.filter(v => v.status === 'available' || (!v.assignedTo && v.status !== 'out_of_service')),
    [vehicles]
  )
  const availableDrivers = useMemo(
    () => drivers.filter(d => d.status === 'active'),
    [drivers]
  )

  // Simple driver auto-suggest heuristic
  const suggestDriverId = useMemo(() => {
    if (availableDrivers.length === 0) return ''
    return availableDrivers
      .map(d => {
        let score = 0
        if (d.status === 'active') score += 2
        if (d.available) score += 1
        if (!d.assignedVehicle) score += 1
        // Future: add geo familiarity, vehicle type, past performance
        return { id: d.id, score }
      })
      .sort((a,b) => b.score - a.score)[0].id
  }, [availableDrivers])

  useEffect(() => {
    // Preselect suggested driver if none chosen yet
    if (!selectedDriverId && suggestDriverId) setSelectedDriverId(suggestDriverId)
  }, [suggestDriverId, selectedDriverId])

  // Inline error handling
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isPhone = (v: string) => /(^[+]?\d{7,15}$)|(^\d{3}[- ]?\d{3}[- ]?\d{4}$)/.test((v||'').trim())
  const isEmail = (v: string) => /.+@.+\..+/.test((v||'').trim())

  const assign = async () => {
    if (!selectedVehicleId || !selectedDriverId) {
      setErrors(prev => ({ ...prev, vehicle: !selectedVehicleId ? 'Select a vehicle' : '', driver: !selectedDriverId ? 'Select a driver' : '' }))
      return
    }
    if (!pickupLocation || !dropoffLocation || !tripPurpose) {
      setErrors(prev => ({
        ...prev,
        pickupLocation: !pickupLocation ? 'Pickup location is required' : '',
        dropoffLocation: !dropoffLocation ? 'Drop-off location is required' : '',
        tripPurpose: !tripPurpose ? 'Purpose is required' : ''
      }))
      return
    }
    if (!approvalConfirmed) {
      setErrors(prev => ({ ...prev, approval: 'Approval must be confirmed' }))
      return
    }
    if (!scheduleDate) {
      // Not strictly required, but helpful
      // Surface a soft warning inline
      setErrors(prev => ({ ...prev, scheduleDate: 'No date/time set (optional)' }))
    }
    try {
      setSaving(true)
      // Persist vehicle assignment via driverId field expected by API
      await updateVehicle(selectedVehicleId, { driverId: selectedDriverId })

      // Create assignment record (optional but useful)
      try {
        await fetch('/api/fleet/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId,
            vehicleId: selectedVehicleId,
            driverId: selectedDriverId,
            scheduleDate: scheduleDate || undefined,
            notes,
            trip: {
              dateTime: scheduleDate || undefined,
              pickupLocation,
              dropoffLocation,
              purpose: tripPurpose,
              passengers,
              specialRequirements: specialReq,
            },
            approvals: { confirmed: approvalConfirmed },
            suitability: { notes: suitabilityNotes },
            communication: {
              notifyDriver,
              notifyEmployee,
              employeeName,
              employeeDepartment,
              driverContact,
            },
            preTrip: {
              checked: preTripChecked,
              items: {
                inspection: preTripInspection,
                fuel: preTripFuel,
                tires: preTripTires,
                lights: preTripLights,
                clean: preTripClean,
              },
            },
            monitoring: { enabled: enableMonitoring },
          }),
        })
      } catch {}

      // Patch original request with selected vehicle/driver for traceability
      try {
        await fetch(`/api/fleet/requests/${encodeURIComponent(requestId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: selectedVehicleId, driverId: selectedDriverId }),
        })
      } catch {}

      // Notify manager approval/schedule endpoint if exists
      try {
        await fetch('/api/fleet/approvals/manager', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, status: 'SCHEDULED', date: scheduleDate || undefined, notes: notes || undefined, vehicleId: selectedVehicleId, driverId: selectedDriverId }),
        })
      } catch {}
      // Fire notifications (email/SMS) if toggled and we have contact info
      try {
        if (notifyDriver && driverContact) {
          if (isPhone(driverContact)) {
            await fetch('/api/sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: driverContact,
                body: `Assigned trip ${requestId}: Pickup ${pickupLocation} -> ${dropoffLocation}, When: ${scheduleDate || 'TBD'}.`
              }),
            })
          } else if (isEmail(driverContact)) {
            await fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: driverContact,
                subject: `Trip Assignment for Request ${requestId}`,
                html: `<div>You have been assigned to a trip.<br/>Pickup: ${pickupLocation}<br/>Drop-off: ${dropoffLocation}<br/>When: ${scheduleDate || 'TBD'}<br/>Special: ${specialReq || '-'}</div>`,
              }),
            })
          }
        }
        if (notifyEmployee && (employeeContact || employeeName)) {
          if (employeeContact && isPhone(employeeContact)) {
            await fetch('/api/sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: employeeContact,
                body: `Driver assigned for request ${requestId}. Pickup ${pickupLocation} @ ${scheduleDate || 'TBD'}. Vehicle: ${selectedVehicleId}.`
              }),
            })
          } else if (employeeContact && isEmail(employeeContact)) {
            await fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: employeeContact,
                subject: `Driver Assigned for Request ${requestId}`,
                html: `<div>Driver assigned. Vehicle: ${selectedVehicleId}<br/>Pickup: ${pickupLocation}<br/>Time: ${scheduleDate || 'TBD'}<br/>Driver contact: ${driverContact || '-'}</div>`,
              }),
            })
          }
        }
      } catch {}

      // Show a lightweight inline success (fallback to alert for now)
      // You could replace this with a toast component
      // eslint-disable-next-line no-alert
      alert('Assignment saved')
      router.push('/fleet/manager')
    } catch (e: any) {
      alert(e?.message || 'Failed to assign')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading request...</div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Link href="/fleet/manager" className="text-blue-600 hover:underline">← Back to Manager</Link>
        </div>
        <div className="p-6 bg-white border rounded-lg">Request not found.</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assign Driver & Vehicle</h1>
          <p className="text-gray-600 mt-1">Request #{request.id} • {request.type || request.category || 'Request'} • {request.department || 'Department'}</p>
        </div>
        <Link href="/fleet/manager" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">Back</Link>
      </div>

      {/* Request summary */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Request Summary</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Type</div>
            <div className="font-medium">{request.type || request.category || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">Status</div>
            <div className="font-medium">{request.status || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">Department</div>
            <div className="font-medium">{request.department || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500">Requested Date</div>
            <div className="font-medium">{new Date(request.date || request.datetime || '').toLocaleString()}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-gray-500">Details</div>
            <div className="font-medium">{request.description || request.purpose || request.title || '-'}</div>
          </div>
        </div>
      </div>

      {/* Assignment form */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Assignment</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Receive & Verify Employee Request / Trip details */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Trip Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Date/Time</label>
                <input type="datetime-local" className="border rounded w-full h-10 px-3" value={scheduleDate} onChange={e=>setScheduleDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Passengers</label>
                <input type="number" min={1} className="border rounded w-full h-10 px-3" value={passengers} onChange={e=>setPassengers(Number(e.target.value)||1)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Pickup Location</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={pickupLocation} onChange={e=>setPickupLocation(e.target.value)} placeholder="e.g., HQ Gate" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Drop-off Location</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={dropoffLocation} onChange={e=>setDropoffLocation(e.target.value)} placeholder="e.g., Training Center" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Purpose of Trip</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={tripPurpose} onChange={e=>setTripPurpose(e.target.value)} placeholder="e.g., Field inspection" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Special Requirements</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={specialReq} onChange={e=>setSpecialReq(e.target.value)} placeholder="e.g., equipment, accessibility" />
              </div>
            </div>
          </div>

          {/* Approvals */}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={approvalConfirmed} onChange={e=>setApprovalConfirmed(e.target.checked)} />
              <span className="text-sm">Approval confirmed from relevant authority (e.g., department head)</span>
            </label>
            {errors.approval && <div className="text-xs text-red-600 mt-1">{errors.approval}</div>}
          </div>

          {/* Suitability notes */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Suitability</h4>
            <textarea className="border rounded w-full p-3" rows={3} value={suitabilityNotes} onChange={e=>setSuitabilityNotes(e.target.value)} placeholder="Notes on driver experience, location familiarity, vehicle type experience, past performance..." />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Vehicle</label>
            <select className="border rounded w-full h-10 px-3" value={selectedVehicleId} onChange={e=>{ setSelectedVehicleId(e.target.value); setErrors(s=>({ ...s, vehicle: '' })) }}>
              <option value="">-- Select Vehicle --</option>
              {availableVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.licensePlate} • {v.make} {v.model} ({v.year})</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">Only available vehicles are listed.</div>
            {errors.vehicle && <div className="text-xs text-red-600 mt-1">{errors.vehicle}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Driver</label>
            <select className="border rounded w-full h-10 px-3" value={selectedDriverId} onChange={e=>{ setSelectedDriverId(e.target.value); setErrors(s=>({ ...s, driver: '' })) }}>
              <option value="">-- Select Driver --</option>
              {availableDrivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.driver && <div className="text-xs text-red-600 mt-1">{errors.driver}</div>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Notes (optional)</label>
            <input type="text" className="border rounded w-full h-10 px-3" placeholder="Notes..." value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>

          {/* Communication */}
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Communication</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" checked={notifyDriver} onChange={e=>setNotifyDriver(e.target.checked)} />
                <span className="text-sm">Notify Driver (schedule, route, special instructions)</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4" checked={notifyEmployee} onChange={e=>setNotifyEmployee(e.target.checked)} />
                <span className="text-sm">Notify Employee (driver contact, vehicle, pickup time/location)</span>
              </label>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Employee Name</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={employeeName} onChange={e=>setEmployeeName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Employee Department</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={employeeDepartment} onChange={e=>setEmployeeDepartment(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Driver Contact</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={driverContact} onChange={e=>setDriverContact(e.target.value)} placeholder="e.g., phone number" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Employee Contact (email or phone)</label>
                <input type="text" className="border rounded w-full h-10 px-3" value={employeeContact} onChange={e=>setEmployeeContact(e.target.value)} placeholder="e.g., +2519..., or name@org.gov" />
              </div>
            </div>
          </div>

          {/* Pre-trip checks */
          }
          <div className="md:col-span-2">
            <h4 className="font-semibold mb-2">Pre-Trip Checks by Driver</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={preTripInspection} onChange={e=>setPreTripInspection(e.target.checked)} /> Vehicle inspection completed</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={preTripFuel} onChange={e=>setPreTripFuel(e.target.checked)} /> Fuel level confirmed</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={preTripTires} onChange={e=>setPreTripTires(e.target.checked)} /> Tire pressure checked</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={preTripLights} onChange={e=>setPreTripLights(e.target.checked)} /> Lights functioning</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="h-4 w-4" checked={preTripClean} onChange={e=>setPreTripClean(e.target.checked)} /> Cleanliness ensured</label>
            </div>
            <label className="inline-flex items-center gap-2 mt-2">
              <input type="checkbox" className="h-4 w-4" checked={preTripChecked} onChange={e=>setPreTripChecked(e.target.checked)} />
              <span className="text-sm">Driver signed off on vehicle check-out log</span>
            </label>
          </div>

          {/* Monitoring toggle and suitability hints */}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4" checked={enableMonitoring} onChange={e=>setEnableMonitoring(e.target.checked)} />
              <span className="text-sm">Enable trip monitoring (if available)</span>
            </label>
            <div className="mt-3 text-sm text-gray-600">
              <div className="font-medium">Driver suitability hints:</div>
              <ul className="list-disc pl-5">
                <li>Prefer drivers marked Active.</li>
                <li>Vehicle compatibility: choose driver experienced with {tripPurpose ? `'${tripPurpose}'` : 'the trip type'}.</li>
                <li>Consider familiarity with pickup/drop-off areas.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Link href="/fleet/manager" className="px-4 py-2 border rounded-lg">Cancel</Link>
          <button onClick={assign} disabled={saving || !selectedVehicleId || !selectedDriverId} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  )
}
