'use client'

import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { listFleetRequests, approveFleetRequest, rejectFleetRequest, type FleetRequestDTO } from '@/app/lib/fleet-api'
import Link from 'next/link'

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

interface Expense {
  id: string
  vehicleId: string
  type: 'fuel' | 'maintenance' | 'insurance' | 'registration' | 'repair' | 'other'
  amount: number
  date: string
  description: string
  category: string
  receiptNumber?: string
  approvedBy?: string
  status: 'pending' | 'approved' | 'rejected'
}

interface Budget {
  id: string
  department: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  period: string
}

export default function FinancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'budgets' | 'reports' | 'requests'>('overview')

  // Fleet requests for finance approval
  const [requests, setRequests] = useState<FleetRequestDTO[]>([])
  const [reqLoading, setReqLoading] = useState(false)
  const [actingId, setActingId] = useState<string>('')

  // Finance registration form state (for receipts, vendors, etc.)
  const [showRegistration, setShowRegistration] = useState(false)
  const [regType, setRegType] = useState<'MAINTENANCE' | 'FUEL' | 'ISSUE'>('MAINTENANCE')
  const [regRequestId, setRegRequestId] = useState<string>('')
  const [regCompany, setRegCompany] = useState<string>('')
  const [regAmount, setRegAmount] = useState<number | ''>('')
  const [regReceiptNo, setRegReceiptNo] = useState<string>('')
  const [regNotes, setRegNotes] = useState<string>('')
  const [regFile, setRegFile] = useState<File | null>(null)
  const [regSubmitting, setRegSubmitting] = useState(false)

  useEffect(() => {
    loadFinanceData()
    loadRequests()
  }, [])

  const loadFinanceData = async () => {
    try {
      setLoading(true)
      
      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.items || [])

      // Load expenses (mock data)
      setExpenses([
        {
          id: '1',
          vehicleId: '1',
          type: 'fuel',
          amount: 85.50,
          date: '2024-01-20',
          description: 'Fuel refill - Toyota Camry',
          category: 'Operating Expense',
          receiptNumber: 'RCP001',
          approvedBy: 'Finance Manager',
          status: 'approved'
        },
        {
          id: '2',
          vehicleId: '2',
          type: 'maintenance',
          amount: 320.00,
          date: '2024-01-22',
          description: 'Brake pad replacement',
          category: 'Maintenance',
          receiptNumber: 'RCP002',
          status: 'pending'
        },
        {
          id: '3',
          vehicleId: '1',
          type: 'insurance',
          amount: 1200.00,
          date: '2024-01-15',
          description: 'Annual vehicle insurance',
          category: 'Insurance',
          receiptNumber: 'RCP003',
          approvedBy: 'Finance Manager',
          status: 'approved'
        }
      ])

      // Load budgets (mock data)
      setBudgets([
        {
          id: '1',
          department: 'Sales',
          allocatedAmount: 50000,
          spentAmount: 12500,
          remainingAmount: 37500,
          period: '2024 Q1'
        },
        {
          id: '2',
          department: 'Marketing',
          allocatedAmount: 30000,
          spentAmount: 8500,
          remainingAmount: 21500,
          period: '2024 Q1'
        },
        {
          id: '3',
          department: 'Operations',
          allocatedAmount: 75000,
          spentAmount: 22000,
          remainingAmount: 53000,
          period: '2024 Q1'
        }
      ])
    } catch (error) {
      console.error('Error loading finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Derived/filter helpers and actions (component scope)
  const relatedRequests = useMemo(() => requests.filter(r => r.type === regType), [requests, regType])

  const submitRegistration = async (e: FormEvent) => {
    e.preventDefault()
    if (!regCompany.trim()) return alert('Company/Vendor is required')
    if (!regRequestId) return alert('Please select a related request')
    try {
      setRegSubmitting(true)
      const fd = new FormData()
      fd.append('type', regType)
      fd.append('requestId', regRequestId)
      fd.append('company', regCompany)
      if (regAmount !== '' && regAmount != null) fd.append('amount', String(regAmount))
      if (regReceiptNo) fd.append('receiptNumber', regReceiptNo)
      if (regNotes) fd.append('notes', regNotes)
      if (regFile) fd.append('receipt', regFile)
      const res = await fetch('/api/fleet/finance/registrations', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Failed to register receipt')
      // reset
      setShowRegistration(false)
      setRegRequestId('')
      setRegCompany('')
      setRegAmount('')
      setRegReceiptNo('')
      setRegNotes('')
      setRegFile(null)
      await loadRequests()
    } catch (err: any) {
      alert(err?.message || 'Submission failed')
    } finally {
      setRegSubmitting(false)
    }
  }

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
    } catch {
      // ignore
    } finally {
      setActingId('')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'approved': return 'text-green-600 bg-green-100'
      case 'rejected': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'fuel': return 'text-blue-600 bg-blue-100'
      case 'maintenance': return 'text-orange-600 bg-orange-100'
      case 'insurance': return 'text-purple-600 bg-purple-100'
      case 'repair': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const financeStats = {
    totalExpenses: expenses.reduce((total, exp) => total + exp.amount, 0),
    pendingExpenses: expenses.filter(e => e.status === 'pending').reduce((total, exp) => total + exp.amount, 0),
    approvedExpenses: expenses.filter(e => e.status === 'approved').reduce((total, exp) => total + exp.amount, 0),
    totalBudget: budgets.reduce((total, budget) => total + budget.allocatedAmount, 0),
    spentBudget: budgets.reduce((total, budget) => total + budget.spentAmount, 0),
    remainingBudget: budgets.reduce((total, budget) => total + budget.remainingAmount, 0)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading finance data...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Finance Department Dashboard</h1>
            <p className="text-gray-600 mt-2">Fleet financial management and budget tracking</p>
          </div>
          <Link 
            href="/fleet" 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Fleet Hub
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">${financeStats.totalExpenses.toLocaleString()}</p>
          </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-semibold text-gray-900">${financeStats.pendingExpenses.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
          </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Budget</p>
              <p className="text-2xl font-semibold text-gray-900">${financeStats.totalBudget.toLocaleString()}</p>
          </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Remaining Budget</p>
              <p className="text-2xl font-semibold text-gray-900">${financeStats.remainingBudget.toLocaleString()}</p>
          </div>
          </div>
        </div>
        </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'expenses', label: 'Expense Management' },
            { id: 'budgets', label: 'Budget Tracking' },
            { id: 'reports', label: 'Financial Reports' },
            { id: 'requests', label: 'Fleet Requests' },
          ].map(tab => (
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

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Budget Overview */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Department Budget Overview</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {budgets.map(budget => (
                  <div key={budget.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{budget.department}</h4>
                      <span className="text-sm text-gray-500">{budget.period}</span>
                    </div>
          <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Allocated:</span>
                        <span className="font-medium">${budget.allocatedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Spent:</span>
                        <span className="font-medium">${budget.spentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Remaining:</span>
                        <span className="font-medium text-green-600">${budget.remainingAmount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(budget.spentAmount / budget.allocatedAmount) * 100}%` }}
                        ></div>
                      </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Recent Expenses</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {expenses.slice(0, 5).map(expense => {
                  const vehicle = vehicles.find(v => v.id === expense.vehicleId)
                  return (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div>
                        <h4 className="font-medium text-gray-900">{vehicle?.make} {vehicle?.model}</h4>
                        <p className="text-sm text-gray-600">{expense.description}</p>
                        <p className="text-sm text-gray-500">Receipt: {expense.receiptNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">${expense.amount}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
          </div>
          </div>
                  )
                })}
          </div>
        </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Pending Fleet Requests (Finance)</h3>
              <button
                className="text-sm text-blue-600 hover:text-blue-800"
                onClick={loadRequests}
                disabled={reqLoading}
              >
                {reqLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">Register receipts and vendor for Maintenance, Fuel, or Issue.</div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm" onClick={() => setShowRegistration(v => !v)}>
                  {showRegistration ? 'Close Registration' : 'New Registration'}
                </button>
              </div>

              {showRegistration && (
                <div className="border rounded-lg p-4 mb-6">
                  <form className="grid gap-4" onSubmit={submitRegistration}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Request Type</label>
                        <select className="w-full border rounded h-9 px-2" value={regType} onChange={e => setRegType(e.target.value as any)}>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="FUEL">Fuel</option>
                          <option value="ISSUE">Issue</option>
                        </select>
                        <div className="text-xs text-gray-500 mt-1">Select the kind of request to register.</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Related Request</label>
                        <select className="w-full border rounded h-9 px-2" value={regRequestId} onChange={e => setRegRequestId(e.target.value)}>
                          <option value="">Select request</option>
                          {relatedRequests.map(r => (
                            <option key={r.id} value={r.id}>{new Date(r.date).toLocaleDateString()} • {r.vehicleId || '-'} • {r.description?.slice(0,40) || r.type}</option>
                          ))}
                        </select>
                        <div className="text-xs text-gray-500 mt-1">Pick the request you are registering for.</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Company / Vendor</label>
                        <input className="w-full border rounded h-9 px-2" value={regCompany} onChange={e => setRegCompany(e.target.value)} placeholder="e.g. ABC Motors Service" />
                        <div className="text-xs text-gray-500 mt-1">Required for maintenance and other issues.</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium">Amount</label>
                        <input type="number" step="0.01" className="w-full border rounded h-9 px-2" value={regAmount as any} onChange={e => setRegAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g. 3500" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Receipt Number</label>
                        <input className="w-full border rounded h-9 px-2" value={regReceiptNo} onChange={e => setRegReceiptNo(e.target.value)} placeholder="e.g. RCP-12345" />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Receipt File</label>
                        <input type="file" accept="application/pdf,image/*" className="w-full border rounded h-9 px-2 py-1" onChange={e => setRegFile(e.currentTarget.files?.[0] || null)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <textarea className="w-full border rounded px-2 py-1" rows={3} value={regNotes} onChange={e => setRegNotes(e.target.value)} placeholder="Optional notes"></textarea>
                    </div>

                    <div className="flex gap-2">
                      <button disabled={regSubmitting} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50" type="submit">
                        {regSubmitting ? 'Submitting…' : 'Submit Registration'}
                      </button>
                      <button type="button" className="text-gray-700 px-3 py-2" onClick={() => setShowRegistration(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
              {requests.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No pending requests.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount/Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests
                      .filter(r => r.type === 'FUEL' || r.type === 'MAINTENANCE')
                      .map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">{r.type}</span>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{new Date(r.date).toLocaleString()}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{r.vehicleId || '-'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {typeof r.amount !== 'undefined' ? r.amount : (typeof r.cost !== 'undefined' ? r.cost : '-')}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            <div>{r.description || '-'}</div>
                            {r.amountType && <div className="text-xs text-gray-500">Amount Type: {String(r.amountType)}</div>}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            <button
                              className="text-green-600 hover:text-green-800 mr-3 disabled:opacity-50"
                              onClick={() => actOn(r.id, 'approve')}
                              disabled={actingId === r.id}
                            >Approve</button>
                            <button
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              onClick={() => actOn(r.id, 'reject')}
                              disabled={actingId === r.id}
                            >Reject</button>
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

      {activeTab === 'expenses' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Expense Management</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              New Expense
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map(expense => {
                  const vehicle = vehicles.find(v => v.id === expense.vehicleId)
                  return (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{vehicle?.make} {vehicle?.model}</div>
                        <div className="text-sm text-gray-500">{vehicle?.licensePlate}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExpenseTypeColor(expense.type)}`}>
                          {expense.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{expense.description}</div>
                        <div className="text-sm text-gray-500">{expense.receiptNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${expense.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                          {expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {expense.status === 'pending' && (
                          <>
                            <button className="text-green-600 hover:text-green-900 mr-3">Approve</button>
                            <button className="text-red-600 hover:text-red-900 mr-3">Reject</button>
                          </>
                        )}
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Budget Allocation</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {budgets.map(budget => (
                  <div key={budget.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-4">{budget.department}</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Allocated</span>
                        <span className="text-sm font-medium">${budget.allocatedAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Spent</span>
                        <span className="text-sm font-medium">${budget.spentAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Remaining</span>
                        <span className="text-sm font-medium text-green-600">${budget.remainingAmount.toLocaleString()}</span>
          </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(budget.spentAmount / budget.allocatedAmount) * 100}%` }}
                        ></div>
          </div>
                      <div className="text-center text-xs text-gray-500">
                        {Math.round((budget.spentAmount / budget.allocatedAmount) * 100)}% used
          </div>
          </div>
        </div>
                ))}
              </div>
          </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Expense Summary</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Expenses:</span>
                    <span className="font-medium">${financeStats.totalExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved:</span>
                    <span className="font-medium text-green-600">${financeStats.approvedExpenses.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-yellow-600">${financeStats.pendingExpenses.toLocaleString()}</span>
          </div>
          </div>
        </div>
        </div>

            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Budget Summary</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Budget:</span>
                    <span className="font-medium">${financeStats.totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Spent:</span>
                    <span className="font-medium text-red-600">${financeStats.spentBudget.toLocaleString()}</span>
          </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remaining:</span>
                    <span className="font-medium text-green-600">${financeStats.remainingBudget.toLocaleString()}</span>
          </div>
        </div>
          </div>
          </div>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Generate Report</div>
                  <div className="text-sm text-gray-500">Create monthly expense report</div>
          </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Budget Review</div>
                  <div className="text-sm text-gray-500">Review department budgets</div>
          </button>
                <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
                  <div className="font-medium text-gray-900">Export Data</div>
                  <div className="text-sm text-gray-500">Export financial data</div>
          </button>
        </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}