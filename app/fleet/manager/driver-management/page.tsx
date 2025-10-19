'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface Driver { id: string; name: string; license?: string; available?: boolean }
interface License { id: string; driverId: string; licenseClass: string; number: string; issuingAuthority?: string; issuedAt?: string; expiresAt: string }
interface Training { id: string; driverId: string; topic: string; date: string; trainer?: string; certificateUrl?: string }
interface Incident { id: string; driverId: string; date: string; type: string; description: string; location?: string; severity?: string; actionTaken?: string }
interface Certification { id: string; driverId: string; name: string; date: string; expiresAt?: string; issuer?: string }

export default function DriverManagementPage() {
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'licenses' | 'trainings' | 'incidents' | 'certifications'>('overview')
  const [selectedDriverId, setSelectedDriverId] = useState<string>('')

  const [licenses, setLicenses] = useState<License[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [certs, setCerts] = useState<Certification[]>([])

  // forms
  const [newLic, setNewLic] = useState<Partial<License>>({})
  const [newTrn, setNewTrn] = useState<Partial<Training>>({})
  const [newInc, setNewInc] = useState<Partial<Incident>>({})
  const [newCer, setNewCer] = useState<Partial<Certification>>({})

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/fleet/drivers')
        const data = await res.json()
        setDrivers(Array.isArray(data.items) ? data.items : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedDriverId) { setLicenses([]); setTrainings([]); setIncidents([]); setCerts([]); return }
    const loadAll = async () => {
      const [l, t, i, c] = await Promise.all([
        fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/licenses`).then(r=>r.json()).catch(()=>({items:[]})),
        fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/trainings`).then(r=>r.json()).catch(()=>({items:[]})),
        fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/incidents`).then(r=>r.json()).catch(()=>({items:[]})),
        fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/certifications`).then(r=>r.json()).catch(()=>({items:[]})),
      ])
      setLicenses(l.items || [])
      setTrainings(t.items || [])
      setIncidents(i.items || [])
      setCerts(c.items || [])
    }
    loadAll()
  }, [selectedDriverId])

  const selectedDriver = useMemo(() => drivers.find(d => d.id === selectedDriverId) || null, [drivers, selectedDriverId])

  const addLicense = async () => {
    if (!selectedDriverId) return alert('Select driver')
    const body = { licenseClass: newLic.licenseClass, number: newLic.number, issuingAuthority: newLic.issuingAuthority, issuedAt: newLic.issuedAt, expiresAt: newLic.expiresAt }
    const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/licenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const e = await res.json().catch(()=>({})); return alert(e.error || 'Failed') }
    setNewLic({})
    const d = await res.json()
    setLicenses(prev => [d.item, ...prev])
  }

  const addTraining = async () => {
    if (!selectedDriverId) return alert('Select driver')
    const body = { topic: newTrn.topic, date: newTrn.date, trainer: newTrn.trainer, certificateUrl: newTrn.certificateUrl }
    const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/trainings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const e = await res.json().catch(()=>({})); return alert(e.error || 'Failed') }
    setNewTrn({})
    const d = await res.json()
    setTrainings(prev => [d.item, ...prev])
  }

  const addIncident = async () => {
    if (!selectedDriverId) return alert('Select driver')
    const body = { description: newInc.description, date: newInc.date, type: newInc.type, location: newInc.location, severity: newInc.severity, actionTaken: newInc.actionTaken }
    const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const e = await res.json().catch(()=>({})); return alert(e.error || 'Failed') }
    setNewInc({})
    const d = await res.json()
    setIncidents(prev => [d.item, ...prev])
  }

  const addCert = async () => {
    if (!selectedDriverId) return alert('Select driver')
    const body = { name: newCer.name, date: newCer.date, expiresAt: newCer.expiresAt, issuer: newCer.issuer }
    const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(selectedDriverId)}/certifications`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const e = await res.json().catch(()=>({})); return alert(e.error || 'Failed') }
    setNewCer({})
    const d = await res.json()
    setCerts(prev => [d.item, ...prev])
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading driver management...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="text-gray-600 mt-2">Recruitment, records, licenses, training, incidents, and compliance</p>
          </div>
          <Link href="/fleet/manager" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">← Back to Manager</Link>
        </div>
      </div>

      {/* Driver selector */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="px-6 py-4 border-b flex items-center gap-4">
          <div className="text-sm text-gray-700">Select Driver</div>
          <select className="border rounded h-10 px-3" value={selectedDriverId} onChange={e=>setSelectedDriverId(e.target.value)}>
            <option value="">-- Choose --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {selectedDriver && (
            <div className="text-sm text-gray-500">Selected: <span className="font-medium">{selectedDriver.name}</span></div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'records', label: 'Records' },
            { id: 'licenses', label: 'Licenses' },
            { id: 'trainings', label: 'Trainings' },
            { id: 'incidents', label: 'Incidents' },
            { id: 'certifications', label: 'Certifications' },
          ].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id as any)} className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab===t.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t.label}</button>
          ))}
        </nav>
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Recommended Program</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <div className="font-semibold mb-1">Recruitment & Onboarding</div>
                <ul className="list-disc ml-5">
                  <li>Collect license, ID/Passport, background check, driving history, medical fitness, work eligibility</li>
                  <li>Orientation on policies, safety, operation, fueling/maintenance, incident reporting</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Records & Compliance</div>
                <ul className="list-disc ml-5">
                  <li>Maintain profiles, track license/medical expiries, GDPR compliance</li>
                  <li>Keep DQFs, HOS logs, inspections and insurance checks up to date</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Training & Safety</div>
                <ul className="list-disc ml-5">
                  <li>Defensive driving, fatigue, inspections, emergency response, eco-driving</li>
                  <li>Log training dates, certificates, trainer name</li>
                </ul>
              </div>
              <div>
                <div className="font-semibold mb-1">Performance & Incidents</div>
                <ul className="list-disc ml-5">
                  <li>KPIs: schedule adherence, fuel efficiency, vehicle condition, feedback, idle time</li>
                  <li>Track incidents/violations and disciplinary actions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records (Profile preview) */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Driver Profile</h3>
            </div>
            <div className="p-6 text-sm text-gray-700">
              {!selectedDriver ? (
                <div>Select a driver to view profile.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Name</div>
                    <div className="font-medium">{selectedDriver.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Status</div>
                    <div className="font-medium">{selectedDriver.available ? 'Available' : 'Unavailable'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Licenses */}
      {activeTab === 'licenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Licenses</h3>
              <button disabled={!selectedDriverId} onClick={addLicense} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded disabled:opacity-50">Add</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Class" className="border rounded h-10 px-3" value={newLic.licenseClass||''} onChange={e=>setNewLic(p=>({...p, licenseClass:e.target.value}))} />
              <input placeholder="Number" className="border rounded h-10 px-3" value={newLic.number||''} onChange={e=>setNewLic(p=>({...p, number:e.target.value}))} />
              <input placeholder="Issuing Authority" className="border rounded h-10 px-3" value={newLic.issuingAuthority||''} onChange={e=>setNewLic(p=>({...p, issuingAuthority:e.target.value}))} />
              <input type="date" placeholder="Issued At" className="border rounded h-10 px-3" value={newLic.issuedAt||''} onChange={e=>setNewLic(p=>({...p, issuedAt:e.target.value}))} />
              <input type="date" placeholder="Expires At" className="border rounded h-10 px-3" value={newLic.expiresAt||''} onChange={e=>setNewLic(p=>({...p, expiresAt:e.target.value}))} />
            </div>
            <div className="px-6 pb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Class</th>
                    <th className="px-3 py-2 text-left">Number</th>
                    <th className="px-3 py-2 text-left">Authority</th>
                    <th className="px-3 py-2 text-left">Issued</th>
                    <th className="px-3 py-2 text-left">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map(l => (
                    <tr key={l.id} className="border-b">
                      <td className="px-3 py-2">{l.licenseClass}</td>
                      <td className="px-3 py-2">{l.number}</td>
                      <td className="px-3 py-2">{l.issuingAuthority || '-'}</td>
                      <td className="px-3 py-2">{l.issuedAt || '-'}</td>
                      <td className="px-3 py-2">{l.expiresAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trainings */}
      {activeTab === 'trainings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Trainings</h3>
              <button disabled={!selectedDriverId} onClick={addTraining} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded disabled:opacity-50">Add</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Topic" className="border rounded h-10 px-3" value={newTrn.topic||''} onChange={e=>setNewTrn(p=>({...p, topic:e.target.value}))} />
              <input type="date" placeholder="Date" className="border rounded h-10 px-3" value={newTrn.date||''} onChange={e=>setNewTrn(p=>({...p, date:e.target.value}))} />
              <input placeholder="Trainer" className="border rounded h-10 px-3" value={newTrn.trainer||''} onChange={e=>setNewTrn(p=>({...p, trainer:e.target.value}))} />
              <input placeholder="Certificate URL" className="border rounded h-10 px-3" value={newTrn.certificateUrl||''} onChange={e=>setNewTrn(p=>({...p, certificateUrl:e.target.value}))} />
            </div>
            <div className="px-6 pb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Topic</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Trainer</th>
                    <th className="px-3 py-2 text-left">Certificate</th>
                  </tr>
                </thead>
                <tbody>
                  {trainings.map(t => (
                    <tr key={t.id} className="border-b">
                      <td className="px-3 py-2">{t.topic}</td>
                      <td className="px-3 py-2">{t.date}</td>
                      <td className="px-3 py-2">{t.trainer || '-'}</td>
                      <td className="px-3 py-2"><a href={t.certificateUrl || '#'} className="text-blue-600 hover:underline" target="_blank">{t.certificateUrl ? 'View' : '-'}</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incidents */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Incidents & Violations</h3>
              <button disabled={!selectedDriverId} onClick={addIncident} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded disabled:opacity-50">Add</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-6 gap-4">
              <input type="datetime-local" className="border rounded h-10 px-3" value={newInc.date||''} onChange={e=>setNewInc(p=>({...p, date:e.target.value}))} />
              <select className="border rounded h-10 px-3" value={newInc.type||''} onChange={e=>setNewInc(p=>({...p, type:e.target.value}))}>
                <option value="">Type</option>
                <option value="violation">Violation</option>
                <option value="accident">Accident</option>
                <option value="complaint">Complaint</option>
                <option value="misuse">Misuse</option>
                <option value="other">Other</option>
              </select>
              <input placeholder="Location" className="border rounded h-10 px-3" value={newInc.location||''} onChange={e=>setNewInc(p=>({...p, location:e.target.value}))} />
              <select className="border rounded h-10 px-3" value={newInc.severity||''} onChange={e=>setNewInc(p=>({...p, severity:e.target.value}))}>
                <option value="">Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input placeholder="Action Taken" className="border rounded h-10 px-3" value={newInc.actionTaken||''} onChange={e=>setNewInc(p=>({...p, actionTaken:e.target.value}))} />
              <input placeholder="Description" className="border rounded h-10 px-3 md:col-span-2" value={newInc.description||''} onChange={e=>setNewInc(p=>({...p, description:e.target.value}))} />
            </div>
            <div className="px-6 pb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Location</th>
                    <th className="px-3 py-2 text-left">Severity</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map(i => (
                    <tr key={i.id} className="border-b">
                      <td className="px-3 py-2">{new Date(i.date).toLocaleString()}</td>
                      <td className="px-3 py-2">{i.type}</td>
                      <td className="px-3 py-2">{i.location || '-'}</td>
                      <td className="px-3 py-2">{i.severity || '-'}</td>
                      <td className="px-3 py-2">{i.actionTaken || '-'}</td>
                      <td className="px-3 py-2">{i.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Certifications */}
      {activeTab === 'certifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Certifications</h3>
              <button disabled={!selectedDriverId} onClick={addCert} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded disabled:opacity-50">Add</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Name" className="border rounded h-10 px-3" value={newCer.name||''} onChange={e=>setNewCer(p=>({...p, name:e.target.value}))} />
              <input type="date" placeholder="Date" className="border rounded h-10 px-3" value={newCer.date||''} onChange={e=>setNewCer(p=>({...p, date:e.target.value}))} />
              <input type="date" placeholder="Expires" className="border rounded h-10 px-3" value={newCer.expiresAt||''} onChange={e=>setNewCer(p=>({...p, expiresAt:e.target.value}))} />
              <input placeholder="Issuer" className="border rounded h-10 px-3" value={newCer.issuer||''} onChange={e=>setNewCer(p=>({...p, issuer:e.target.value}))} />
            </div>
            <div className="px-6 pb-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Expires</th>
                    <th className="px-3 py-2 text-left">Issuer</th>
                  </tr>
                </thead>
                <tbody>
                  {certs.map(c => (
                    <tr key={c.id} className="border-b">
                      <td className="px-3 py-2">{c.name}</td>
                      <td className="px-3 py-2">{c.date}</td>
                      <td className="px-3 py-2">{c.expiresAt || '-'}</td>
                      <td className="px-3 py-2">{c.issuer || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
