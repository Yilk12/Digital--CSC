'use client'

import React from 'react'
import Link from 'next/link'

export default function VehicleAssignmentRequestPage() {
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string>('')
  const [successId, setSuccessId] = React.useState<string>('')

  const [form, setForm] = React.useState({
    requestorName: '',
    employeeId: '',
    department: '',
    purpose: '',
    tripType: '',
    placeCategory: '',
    destination: '',
    date: new Date().toISOString().slice(0,10),
    notes: ''
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
      // minimal validation
      if (!form.requestorName || !form.purpose || !form.destination || !form.date) {
        throw new Error('Please fill all required fields')
      }
      const res = await fetch('/api/fleet/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Failed to submit request')
      const data = await res.json()
      setSuccessId(data?.id || data?.item?.id || '')
      // reset some fields
      setForm(f => ({ ...f, purpose: '', tripType: '', placeCategory: '', destination: '', notes: '' }))
    } catch (err: any) {
      setError(err?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Assignment Request</h1>
          <p className="text-sm text-gray-600">Submit your request to the Fleet Manager for review and assignment.</p>
        </div>
        <Link href="/fleet" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">← Back to Fleet Hub</Link>
      </div>

      {error && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>
      )}
      {successId && (
        <div className="mb-4 p-3 border border-green-200 bg-green-50 text-green-700 rounded">Request submitted successfully. Reference ID: <span className="font-mono">{successId}</span></div>
      )}

      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requestor Name *</label>
              <input
                type="text"
                value={form.requestorName}
                onChange={e => update('requestorName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={e => update('employeeId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={e => update('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Purpose *</label>
              <select
                value={form.purpose}
                onChange={e => update('purpose', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select purpose</option>
                <option value="official_meeting">Official Meeting</option>
                <option value="client_meeting">Client Meeting</option>
                <option value="field_visit">Field Visit</option>
                <option value="training">Training</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trip Type</label>
              <select
                value={form.tripType}
                onChange={e => update('tripType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select trip type</option>
                <option value="official_meeting">Official Meeting</option>
                <option value="errand">Errand</option>
                <option value="airport">Airport</option>
                <option value="intercity">Intercity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Place Category</label>
              <select
                value={form.placeCategory}
                onChange={e => update('placeCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select place category</option>
                <option value="urban">Urban</option>
                <option value="rural">Rural</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
              <input
                type="text"
                value={form.destination}
                onChange={e => update('destination', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., HQ, Client Site, Airport"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => update('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special requirements or notes for the fleet manager"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Link href="/fleet" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
