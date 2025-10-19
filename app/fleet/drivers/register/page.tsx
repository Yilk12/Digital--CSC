'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DriverFormData {
  firstName: string
  lastName: string
  employeeId: string
  email: string
  phone: string
  address: string
  dateOfBirth: string
  licenseNumber: string
  licenseClass: string
  licenseExpiry: string
  licenseIssuedBy: string
  department: string
  position: string
  hireDate: string
  status: string
  emergencyContact: string
  emergencyPhone: string
  medicalClearance: string
  backgroundCheck: string
  trainingCompleted: string[]
  notes: string
  carAssignment: string
  carCategory: string
  carModel: string
  carMake: string
  carYear: string
  carLicensePlate: string
}

export default function DriverRegisterPage() {
  const [formData, setFormData] = useState<DriverFormData>({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    licenseNumber: '',
    licenseClass: '',
    licenseExpiry: '',
    licenseIssuedBy: '',
    department: '',
    position: '',
    hireDate: '',
    status: 'active',
    emergencyContact: '',
    emergencyPhone: '',
    medicalClearance: '',
    backgroundCheck: '',
    trainingCompleted: [],
    notes: '',
    carAssignment: '',
    carCategory: '',
    carModel: '',
    carMake: '',
    carYear: '',
    carLicensePlate: ''
  })

  const [selectedTraining, setSelectedTraining] = useState<string[]>([])

  // Driver documents state
  interface DriverDocumentItem {
    id: string
    name: string
    docType: string
    uploadedAt: string
    url?: string
    size?: number
    mimeType?: string
  }

  const [docs, setDocs] = useState<DriverDocumentItem[]>([])
  const [uploadingType, setUploadingType] = useState<string>('')

  useEffect(() => {
    const id = formData.employeeId?.trim()
    if (id) {
      loadDocs(id)
    } else {
      setDocs([])
    }
  }, [formData.employeeId])

  async function loadDocs(driverId: string) {
    try {
      const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(driverId)}/documents`)
      const data = await res.json()
      setDocs(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      // ignore in demo
    }
  }

  async function uploadDoc(docType: string, file: File) {
    if (!formData.employeeId?.trim()) {
      alert('Please enter Employee ID before uploading documents.')
      return
    }
    const driverId = formData.employeeId.trim()
    try {
      setUploadingType(docType)
      const fd = new FormData()
      fd.append('docType', docType)
      fd.append('file', file)
      const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(driverId)}/documents`, {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) throw new Error('Upload failed')
      await loadDocs(driverId)
    } catch (e: any) {
      alert(e?.message || 'Upload failed')
    } finally {
      setUploadingType('')
    }
  }

  const trainingOptions = [
    'Defensive Driving',
    'Vehicle Safety',
    'Emergency Procedures',
    'Fleet Management',
    'Customer Service',
    'Route Planning',
    'Fuel Efficiency',
    'Vehicle Maintenance'
  ]

  // Mock data for cars
  const newCars = [
    { id: '1', make: 'Toyota', model: 'Camry', year: '2024', licensePlate: 'NEW-001' },
    { id: '2', make: 'Honda', model: 'Civic', year: '2024', licensePlate: 'NEW-002' },
    { id: '3', make: 'Ford', model: 'Focus', year: '2024', licensePlate: 'NEW-003' },
    { id: '4', make: 'Nissan', model: 'Altima', year: '2024', licensePlate: 'NEW-004' }
  ]

  const usedCars = [
    { id: '5', make: 'Toyota', model: 'Corolla', year: '2022', licensePlate: 'USED-001' },
    { id: '6', make: 'Honda', model: 'Accord', year: '2021', licensePlate: 'USED-002' },
    { id: '7', make: 'Ford', model: 'Escape', year: '2020', licensePlate: 'USED-003' },
    { id: '8', make: 'Chevrolet', model: 'Malibu', year: '2023', licensePlate: 'USED-004' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTrainingChange = (training: string) => {
    const updatedTraining = selectedTraining.includes(training)
      ? selectedTraining.filter(t => t !== training)
      : [...selectedTraining, training]
    
    setSelectedTraining(updatedTraining)
    setFormData(prev => ({
      ...prev,
      trainingCompleted: updatedTraining
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Driver Registration Data:', formData)
    
    // Prepare car assignment summary
    let carSummary = ''
    if (formData.carAssignment === 'assigned' && formData.carModel) {
      const selectedCar = formData.carCategory === 'new' 
        ? newCars.find(car => car.id === formData.carModel)
        : usedCars.find(car => car.id === formData.carModel)
      
      carSummary = `\n\nCar Assignment: ${formData.carCategory === 'new' ? 'New' : 'Used'} Car - ${selectedCar?.make} ${selectedCar?.model} ${selectedCar?.year} (${selectedCar?.licensePlate})`
    } else if (formData.carAssignment === 'not_assigned') {
      carSummary = '\n\nCar Assignment: No car assigned'
    }
    
    alert(`Driver registered successfully!${carSummary}`)
    
    // Reset form
    setFormData({
      firstName: '',
      lastName: '',
      employeeId: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      licenseNumber: '',
      licenseClass: '',
      licenseExpiry: '',
      licenseIssuedBy: '',
      department: '',
      position: '',
      hireDate: '',
      status: 'active',
      emergencyContact: '',
      emergencyPhone: '',
      medicalClearance: '',
      backgroundCheck: '',
      trainingCompleted: [],
      notes: '',
      carAssignment: '',
      carCategory: '',
      carModel: '',
      carMake: '',
      carYear: '',
      carLicensePlate: ''
    })
    setSelectedTraining([])
  }

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      employeeId: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      licenseNumber: '',
      licenseClass: '',
      licenseExpiry: '',
      licenseIssuedBy: '',
      department: '',
      position: '',
      hireDate: '',
      status: 'active',
      emergencyContact: '',
      emergencyPhone: '',
      medicalClearance: '',
      backgroundCheck: '',
      trainingCompleted: [],
      notes: '',
      carAssignment: '',
      carCategory: '',
      carModel: '',
      carMake: '',
      carYear: '',
      carLicensePlate: ''
    })
    setSelectedTraining([])
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Driver Registration</h1>
            <p className="text-gray-600 mt-2">Register new drivers for fleet operations</p>
          </div>
          <Link 
            href="/fleet/manager" 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            ← Back to Fleet Manager
          </Link>
        </div>
      </div>

      {/* Registration Form */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Driver Information</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter last name"
                  required
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="driver@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
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

          {/* Employment Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Employment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select department</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                  <option value="operations">Operations</option>
                  <option value="logistics">Logistics</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="commissioner_office">Commissioner Office</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position *
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Sales Representative"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hire Date *
                </label>
                <input
                  type="date"
                  name="hireDate"
                  value={formData.hireDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="probation">Probation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Car Assignment */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Car Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Car Assignment *
                </label>
                <select
                  name="carAssignment"
                  value={formData.carAssignment}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select car assignment</option>
                  <option value="assigned">Assign Car</option>
                  <option value="not_assigned">No Car Assignment</option>
                </select>
              </div>

              {formData.carAssignment === 'assigned' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Car Category *
                    </label>
                    <select
                      name="carCategory"
                      value={formData.carCategory}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required={formData.carAssignment === 'assigned'}
                    >
                      <option value="">Select car category</option>
                      <option value="new">New Car (with model number)</option>
                      <option value="used">Used Car (no model number)</option>
                    </select>
                  </div>

                  {formData.carCategory === 'new' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select New Car *
                        </label>
                        <select
                          name="carModel"
                          value={formData.carModel}
                          onChange={(e) => {
                            const selectedCar = newCars.find(car => car.id === e.target.value)
                            setFormData(prev => ({
                              ...prev,
                              carModel: e.target.value,
                              carMake: selectedCar?.make || '',
                              carYear: selectedCar?.year || '',
                              carLicensePlate: selectedCar?.licensePlate || ''
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required={formData.carCategory === 'new'}
                        >
                          <option value="">Select new car</option>
                          {newCars.map(car => (
                            <option key={car.id} value={car.id}>
                              {car.make} {car.model} {car.year} - {car.licensePlate}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {formData.carCategory === 'used' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Used Car *
                        </label>
                        <select
                          name="carModel"
                          value={formData.carModel}
                          onChange={(e) => {
                            const selectedCar = usedCars.find(car => car.id === e.target.value)
                            setFormData(prev => ({
                              ...prev,
                              carModel: e.target.value,
                              carMake: selectedCar?.make || '',
                              carYear: selectedCar?.year || '',
                              carLicensePlate: selectedCar?.licensePlate || ''
                            }))
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required={formData.carCategory === 'used'}
                        >
                          <option value="">Select used car</option>
                          {usedCars.map(car => (
                            <option key={car.id} value={car.id}>
                              {car.make} {car.model} {car.year} - {car.licensePlate}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {formData.carModel && (
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Selected Car Details:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Make:</span>
                            <span className="ml-2 font-medium">{formData.carMake}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Model:</span>
                            <span className="ml-2 font-medium">
                              {formData.carCategory === 'new' 
                                ? newCars.find(car => car.id === formData.carModel)?.model 
                                : usedCars.find(car => car.id === formData.carModel)?.model
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Year:</span>
                            <span className="ml-2 font-medium">{formData.carYear}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">License Plate:</span>
                            <span className="ml-2 font-medium">{formData.carLicensePlate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
                  name="emergencyContact"
                  value={formData.emergencyContact}
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
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>

          {/* Compliance & Training */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance & Training</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Clearance *
                </label>
                <select
                  name="medicalClearance"
                  value={formData.medicalClearance}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select status</option>
                  <option value="valid">Valid</option>
                  <option value="expired">Expired</option>
                  <option value="pending">Pending</option>
                  <option value="not_required">Not Required</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Background Check *
                </label>
                <select
                  name="backgroundCheck"
                  value={formData.backgroundCheck}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select status</option>
                  <option value="passed">Passed</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="not_required">Not Required</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Training Completed
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {trainingOptions.map(training => (
                  <label key={training} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTraining.includes(training)}
                      onChange={() => handleTrainingChange(training)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{training}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional notes, special requirements, or comments..."
              />
            </div>
          </div>

          {/* Driver Documents (Attachments) */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Driver Documents (Attachments)</h3>
            <p className="text-sm text-gray-600 mb-4">Attach scanned documents. Please enter Employee ID first to link uploads.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Educational paper */}
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Educational paper</div>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadDoc('educational_paper', f)
                    e.currentTarget.value = ''
                  }}
                  accept="application/pdf,image/*"
                  className="block w-full text-sm"
                  disabled={!formData.employeeId || uploadingType==='educational_paper'}
                />
                <div className="text-xs text-gray-500 mt-1">PDF or images</div>
              </div>

              {/* License certificate */}
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">License certificate</div>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadDoc('license_certificate', f)
                    e.currentTarget.value = ''
                  }}
                  accept="application/pdf,image/*"
                  className="block w-full text-sm"
                  disabled={!formData.employeeId || uploadingType==='license_certificate'}
                />
                <div className="text-xs text-gray-500 mt-1">PDF or images</div>
              </div>

              {/* Any documents */}
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Any documents</div>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadDoc('other_documents', f)
                    e.currentTarget.value = ''
                  }}
                  accept="application/pdf,image/*"
                  className="block w-full text-sm"
                  disabled={!formData.employeeId || uploadingType==='other_documents'}
                />
                <div className="text-xs text-gray-500 mt-1">PDF or images</div>
              </div>

              {/* Agreement paper */}
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-2">Agreement paper</div>
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) uploadDoc('agreement_paper', f)
                    e.currentTarget.value = ''
                  }}
                  accept="application/pdf,image/*"
                  className="block w-full text-sm"
                  disabled={!formData.employeeId || uploadingType==='agreement_paper'}
                />
                <div className="text-xs text-gray-500 mt-1">PDF or images</div>
              </div>
            </div>

            {/* Uploaded documents list */}
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Uploaded Documents</h4>
              {(!docs || docs.length === 0) ? (
                <div className="text-sm text-gray-500">No documents uploaded yet.</div>
              ) : (
                <ul className="divide-y">
                  {docs.map(d => (
                    <li key={d.id} className="py-2 text-sm flex items-center justify-between">
                      <div>
                        <div className="font-medium">{d.name}</div>
                        <div className="text-gray-500">{d.docType} • {new Date(d.uploadedAt).toLocaleString()}</div>
                      </div>
                      {d.url && (
                        <a href={d.url} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">View</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
              Register Driver
            </button>
          </div>
        </form>
      </div>

      {/* Quick Reference */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Quick Reference</h3>
        <div className="text-sm text-blue-800 space-y-4">
          <div>
            <p><strong>License Classes:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>Class A:</strong> Commercial vehicles over 26,000 lbs</li>
              <li><strong>Class B:</strong> Commercial vehicles 26,000 lbs or less</li>
              <li><strong>Class C:</strong> Commercial vehicles under 26,000 lbs with passengers</li>
              <li><strong>Class D:</strong> Regular passenger vehicles</li>
              <li><strong>Class M:</strong> Motorcycles and motorized bicycles</li>
            </ul>
          </div>
          <div>
            <p><strong>Car Assignment:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><strong>New Cars:</strong> Latest model vehicles with model numbers (2024 models)</li>
              <li><strong>Used Cars:</strong> Previously owned vehicles without model numbers (2020-2023 models)</li>
              <li><strong>No Assignment:</strong> Driver will not be assigned a vehicle initially</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
