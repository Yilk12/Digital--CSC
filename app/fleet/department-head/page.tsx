'use client'

import { useState, useEffect } from 'react'
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

interface Assignment {
  id: string
  vehicleId: string
  driverId: string
  department: string
  assignedBy: string
  assignedDate: string
  purpose: string
  status: 'active' | 'completed' | 'cancelled'
  employeeName: string
  employeeId: string
  position: string
}

export default function DepartmentHeadPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('requests')
  const [departmentName] = useState('Sales Department') // This would come from user context

  useEffect(() => {
    loadDepartmentData()
  }, [])

  const loadDepartmentData = async () => {
    try {
      setLoading(true)
      
      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.items || [])

      // Load department assignments (mock data)
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
          employeeName: 'John Smith',
          employeeId: 'EMP001',
          position: 'Sales Representative'
        },
        {
          id: '2',
          vehicleId: '2',
          driverId: '2',
          department: 'Sales',
          assignedBy: 'Fleet Manager',
          assignedDate: '2024-01-20',
          purpose: 'Client meetings',
          status: 'active',
          employeeName: 'Sarah Johnson',
          employeeId: 'EMP002',
          position: 'Account Manager'
        }
      ])
    } catch (error) {
      console.error('Error loading department data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const departmentStats = {
    totalAssignments: assignments.length,
    activeAssignments: assignments.filter(a => a.status === 'active').length,
    completedAssignments: assignments.filter(a => a.status === 'completed').length,
    pendingRequests: 3 // Mock data
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading department data...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Department Head Dashboard</h1>
            <p className="text-gray-600 mt-2">{departmentName} - Vehicle Assignment Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/fleet/department-head/request" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + New Vehicle Assignment Request
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{departmentStats.activeAssignments}</p>
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
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{departmentStats.completedAssignments}</p>
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
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-semibold text-gray-900">{departmentStats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assignments</p>
              <p className="text-2xl font-semibold text-gray-900">{departmentStats.totalAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'requests', label: 'Vehicle Requests' },
            { id: 'assignments', label: 'Current Assignments' },
            { id: 'history', label: 'Assignment History' },
            { id: 'approvals', label: 'Pending Approvals' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* New Vehicle Request Form */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Submit Vehicle Request</h3>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Select purpose</option>
                      <option value="field_visits">Field Visits</option>
                      <option value="client_meetings">Client Meetings</option>
                      <option value="daily_commute">Daily Commute</option>
                      <option value="official_duties">Official Duties</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requirements</label>
                  <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Any special requirements or notes..."></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Submit Request
                  </button>
                </div>
              </form>
              </div>
            </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Pending Vehicle Requests</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  {
                    id: '1',
                    employeeName: 'Mike Wilson',
                    employeeId: 'EMP003',
                    position: 'Sales Executive',
                    purpose: 'Field visits',
                    startDate: '2024-02-01',
                    endDate: '2024-02-05',
                    status: 'pending',
                    submittedDate: '2024-01-25'
                  },
                  {
                    id: '2',
                    employeeName: 'Lisa Brown',
                    employeeId: 'EMP004',
                    position: 'Account Executive',
                    purpose: 'Client meetings',
                    startDate: '2024-02-10',
                    endDate: '2024-02-12',
                    status: 'pending',
                    submittedDate: '2024-01-26'
                  }
                ].map(request => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
              <div>
                        <h4 className="font-medium text-gray-900">{request.employeeName} ({request.employeeId})</h4>
                        <p className="text-sm text-gray-600">{request.position}</p>
                        <p className="text-sm text-gray-500">Purpose: {request.purpose}</p>
                        <p className="text-sm text-gray-500">Duration: {request.startDate} to {request.endDate}</p>
                        <p className="text-sm text-gray-500">Submitted: {request.submittedDate}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                        <div className="mt-2 space-x-2">
                          <button className="text-green-600 hover:text-green-900 text-sm">Approve</button>
                          <button className="text-red-600 hover:text-red-900 text-sm">Reject</button>
                        </div>
                      </div>
                    </div>
              </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Current Vehicle Assignments</h3>
          </div>
          <div className="p-6">
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active assignments found</p>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
                  return (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
            <div>
                          <h4 className="font-medium text-gray-900">{vehicle?.make} {vehicle?.model} ({vehicle?.licensePlate})</h4>
                          <p className="text-sm text-gray-600">Assigned to: {assignment.employeeName} ({assignment.employeeId})</p>
                          <p className="text-sm text-gray-500">Position: {assignment.position}</p>
                          <p className="text-sm text-gray-500">Purpose: {assignment.purpose}</p>
                          <p className="text-sm text-gray-500">Assigned Date: {assignment.assignedDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                          <div className="mt-2 space-x-2">
                            <button className="text-blue-600 hover:text-blue-900 text-sm">View Details</button>
                            <button className="text-red-600 hover:text-red-900 text-sm">End Assignment</button>
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

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Assignment History</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assignments.map(assignment => {
                    const vehicle = vehicles.find(v => v.id === assignment.vehicleId)
                    return (
                      <tr key={assignment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vehicle?.make} {vehicle?.model}</div>
                          <div className="text-sm text-gray-500">{vehicle?.licensePlate}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{assignment.employeeName}</div>
                          <div className="text-sm text-gray-500">{assignment.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.purpose}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assignment.assignedDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

      {activeTab === 'approvals' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
      </div>
          <div className="p-6">
            <div className="space-y-4">
              {[
                {
                  id: '1',
                  type: 'Vehicle Assignment',
                  employeeName: 'David Lee',
                  employeeId: 'EMP005',
                  details: 'Request for Toyota Camry for client visits',
                  submittedDate: '2024-01-28',
                  priority: 'High'
                },
                {
                  id: '2',
                  type: 'Vehicle Return',
                  employeeName: 'Emma Davis',
                  employeeId: 'EMP006',
                  details: 'Return of Honda Civic after project completion',
                  submittedDate: '2024-01-29',
                  priority: 'Medium'
                }
              ].map(approval => (
                <div key={approval.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{approval.type}</h4>
                      <p className="text-sm text-gray-600">{approval.employeeName} ({approval.employeeId})</p>
                      <p className="text-sm text-gray-500">{approval.details}</p>
                      <p className="text-sm text-gray-500">Submitted: {approval.submittedDate}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        approval.priority === 'High' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
                      }`}>
                        {approval.priority} Priority
                      </span>
                      <div className="mt-2 space-x-2">
                        <button className="text-green-600 hover:text-green-900 text-sm">Approve</button>
                        <button className="text-red-600 hover:text-red-900 text-sm">Reject</button>
                        <button className="text-blue-600 hover:text-blue-900 text-sm">View Details</button>
                      </div>
                    </div>
            </div>
            </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}