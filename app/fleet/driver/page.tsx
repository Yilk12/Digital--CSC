'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import FleetRequestForms from '@/components/fleet/fleet-request-forms'

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

interface Trip {
  id: string
  vehicleId: string
  driverId: string
  startLocation: string
  endLocation: string
  startTime: string
  endTime?: string
  purpose: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  mileageStart: number
  mileageEnd?: number
  fuelUsed?: number
}

export default function DriverPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'trips' | 'vehicle' | 'requests' | 'reports'>('dashboard')
  const [driverName] = useState('John Smith') // This would come from user context
  const [driverId] = useState('DRV001')
  const [requestTab, setRequestTab] = useState<'issue' | 'fuel' | 'maintenance'>('issue')

  const tabs: { id: 'dashboard' | 'trips' | 'vehicle' | 'requests' | 'reports'; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'trips', label: 'Trip Management' },
    { id: 'vehicle', label: 'Vehicle Info' },
    { id: 'requests', label: 'Requests' },
    { id: 'reports', label: 'Reports' },
  ]

  useEffect(() => {
    loadDriverData()
  }, [])

  const loadDriverData = async () => {
    try {
      setLoading(true)
      
      // Load vehicles
      const vehiclesRes = await fetch('/api/fleet/vehicles')
      const vehiclesData = await vehiclesRes.json()
      setVehicles(vehiclesData.items || [])

      // Load driver trips (mock data)
      setTrips([
        {
          id: '1',
          vehicleId: '1',
          driverId: '1',
          startLocation: 'Office',
          endLocation: 'Client Site A',
          startTime: '2024-01-15T09:00:00',
          endTime: '2024-01-15T11:30:00',
          purpose: 'Client meeting',
          status: 'completed',
          mileageStart: 15000,
          mileageEnd: 15045,
          fuelUsed: 2.5
        },
        {
          id: '2',
          vehicleId: '1',
          driverId: '1',
          startLocation: 'Office',
          endLocation: 'Client Site B',
          startTime: '2024-01-16T10:00:00',
          purpose: 'Field visit',
          status: 'in_progress',
          mileageStart: 15045
        }
      ])
    } catch (error) {
      console.error('Error loading driver data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100'
      case 'in_progress': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const assignedVehicle = vehicles.find(v => v.assignedTo === driverId)
  const activeTrip = trips.find(t => t.status === 'in_progress')
  const todayTrips = trips.filter(t => t.startTime.startsWith('2024-01-16'))

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading driver data...</div>
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
            <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome, {driverName} ({driverId})</p>
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned Vehicle</p>
              <p className="text-lg font-semibold text-gray-900">
                {assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model}` : 'None'}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Completed Trips</p>
              <p className="text-2xl font-semibold text-gray-900">{trips.filter(t => t.status === 'completed').length}</p>
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
              <p className="text-sm font-medium text-gray-600">Active Trip</p>
              <p className="text-lg font-semibold text-gray-900">
                {activeTrip ? 'In Progress' : 'None'}
              </p>
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
              <p className="text-sm font-medium text-gray-600">Today's Trips</p>
              <p className="text-2xl font-semibold text-gray-900">{todayTrips.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
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
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Current Trip Status */}
          {activeTrip && (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Current Trip</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
              <div>
                    <h4 className="font-medium text-gray-900">{activeTrip.startLocation} → {activeTrip.endLocation}</h4>
                    <p className="text-sm text-gray-600">Purpose: {activeTrip.purpose}</p>
                    <p className="text-sm text-gray-500">Started: {new Date(activeTrip.startTime).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activeTrip.status)}`}>
                      {(activeTrip.status || 'unknown').replace('_', ' ')}
                    </span>
                    <div className="mt-2 space-x-2">
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                        End Trip
                      </button>
                    </div>
                  </div>
              </div>
              </div>
            </div>
          )}

          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Today's Schedule</h3>
            </div>
            <div className="p-6">
              {todayTrips.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No trips scheduled for today</p>
              ) : (
                <div className="space-y-4">
                  {todayTrips.map(trip => (
                    <div key={trip.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                        <h4 className="font-medium text-gray-900">{trip.startLocation} → {trip.endLocation}</h4>
                        <p className="text-sm text-gray-600">Purpose: {trip.purpose}</p>
                        <p className="text-sm text-gray-500">Time: {new Date(trip.startTime).toLocaleTimeString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                          {(trip.status || 'unknown').replace('_', ' ')}
                        </span>
                        {trip.status === 'scheduled' && (
                          <div className="mt-2">
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                              Start Trip
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                  onClick={() => { setRequestTab('issue'); setActiveTab('requests') }}
                >
                  <div className="font-medium text-gray-900">Report Issue</div>
                  <div className="text-sm text-gray-500">Report vehicle or trip issues</div>
                </button>
                <button
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                  onClick={() => { setRequestTab('fuel'); setActiveTab('requests') }}
                >
                  <div className="font-medium text-gray-900">Fuel Log</div>
                  <div className="text-sm text-gray-500">Log fuel consumption</div>
                </button>
                <button
                  className="p-4 border rounded-lg hover:bg-gray-50 text-left"
                  onClick={() => { setRequestTab('maintenance'); setActiveTab('requests') }}
                >
                  <div className="font-medium text-gray-900">Maintenance</div>
                  <div className="text-sm text-gray-500">Request maintenance</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Requests</h3>
            </div>
            <div className="p-6">
              <FleetRequestForms initialTab={requestTab} key={requestTab} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trips' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Trip Management</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              New Trip
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trips.map(trip => (
                  <tr key={trip.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{trip.startLocation} → {trip.endLocation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(trip.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {trip.endTime ? 
                        `${Math.round((new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / (1000 * 60 * 60) * 10) / 10}h` : 
                        'In Progress'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                        {(trip.status || 'unknown').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {trip.status === 'scheduled' && (
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Start</button>
                      )}
                      {trip.status === 'in_progress' && (
                        <button className="text-green-600 hover:text-green-900 mr-3">End</button>
                      )}
                      <button className="text-gray-600 hover:text-gray-900">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'vehicle' && (
        <div className="space-y-6">
          {assignedVehicle ? (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Assigned Vehicle Details</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Vehicle Information</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Make & Model:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignedVehicle.make} {assignedVehicle.model}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Year:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignedVehicle.year}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">License Plate:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignedVehicle.licensePlate}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Fuel Type:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignedVehicle.fuelType}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Transmission:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignedVehicle.transmission}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Current Mileage:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignedVehicle.mileage.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Status & Actions</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignedVehicle.status)}`}>
                          {(assignedVehicle.status || 'unknown').replace('_', ' ')}
                        </span>
                      </div>
                      <div className="pt-4 space-y-2">
                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                          Report Issue
                        </button>
                        <button
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
                          onClick={() => { setRequestTab('maintenance'); setActiveTab('requests') }}
                        >
                          Request Maintenance
                        </button>
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                          Log Fuel Usage
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">No Vehicle Assigned</h3>
              </div>
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">You don't have a vehicle assigned at the moment.</p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Request Vehicle Assignment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Driver Reports</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Trip Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trips:</span>
                    <span className="font-medium">{trips.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium">{trips.filter(t => t.status === 'completed').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Distance:</span>
                    <span className="font-medium">
                      {trips.reduce((total, trip) => total + ((trip.mileageEnd || 0) - (trip.mileageStart || 0)), 0)} km
                    </span>
                  </div>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Fuel Usage</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Fuel Used:</span>
                    <span className="font-medium">
                      {trips.reduce((total, trip) => total + (trip.fuelUsed || 0), 0)} L
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Efficiency:</span>
                    <span className="font-medium">8.5 L/100km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}