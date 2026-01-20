'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useToast } from "@/app/components/toast-provider"
import { Search, ArrowLeft, Car, User, Filter, Check, Loader2 } from 'lucide-react'

interface VehicleDriver {
  vehicleId: string
  plate: string
  make: string
  model: string
  year: number
  driver: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}

export default function VehicleDriverPage() {
  const [data, setData] = useState<VehicleDriver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])
  const [updating, setUpdating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const { show: toast } = useToast()

  const params = useParams()
  const [effectiveRequestIds, setEffectiveRequestIds] = useState<string[]>([])

  // Support both single requestId from the route and multiple from the query string (?requestIds=1,2,3)
  useEffect(() => {
    const baseIds: string[] = params?.requestId ? [String(params.requestId)] : []
    if (typeof window === 'undefined') {
      setEffectiveRequestIds(baseIds)
      return
    }
    try {
      const sp = new URLSearchParams(window.location.search)
      const requestIdsFromQuery = sp.get('requestIds')
      const fromQuery = requestIdsFromQuery
        ? requestIdsFromQuery.split(',').map((id) => id.trim()).filter(Boolean)
        : []
      setEffectiveRequestIds(fromQuery.length ? fromQuery : baseIds)
    } catch {
      setEffectiveRequestIds(baseIds)
    }
  }, [params])

  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('accessToken') || ''
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicle-driver`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data')
        toast({
          title: "Error",
          description: "Failed to load vehicles data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Filter and search functionality
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${item.driver.firstName} ${item.driver.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = filterRole === 'all' || item.driver.role === filterRole
      
      return matchesSearch && matchesRole
    })
  }, [data, searchTerm, filterRole])

  // Get unique roles for filter
  const roles = useMemo(() => {
    const uniqueRoles = Array.from(new Set(data.map(item => item.driver.role)))
    return ['all', ...uniqueRoles]
  }, [data])

  // Handle checkbox toggle
  const toggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicles(prev =>
      prev.includes(vehicleId)
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    )
  }

  // Handle Assign Request button
  const handleAssignRequest = async () => {
    if (!effectiveRequestIds.length) {
      toast({
        title: "Error",
        description: "No request ID(s) found in URL!",
        variant: "destructive"
      })
      return
    }

    if (selectedVehicles.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one vehicle.",
        variant: "destructive"
      })
      return
    }

    try {
      setUpdating(true)
      const token = localStorage.getItem('accessToken') || ''
      if (!token) throw new Error('Unauthorized')

      // Decide between single-request and multi-request assignment based on how many IDs we have
      const isMulti = effectiveRequestIds.length > 1

      if (isMulti) {
        // Multi-request: assign selected vehicle(s) to all requestIds via new endpoint
        await Promise.all(
          selectedVehicles.map((vehicleId) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles/${vehicleId}/assign-requests`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ requestIds: effectiveRequestIds }),
            })
          )
        )
      } else {
        // Single-request: keep existing behavior
        const singleId = effectiveRequestIds[0]
        await Promise.all(
          selectedVehicles.map((vehicleId) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles/${vehicleId}/assign-request`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ requestId: singleId }),
            })
          )
        )
      }

      toast({
        title: "Success",
        description: `Request(s) assigned successfully to ${selectedVehicles.length} vehicle(s)!`,
        variant: "default"
      })
      
      setSelectedVehicles([])

      // Refresh list
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicle-driver`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(await res.json())
    } catch (err: any) {
      console.error('Error assigning request:', err)
      toast({
        title: "Error",
        description: err.message || "Failed to assign request",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading vehicles and drivers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/fleet/manager" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm hover:shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Manager
            </Link>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Fleet Management
                </h1>
                <p className="text-gray-600">
                  Manage vehicles and assign drivers to requests
                </p>
              </div>
              
              <button
                onClick={handleAssignRequest}
                disabled={updating || selectedVehicles.length === 0}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  updating || selectedVehicles.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {updating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {updating ? 'Assigning...' : `Assign to Request (${selectedVehicles.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vehicles, plates, drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role === 'all' ? 'All Roles' : role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
            <span>Total: {data.length} vehicles</span>
            <span>Showing: {filteredData.length} vehicles</span>
            <span>Selected: {selectedVehicles.length} vehicles</span>
          </div>
        </div>

        {/* Vehicles Grid */}
        {filteredData.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterRole !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No vehicles available in the system'
              }
            </p>
            {(searchTerm || filterRole !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilterRole('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredData.map(item => (
              <div
                key={item.vehicleId}
                className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-300 hover:shadow-lg overflow-hidden ${
                  selectedVehicles.includes(item.vehicleId) 
                    ? 'border-blue-500 ring-4 ring-blue-100' 
                    : 'border-white hover:border-gray-100'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Vehicle #{item.vehicleId.slice(-6)}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.includes(item.vehicleId)}
                      onChange={() => toggleVehicleSelection(item.vehicleId)}
                      className="sr-only peer"
                    />
                    <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${
                      selectedVehicles.includes(item.vehicleId)
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}>
                      {selectedVehicles.includes(item.vehicleId) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </label>
                </div>

                {/* Vehicle Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {item.make} {item.model}
                      </h3>
                      <p className="text-gray-600 text-sm">{item.year}</p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {item.plate}
                    </div>
                  </div>

                  {/* Driver Info */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {item.driver.firstName} {item.driver.lastName}
                        </h4>
                        <span className="text-sm text-gray-600">{item.driver.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}