'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DriverFormData {
  employeeId: string
  dateOfBirth: string
  address: string
  licenseNumber: string
  licenseClass: string
  licenseExpiry: string
  licenseIssuedBy: string
  emergencyContactName: string
  emergencyContactPhone: string
  notes: string
}

export default function DriverRegisterPage() {
  const [formData, setFormData] = useState<DriverFormData>({
    employeeId: '',
    dateOfBirth: '',
    address: '',
    licenseNumber: '',
    licenseClass: '',
    licenseExpiry: '',
    licenseIssuedBy: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    notes: '',
  })

  // Car assignment UI state
  const [carAssignment, setCarAssignment] = useState<'none' | 'new' | 'used'>('none')
  const [selectedCarId, setSelectedCarId] = useState<string>('')
  const [licenceImageFile, setLicenceImageFile] = useState<File | null>(null)

  // Vehicle lists from backend
  type VehicleItem = { id: string; plate: string; make?: string | null; model?: string | null; year?: number | null; type?: 'NEW'|'USED' }
  const [newCars, setNewCars] = useState<VehicleItem[]>([])
  const [usedCars, setUsedCars] = useState<VehicleItem[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [vehiclesError, setVehiclesError] = useState<string>('')

  // Load vehicles on mount
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setVehiclesLoading(true)
        setVehiclesError('')
        const token = localStorage.getItem('accessToken') || ''
        const base = process.env.NEXT_PUBLIC_API_URL || ''
        const [newRes, usedRes] = await Promise.all([
          fetch(`${base}/api/fleet/vehicles?type=NEW`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${base}/api/fleet/vehicles?type=USED`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!newRes.ok || !usedRes.ok) throw new Error('Failed to load vehicles')
        const [newData, usedData] = await Promise.all([newRes.json(), usedRes.json()])
        // The service returns findMany directly; ensure arrays
        setNewCars(Array.isArray(newData) ? newData : Array.isArray(newData?.data) ? newData.data : [])
        setUsedCars(Array.isArray(usedData) ? usedData : Array.isArray(usedData?.data) ? usedData.data : [])
      } catch (e: any) {
        setVehiclesError(e?.message || 'Could not load vehicles')
        setNewCars([])
        setUsedCars([])
      } finally {
        setVehiclesLoading(false)
      }
    }
    loadVehicles()
  }, [])

  // Users from admin list to select a driver
  type DriverUser = { id: string; firstName?: string; lastName?: string; name?: string; email?: string; role?: string }
  const [drivers, setDrivers] = useState<DriverUser[]>([])
  const [driversLoading, setDriversLoading] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string>("")

  useEffect(() => {
    // Load users with Driver role from admin list to populate select
    const loadDrivers = async () => {
      try {
        setDriversLoading(true)
        const res = await fetch(`/api/users?page=1&pageSize=200&role=Driver&sort=name:asc`)
        const data = await res.json().catch(() => ({}))
        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
        setDrivers(items)
      } catch {
        setDrivers([])
      } finally {
        setDriversLoading(false)
      }
    }
    loadDrivers()
  }, [])

  // Prefill from query parameter when navigating from Fleet Manager
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const sp = new URLSearchParams(window.location.search)
      const driverId = sp.get('driverId') || ''
      if (driverId) {
        setSelectedDriverId(driverId)
      }
    } catch {}
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!selectedDriverId) {
        alert('Please select a driver user to continue.')
        return
      }
      // Determine vehicleId from assignment
      const computedVehicleId = carAssignment === 'none' ? null : (selectedCarId || null)

      // Optional: upload licence image first if provided
      let licenceCertificateUrl: string | null = null
      if (licenceImageFile) {
        const fd = new FormData()
        fd.append('file', licenceImageFile)
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
          method: 'POST',
          body: fd,
        })
        if (!uploadRes.ok) throw new Error('Failed to upload licence image')
        const uploadJson = await uploadRes.json().catch(()=> ({}))
        licenceCertificateUrl = uploadJson?.url || uploadJson?.path || uploadJson?.data?.url || null
      }
      // Prepare the data for backend
      const submitData = {
        empId: formData.employeeId,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address || null,
        licenceNumber: formData.licenseNumber,
        licenceClass: formData.licenseClass,
        licenceExpiredDate: formData.licenseExpiry,
        issuedBy: formData.licenseIssuedBy,
        vehicleId: computedVehicleId,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        additionalInformation: formData.notes || null,
        licenceCertificate: licenceCertificateUrl,
      }

      // Send to backend
      const token = localStorage.getItem('accessToken') || ''
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/driver-details/${encodeURIComponent(selectedDriverId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        throw new Error('Failed to register driver')
      }

      await response.json().catch(()=>null)
      alert('Driver details saved successfully!')
      
      // Reset form
      handleReset()
      
    } catch (error) {
      console.error('Error registering driver:', error)
      alert('Failed to register driver. Please try again.')
    }
  }

  const handleReset = () => {
    setFormData({
      employeeId: '',
      address: '',
      dateOfBirth: '',
      licenseNumber: '',
      licenseClass: '',
      licenseExpiry: '',
      licenseIssuedBy: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: '',
    })
    setCarAssignment('none')
    setSelectedCarId('')
    setLicenceImageFile(null)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div />
          <Link 
            href="/fleet/manager" 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Fleet Manager
          </Link>
        </div>
      </div>

      {/* Driver Selection and Registration Form */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Driver Details</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
         

          {/* Personal Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., EMP001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full address"
                  required
                />
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Driver's License Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter license number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Class *
                </label>
                <select
                  name="licenseClass"
                  value={formData.licenseClass}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select license class</option>
                  <option value="A">Class A (Commercial)</option>
                  <option value="B">Class B (Commercial)</option>
                  <option value="C">Class C (Commercial)</option>
                  <option value="D">Class D (Regular)</option>
                  <option value="M">Class M (Motorcycle)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Expiry Date *
                </label>
                <input
                  type="date"
                  name="licenseExpiry"
                  value={formData.licenseExpiry}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issued By *
                </label>
                <input
                  type="text"
                  name="licenseIssuedBy"
                  value={formData.licenseIssuedBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., DMV California"
                  required
                />
              </div>
            </div>
          </div>

          {/* Car Assignment */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Car Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment *</label>
                <select
                  value={carAssignment}
                  onChange={(e)=>{
                    const v = e.target.value as 'none'|'new'|'used'
                    setCarAssignment(v)
                    if (v === 'none') setSelectedCarId('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="none">No Car Assignment</option>
                  <option value="new">New Car</option>
                  <option value="used">Used Car</option>
                </select>
              </div>

              {carAssignment !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {carAssignment === 'new' ? 'Select New Car *' : 'Select Used Car *'}
                  </label>
                  <select
                    value={selectedCarId}
                    onChange={(e)=> setSelectedCarId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">{carAssignment === 'new' ? 'Select new car' : 'Select used car'}</option>
                    {(carAssignment === 'new' ? newCars : usedCars).map(car => (
                      <option key={car.id} value={car.id}>
                        {car.make} {car.model} {car.year} - {car.plate}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter emergency contact name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional information about the driver..."
              />
            </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Licence Image (Optional)</label>
            
            {/* File input with hidden native input and custom styling */}
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 5MB)</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setLicenceImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview section (optional) */}
            {licenceImageFile && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                  <img 
                    src={URL.createObjectURL(licenceImageFile)} 
                    alt="Licence preview" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setLicenceImageFile(null)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">Upload a photo/scan of the driver's licence.</p>
          </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}