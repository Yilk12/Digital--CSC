'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Vehicle { id: string; make?: string; model?: string; plate?: string; licensePlate?: string }

type FormType = 'HANDOVER' | 'RETURN'

type AssignmentType = 'WITH_DRIVER' | 'FREE_VEHICLE'

export default function VehicleHandoverPage({ params }: { params: { id: string } }) {
  const vehicleId = params.id
  const router = useRouter()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  // Form state
  const [formType, setFormType] = useState<FormType>('HANDOVER')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('WITH_DRIVER')

  // Vehicle info
  const [vehicleMakeModel, setVehicleMakeModel] = useState('')
  const [vehicleReg, setVehicleReg] = useState('')
  const [odometer, setOdometer] = useState<string>('')
  const [fuelLevelPct, setFuelLevelPct] = useState<string>('')
  const [vehicleCondition, setVehicleCondition] = useState<'GOOD'|'MINOR_DAMAGE'|'NEEDS_MAINTENANCE'|''>('')
  const [accJack, setAccJack] = useState(false)
  const [accSpare, setAccSpare] = useState(false)
  const [accTools, setAccTools] = useState(false)
  const [accFireExt, setAccFireExt] = useState(false)
  const [accFirstAid, setAccFirstAid] = useState(false)

  // Driver info
  const [drvName, setDrvName] = useState('')
  const [drvLicense, setDrvLicense] = useState('')
  const [drvContact, setDrvContact] = useState('')
  const [drvSignature, setDrvSignature] = useState('')

  // Recipient info
  const [rcpName, setRcpName] = useState('')
  const [rcpDept, setRcpDept] = useState('')
  const [rcpContact, setRcpContact] = useState('')
  const [rcpSignature, setRcpSignature] = useState('')
  const [rcpDateTime, setRcpDateTime] = useState<string>('')

  // Supervisor
  const [supName, setSupName] = useState('')
  const [supSignature, setSupSignature] = useState('')
  const [supDateTime, setSupDateTime] = useState<string>('')

  // Checklist items
  const [chkExterior, setChkExterior] = useState(false)
  const [noteExterior, setNoteExterior] = useState('')
  const [chkInterior, setChkInterior] = useState(false)
  const [noteInterior, setNoteInterior] = useState('')
  const [chkFuel, setChkFuel] = useState(false)
  const [noteFuel, setNoteFuel] = useState('')
  const [chkOdom, setChkOdom] = useState(false)
  const [noteOdom, setNoteOdom] = useState('')
  const [chkTools, setChkTools] = useState(false)
  const [noteTools, setNoteTools] = useState('')
  const [chkKeys, setChkKeys] = useState(false)
  const [noteKeys, setNoteKeys] = useState('')

  // Remarks & Photos & Stamp
  const [remarks, setRemarks] = useState('')
  const [prePhotos, setPrePhotos] = useState<string>('')
  const [postPhotos, setPostPhotos] = useState<string>('')
  const [officialStamp, setOfficialStamp] = useState(false)

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const res = await fetch(`/api/fleet/vehicles/${encodeURIComponent(vehicleId)}`)
        if (res.ok) {
          const data = await res.json()
          const v = data.item || data.data
          setVehicle(v)
          setVehicleMakeModel(`${v?.make || ''} ${v?.model || ''}`.trim())
          setVehicleReg(v?.licensePlate || v?.plate || '')
          // Prefill driver name if assigned
          if ((v?.assignedTo || '').trim()) setDrvName(String(v.assignedTo))
        }
      } catch {}
    }
    if (vehicleId) loadVehicle()
  }, [vehicleId])

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetch(`/api/fleet/vehicles/${encodeURIComponent(vehicleId)}/handover`)
        const data = await res.json().catch(()=>({ items: [] }))
        setHistory(Array.isArray(data.items) ? data.items : [])
      } catch { setHistory([]) }
    }
    if (vehicleId) loadHistory()
  }, [vehicleId, saving])

  const canSave = useMemo(() => rcpName.trim().length > 0, [rcpName])

  const save = async () => {
    // Validation
    if (!canSave) return alert('Recipient Name is required')
    if (odometer && isNaN(Number(odometer))) return alert('Odometer must be a number')
    if (fuelLevelPct) {
      const f = Number(fuelLevelPct)
      if (isNaN(f) || f < 0 || f > 100) return alert('Fuel Level must be between 0 and 100')
    }
    if (assignmentType === 'WITH_DRIVER') {
      if (!drvName.trim()) return alert('Driver Name is required for Vehicle with Driver')
      if (!drvLicense.trim()) return alert('Driver License Number is required for Vehicle with Driver')
    }
    try {
      setSaving(true)
      const body = {
        formType,
        assignmentType,
        vehicleMakeModel,
        vehicleReg,
        odometer: odometer ? Number(odometer) : undefined,
        fuelLevelPct: fuelLevelPct ? Number(fuelLevelPct) : undefined,
        vehicleCondition: vehicleCondition || undefined,
        accessories: {
          jack: accJack, spareTire: accSpare, tools: accTools, fireExtinguisher: accFireExt, firstAidKit: accFirstAid,
        },
        driverInfo: assignmentType === 'WITH_DRIVER' ? {
          name: drvName, licenseNumber: drvLicense, contact: drvContact, signature: drvSignature,
        } : undefined,
        recipient: { name: rcpName, department: rcpDept, contact: rcpContact, signature: rcpSignature, dateTime: rcpDateTime || new Date().toISOString() },
        supervisor: { name: supName, signature: supSignature, dateTime: supDateTime },
        checklist: [
          { item: 'Exterior Damage Inspection', checked: chkExterior, notes: noteExterior },
          { item: 'Interior Condition', checked: chkInterior, notes: noteInterior },
          { item: 'Fuel Level Checked', checked: chkFuel, notes: noteFuel },
          { item: 'Odometer Reading Recorded', checked: chkOdom, notes: noteOdom },
          { item: 'Required Tools Present', checked: chkTools, notes: noteTools },
          { item: 'Vehicle Keys Handover', checked: chkKeys, notes: noteKeys },
        ],
        remarks,
        photos: {
          preHandover: prePhotos ? prePhotos.split('\n').map(s=>s.trim()).filter(Boolean) : [],
          postReturn: postPhotos ? postPhotos.split('\n').map(s=>s.trim()).filter(Boolean) : [],
        },
        officialStamp,
      }
      const res = await fetch(`/api/fleet/vehicles/${encodeURIComponent(vehicleId)}/handover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(()=>({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save form')
      alert('Form saved')
      router.push('/fleet/manager')
    } catch (e: any) {
      alert(e?.message || 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vehicle Handover / Return Form</h1>
            <p className="text-gray-600 mt-2">Vehicle {vehicleId} {vehicle ? `• ${vehicle.make || ''} ${vehicle.model || ''} • ${vehicle.licensePlate || vehicle.plate || ''}` : ''}</p>
          </div>
          <Link href="/fleet/manager" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">← Back to Manager</Link>
        </div>
      </div>

      {/* Form Type and Assignment Type */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-700 mb-1">Form Type</div>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="radio" name="formType" checked={formType==='HANDOVER'} onChange={()=>setFormType('HANDOVER')} /> Handover</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="formType" checked={formType==='RETURN'} onChange={()=>setFormType('RETURN')} /> Return</label>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-700 mb-1">Vehicle Assignment Type</div>
            <div className="flex gap-4 text-sm">
              <label className="inline-flex items-center gap-2"><input type="radio" name="asstype" checked={assignmentType==='WITH_DRIVER'} onChange={()=>setAssignmentType('WITH_DRIVER')} /> Vehicle with Driver</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="asstype" checked={assignmentType==='FREE_VEHICLE'} onChange={()=>setAssignmentType('FREE_VEHICLE')} /> Free Vehicle (No Driver)</label>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Vehicle Information</h3></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Vehicle Make & Model</div>
            <input className="border rounded w-full h-10 px-3" value={vehicleMakeModel} onChange={e=>setVehicleMakeModel(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Vehicle Registration Number</div>
            <input className="border rounded w-full h-10 px-3" value={vehicleReg} onChange={e=>setVehicleReg(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Odometer Reading</div>
            <input className="border rounded w-full h-10 px-3" placeholder="km/miles" value={odometer} onChange={e=>setOdometer(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Fuel Level (%)</div>
            <input className="border rounded w-full h-10 px-3" placeholder="0-100" value={fuelLevelPct} onChange={e=>setFuelLevelPct(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-gray-600 mb-2">Vehicle Condition</div>
            <div className="flex gap-6 text-sm">
              <label className="inline-flex items-center gap-2"><input type="radio" name="vcond" checked={vehicleCondition==='GOOD'} onChange={()=>setVehicleCondition('GOOD')} /> Good</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="vcond" checked={vehicleCondition==='MINOR_DAMAGE'} onChange={()=>setVehicleCondition('MINOR_DAMAGE')} /> Minor Damage</label>
              <label className="inline-flex items-center gap-2"><input type="radio" name="vcond" checked={vehicleCondition==='NEEDS_MAINTENANCE'} onChange={()=>setVehicleCondition('NEEDS_MAINTENANCE')} /> Needs Maintenance</label>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm text-gray-600 mb-2">Accessories Present</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={accJack} onChange={e=>setAccJack(e.target.checked)} /> Jack</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={accSpare} onChange={e=>setAccSpare(e.target.checked)} /> Spare Tire</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={accTools} onChange={e=>setAccTools(e.target.checked)} /> Tools</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={accFireExt} onChange={e=>setAccFireExt(e.target.checked)} /> Fire Extinguisher</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" checked={accFirstAid} onChange={e=>setAccFirstAid(e.target.checked)} /> First Aid Kit</label>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Information (conditional) */}
      {assignmentType === 'WITH_DRIVER' && (
        <div className="bg-white rounded-lg shadow border mb-6">
          <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Driver Information</h3></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Driver Name</div>
              <input className="border rounded w-full h-10 px-3" value={drvName} onChange={e=>setDrvName(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Driver License Number</div>
              <input className="border rounded w-full h-10 px-3" value={drvLicense} onChange={e=>setDrvLicense(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Driver Contact Number</div>
              <input className="border rounded w-full h-10 px-3" value={drvContact} onChange={e=>setDrvContact(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Driver Signature</div>
              <input className="border rounded w-full h-10 px-3" value={drvSignature} onChange={e=>setDrvSignature(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Recipient Information */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Recipient Information</h3></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Name</div>
            <input className="border rounded w-full h-10 px-3" value={rcpName} onChange={e=>setRcpName(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Department / Project</div>
            <input className="border rounded w-full h-10 px-3" value={rcpDept} onChange={e=>setRcpDept(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Contact Number</div>
            <input className="border rounded w-full h-10 px-3" value={rcpContact} onChange={e=>setRcpContact(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Signature</div>
            <input className="border rounded w-full h-10 px-3" value={rcpSignature} onChange={e=>setRcpSignature(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Date & Time</div>
            <input type="datetime-local" className="border rounded w-full h-10 px-3" value={rcpDateTime} onChange={e=>setRcpDateTime(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Supervisor */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Fleet/Logistics Supervisor</h3></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Name</div>
            <input className="border rounded w-full h-10 px-3" value={supName} onChange={e=>setSupName(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Signature</div>
            <input className="border rounded w-full h-10 px-3" value={supSignature} onChange={e=>setSupSignature(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Date & Time</div>
            <input type="datetime-local" className="border rounded w-full h-10 px-3" value={supDateTime} onChange={e=>setSupDateTime(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Checklist</h3></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={chkExterior} onChange={e=>setChkExterior(e.target.checked)} />
            <div className="flex-1">Exterior Damage Inspection</div>
            <input className="border rounded h-10 px-3 flex-[2]" placeholder="Notes" value={noteExterior} onChange={e=>setNoteExterior(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={chkInterior} onChange={e=>setChkInterior(e.target.checked)} />
            <div className="flex-1">Interior Condition</div>
            <input className="border rounded h-10 px-3 flex-[2]" placeholder="Notes" value={noteInterior} onChange={e=>setNoteInterior(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={chkFuel} onChange={e=>setChkFuel(e.target.checked)} />
            <div className="flex-1">Fuel Level Checked</div>
            <input className="border rounded h-10 px-3 flex-[2]" placeholder="Notes" value={noteFuel} onChange={e=>setNoteFuel(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={chkOdom} onChange={e=>setChkOdom(e.target.checked)} />
            <div className="flex-1">Odometer Reading Recorded</div>
            <input className="border rounded h-10 px-3 flex-[2]" placeholder="Notes" value={noteOdom} onChange={e=>setNoteOdom(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={chkTools} onChange={e=>setChkTools(e.target.checked)} />
            <div className="flex-1">Required Tools Present</div>
            <input className="border rounded h-10 px-3 flex-[2]" placeholder="Notes" value={noteTools} onChange={e=>setNoteTools(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={chkKeys} onChange={e=>setChkKeys(e.target.checked)} />
            <div className="flex-1">Vehicle Keys Handover</div>
            <input className="border rounded h-10 px-3 flex-[2]" placeholder="Notes" value={noteKeys} onChange={e=>setNoteKeys(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Remarks / Notes */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Remarks / Notes</h3></div>
        <div className="p-6">
          <textarea className="border rounded w-full min-h-[100px] p-3" value={remarks} onChange={e=>setRemarks(e.target.value)} />
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Handover/Return History</h3>
          <div className="text-sm text-gray-500">{history.length} record(s)</div>
        </div>
        <div className="p-6 overflow-x-auto">
          {history.length === 0 ? (
            <div className="text-sm text-gray-500">No records yet.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Assignment</th>
                  <th className="px-3 py-2 text-left">Recipient</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Odometer</th>
                  <th className="px-3 py-2 text-left">Fuel %</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h: any) => (
                  <tr key={h.id} className="border-b">
                    <td className="px-3 py-2">{h.id}</td>
                    <td className="px-3 py-2">{h.formType}</td>
                    <td className="px-3 py-2">{h.assignmentType}</td>
                    <td className="px-3 py-2">{h.recipient?.name || '-'}</td>
                    <td className="px-3 py-2">{new Date(h.recipient?.dateTime || h.createdAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{typeof h.odometer === 'number' ? h.odometer : '-'}</td>
                    <td className="px-3 py-2">{typeof h.fuelLevelPct === 'number' ? h.fuelLevelPct : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Photos */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Photos (Optional)</h3></div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-sm text-gray-600 mb-1">Pre-Handover Photos (URLs, one per line)</div>
            <textarea className="border rounded w-full min-h-[80px] p-3" value={prePhotos} onChange={e=>setPrePhotos(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Post-Return Photos (URLs, one per line)</div>
            <textarea className="border rounded w-full min-h-[80px] p-3" value={postPhotos} onChange={e=>setPostPhotos(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Official Stamp */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b"><h3 className="text-lg font-medium text-gray-900">Official Stamp / Company Use Only</h3></div>
        <div className="p-6">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={officialStamp} onChange={e=>setOfficialStamp(e.target.checked)} /> Apply official stamp</label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href={`/fleet/manager`} className="px-4 py-2 border rounded-lg">Cancel</Link>
        <button onClick={save} disabled={saving || !canSave} className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Form'}
        </button>
      </div>
    </div>
  )
}
