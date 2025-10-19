'use client'

import React from 'react'
import Link from 'next/link'
import { getCurrentUserRoles, getCurrentUserPrimaryRole } from '@/app/lib/auth'

export default function DeptHeadVehicleRequestPage() {
  const roles = getCurrentUserRoles()
  const primary = getCurrentUserPrimaryRole()
  const devForce = process.env.NEXT_PUBLIC_DEV_FORCE_DEPT_HEAD === 'true'
  const isDeptHead =
    devForce ||
    roles.includes('department_head' as any) ||
    roles.includes('manager' as any) ||
    roles.includes('admin' as any) ||
    roles.includes('gm' as any) ||
    primary === 'department_head' ||
    primary === 'manager' ||
    primary === 'admin' ||
    primary === 'gm'

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string>('')
  const [successId, setSuccessId] = React.useState<string>('')

  const [form, setForm] = React.useState({
    // Department Information
    departmentName: '',
    departmentHeadName: '',
    employeeId: '',
    contactNumber: '',
    email: '',
    // Vehicle Details
    vehicleId: '',
    licensePlate: '',
    makeModel: '',
    year: '',
    fuelType: '',
    odometerStartKm: '',
    // Assignment Period
    startDate: '',
    endDate: '',
    usageDaily: false,
    usageWeekly: false,
    usageOccasional: false,
    usageEmergency: false,
    usageFullTime: false,
    usageOther: false,
    usageOtherText: '',
    // Purpose
    purposeFieldSupervision: false,
    purposeSiteInspections: false,
    purposeEmergencyResponse: false,
    purposeEquipmentTransport: false,
    purposeOther: false,
    purposeOtherText: '',
    // Return (for Fleet use)
    returnDate: '',
    finalOdometerKm: '',
    fuelLevelAtReturn: '',
    returnConditionNotes: '',
    // Authorization
    requestedByName: '',
    requestedBySignature: '',
    requestedByDate: '',
    approvedByName: '',
    approvedBySignature: '',
    approvedByDate: '',
    approvalNotes: '',
    // Driver option
    driverOption: 'with_driver' as 'with_driver' | 'no_driver',
  })

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessId('')
    try {
      // basic required validation
      const required = [
        form.departmentName,
        form.departmentHeadName,
        form.employeeId,
        form.contactNumber,
        form.email,
        form.startDate,
      ]
      if (required.some(v => !String(v || '').trim())) {
        throw new Error('Please fill all required fields marked with *')
      }

      const payload = {
        kind: 'DEPARTMENT_HEAD_REQUEST',
        status: 'PENDING',
        submittedAt: new Date().toISOString(),
        department: {
          name: form.departmentName,
          headName: form.departmentHeadName,
          employeeId: form.employeeId,
          contactNumber: form.contactNumber,
          email: form.email,
        },
        vehicle: {
          vehicleId: form.vehicleId,
          licensePlate: form.licensePlate,
          makeModel: form.makeModel,
          year: form.year,
          fuelType: form.fuelType,
          odometerStartKm: form.odometerStartKm,
        },
        assignment: {
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          usage: {
            daily: form.usageDaily,
            weekly: form.usageWeekly,
            occasional: form.usageOccasional,
            emergencyOnly: form.usageEmergency,
            fullTime: form.usageFullTime,
            other: form.usageOther ? (form.usageOtherText || true) : false,
          },
        },
        purpose: {
          fieldSupervision: form.purposeFieldSupervision,
          siteInspections: form.purposeSiteInspections,
          emergencyResponse: form.purposeEmergencyResponse,
          equipmentOrStaffTransport: form.purposeEquipmentTransport,
          other: form.purposeOther ? (form.purposeOtherText || true) : false,
        },
        authorization: {
          requestedBy: {
            name: form.requestedByName,
            signature: form.requestedBySignature,
            date: form.requestedByDate,
          },
          approvedBy: {
            name: form.approvedByName,
            signature: form.approvedBySignature,
            date: form.approvedByDate,
          },
          notes: form.approvalNotes,
        },
        driver: {
          option: form.driverOption, // 'with_driver' | 'no_driver'
        },
      }

      const res = await fetch('/api/fleet/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to submit request')
      const data = await res.json()
      setSuccessId(data?.id || data?.item?.id || '')
    } catch (err: any) {
      setError(err?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isDeptHead) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vehicle Assignment – Department Head</h1>
          <Link href="/fleet" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">← Back</Link>
        </div>
        <div className="p-4 border rounded bg-red-50 text-red-700">
          Access denied. This form is only available to Department Heads.
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Assignment Form – Department Head (Utilities)</h1>
          <p className="text-sm text-gray-600">Request form only visible for Department Head</p>
        </div>
        <Link href="/fleet/department-head" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">← Back</Link>
      </div>

      {error && <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}
      {successId && (
        <div className="mb-4 p-3 border border-green-200 bg-green-50 text-green-700 rounded">
          Request submitted successfully. Reference ID: <span className="font-mono">{successId}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Department Information */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">🏢 Department Information</h2></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Department Name *</label>
              <input className="w-full border rounded px-3 py-2" value={form.departmentName} onChange={e=>update('departmentName', e.target.value)} required />
              <p className="text-xs text-gray-500">(e.g. for home to office, field, special)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Department Head Name *</label>
              <input className="w-full border rounded px-3 py-2" value={form.departmentHeadName} onChange={e=>update('departmentHeadName', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Employee ID / Badge Number *</label>
              <input className="w-full border rounded px-3 py-2" value={form.employeeId} onChange={e=>update('employeeId', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Number *</label>
              <input className="w-full border rounded px-3 py-2" value={form.contactNumber} onChange={e=>update('contactNumber', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address *</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={form.email} onChange={e=>update('email', e.target.value)} required />
            </div>
          </div>
        </section>

        {/* Vehicle Details */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">🚘 Vehicle Details</h2></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle ID / Fleet Number</label>
              <input className="w-full border rounded px-3 py-2" value={form.vehicleId} onChange={e=>update('vehicleId', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License Plate Number</label>
              <input className="w-full border rounded px-3 py-2" value={form.licensePlate} onChange={e=>update('licensePlate', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Make & Model</label>
              <input className="w-full border rounded px-3 py-2" value={form.makeModel} onChange={e=>update('makeModel', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input className="w-full border rounded px-3 py-2" value={form.year} onChange={e=>update('year', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Type</label>
              <input className="w-full border rounded px-3 py-2" value={form.fuelType} onChange={e=>update('fuelType', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Current Odometer Reading (km)</label>
              <input className="w-full border rounded px-3 py-2" value={form.odometerStartKm} onChange={e=>update('odometerStartKm', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Assignment Period */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">📅 Assignment Period</h2></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assignment Start Date *</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.startDate} onChange={e=>update('startDate', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assignment End Date (if temporary)</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.endDate} onChange={e=>update('endDate', e.target.value)} />
              <p className="text-xs text-gray-500">Leave blank if permanent or ongoing</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Expected Usage Frequency</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {[
                  ['usageDaily','Daily'],
                  ['usageWeekly','Weekly'],
                  ['usageOccasional','Occasional'],
                  ['usageEmergency','Emergency Use Only'],
                  ['usageFullTime','Full time'],
                  ['usageOther','Other'],
                ].map(([key,label]) => (
                  <label key={key} className="inline-flex items-center space-x-2">
                    <input type="checkbox" checked={(form as any)[key]} onChange={e=>update(key as any, e.target.checked)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              {form.usageOther && (
                <input className="mt-2 w-full border rounded px-3 py-2" placeholder="Specify other usage" value={form.usageOtherText} onChange={e=>update('usageOtherText', e.target.value)} />
              )}
            </div>
          </div>
        </section>

        {/* Purpose of Assignment */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">🎯 Purpose of Assignment</h2></div>
          <div className="p-6 space-y-2">
            {[
              ['purposeFieldSupervision','Field Supervision'],
              ['purposeSiteInspections','Site Inspections'],
              ['purposeEmergencyResponse','Emergency Response'],
              ['purposeEquipmentTransport','Equipment/Staff Transport'],
              ['purposeOther','Other'],
            ].map(([key,label]) => (
              <label key={key} className="block">
                <input type="checkbox" className="mr-2" checked={(form as any)[key]} onChange={e=>update(key as any, e.target.checked)} />
                {label}
              </label>
            ))}
            {form.purposeOther && (
              <input className="mt-2 w-full border rounded px-3 py-2" placeholder="Specify other purpose" value={form.purposeOtherText} onChange={e=>update('purposeOtherText', e.target.value)} />
            )}
          </div>
        </section>

        {/* Driver Option */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">Driver Option</h2></div>
          <div className="p-6">
            <label className="mr-6 inline-flex items-center space-x-2">
              <input type="radio" name="driverOption" checked={form.driverOption==='with_driver'} onChange={()=>update('driverOption','with_driver')} />
              <span>Driver assigned for drive</span>
            </label>
            <label className="inline-flex items-center space-x-2">
              <input type="radio" name="driverOption" checked={form.driverOption==='no_driver'} onChange={()=>update('driverOption','no_driver')} />
              <span>No driver assigned for drive</span>
            </label>
          </div>
        </section>

        {/* Vehicle Return (For Fleet Use) */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">🔄 Vehicle Return Section (For Fleet Department Use)</h2></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
            <div>
              <label className="block text-sm font-medium mb-1">Return Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.returnDate} onChange={e=>update('returnDate', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Final Odometer Reading (km)</label>
              <input className="w-full border rounded px-3 py-2" value={form.finalOdometerKm} onChange={e=>update('finalOdometerKm', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fuel Level at Return</label>
              <input className="w-full border rounded px-3 py-2" value={form.fuelLevelAtReturn} onChange={e=>update('fuelLevelAtReturn', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Vehicle Condition / Issues Reported</label>
              <textarea rows={3} className="w-full border rounded px-3 py-2" value={form.returnConditionNotes} onChange={e=>update('returnConditionNotes', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Authorization */}
        <section className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-medium">✅ Authorization & Approval</h2></div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><h3 className="font-medium mb-2">Requested by (Department Head)</h3></div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={form.requestedByName} onChange={e=>update('requestedByName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Signature</label>
              <input className="w-full border rounded px-3 py-2" placeholder="Type name as signature or attach later" value={form.requestedBySignature} onChange={e=>update('requestedBySignature', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.requestedByDate} onChange={e=>update('requestedByDate', e.target.value)} />
            </div>

            <div className="md:col-span-2 mt-4"><h3 className="font-medium mb-2">Approved by (Fleet Manager / Admin)</h3></div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input className="w-full border rounded px-3 py-2" value={form.approvedByName} onChange={e=>update('approvedByName', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Signature</label>
              <input className="w-full border rounded px-3 py-2" value={form.approvedBySignature} onChange={e=>update('approvedBySignature', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={form.approvedByDate} onChange={e=>update('approvedByDate', e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes / Special Instructions</label>
              <textarea rows={3} className="w-full border rounded px-3 py-2" value={form.approvalNotes} onChange={e=>update('approvalNotes', e.target.value)} />
            </div>
          </div>
        </section>

        <div className="flex justify-end space-x-3">
          <Link href="/fleet/department-head" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={submitting} className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
