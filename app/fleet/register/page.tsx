"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { getCurrentUserRoles } from '@/app/lib/auth'

export default function VehicleAssignmentRegistrationPage() {
  const roles = getCurrentUserRoles().map(r => r.toLowerCase())
  const canManager = roles.includes('manager') || roles.includes('fleet_manager')

  if (!canManager) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Access denied</h1>
        <p style={{ color: '#6b7280', marginBottom: 16 }}>Only Fleet Managers can access the Vehicle Assignment Registration page.</p>
        <Link href="/fleet" style={{ color: '#2563eb', textDecoration: 'underline' }}>Back to Fleet Hub</Link>
      </div>
    )
  }
  const [formData, setFormData] = useState({
    // Vehicle Information
    vehicleMake: '',
    vehicleModel: '',
    vehicleType: '',
    licensePlate: '',
    vin: '',
    yearOfManufacture: '',
    odometerReading: '',
    fuelType: '',
    condition: '',
    
    // Department & User Details
    departmentName: '',
    departmentHeadName: '',
    employeeId: '',
    position: '',
    contactNumber: '',
    emailAddress: '',
    
    // Assignment Details
    assignmentDate: '',
    expectedReturnDate: '',
    purpose: '',
    authorizedTravelArea: '',
    
    // Car Manager Details
    carManagerName: '',
    carManagerPosition: '',
    carManagerSignature: '',
    carManagerDate: '',
    
    // Checklist
    vehicleKeysHandedOver: false,
    insuranceDocumentsProvided: false,
    fuelCardProvided: false,
    logbookIssued: false,
    vehicleInspectionCompleted: false,
    
    // Administrative Use
    trackingSystemEntryConfirmed: false,
    assetRegisterUpdated: false
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    alert('Vehicle Assignment Registration Form submitted successfully!')
  }

  const handleReset = () => {
    setFormData({
      vehicleMake: '',
      vehicleModel: '',
      vehicleType: '',
      licensePlate: '',
      vin: '',
      yearOfManufacture: '',
      odometerReading: '',
      fuelType: '',
      condition: '',
      departmentName: '',
      departmentHeadName: '',
      employeeId: '',
      position: '',
      contactNumber: '',
      emailAddress: '',
      assignmentDate: '',
      expectedReturnDate: '',
      purpose: '',
      authorizedTravelArea: '',
      carManagerName: '',
      carManagerPosition: '',
      carManagerSignature: '',
      carManagerDate: '',
      vehicleKeysHandedOver: false,
      insuranceDocumentsProvided: false,
      fuelCardProvided: false,
      logbookIssued: false,
      vehicleInspectionCompleted: false,
      trackingSystemEntryConfirmed: false,
      assetRegisterUpdated: false
    })
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 10 }}>
          Vehicle Assignment Registration Form
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          Departmental Vehicle Registration Form
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#fff', padding: 30, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        
        {/* Vehicle Information Section */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
            2. Vehicle Information
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Vehicle Make *
              </label>
              <input
                type="text"
                value={formData.vehicleMake}
                onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="e.g., Toyota, Ford, Honda"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Vehicle Model *
              </label>
              <input
                type="text"
                value={formData.vehicleModel}
                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="e.g., Corolla, Focus, Civic"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Vehicle Type *
              </label>
              <select
                value={formData.vehicleType}
                onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              >
                <option value="">Select Vehicle Type</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Coupe">Coupe</option>
                <option value="Convertible">Convertible</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                License Plate Number *
              </label>
              <input
                type="text"
                value={formData.licensePlate}
                onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="e.g., ABC-1234"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                VIN (Vehicle Identification Number) *
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="17-character VIN"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Year of Manufacture *
              </label>
              <select
                value={formData.yearOfManufacture}
                onChange={(e) => handleInputChange('yearOfManufacture', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              >
                <option value="">Select Year</option>
                {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Current Odometer Reading *
              </label>
              <input
                type="number"
                value={formData.odometerReading}
                onChange={(e) => handleInputChange('odometerReading', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Mileage in km"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Fuel Type *
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => handleInputChange('fuelType', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              >
                <option value="">Select Fuel Type</option>
                <option value="Gasoline">Gasoline</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
                <option value="LPG">LPG</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 10, color: '#374151' }}>
              Condition at Time of Handover *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
              {['Excellent', 'Good', 'Fair', 'Damages noted'].map(condition => (
                <label key={condition} style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                  <input
                    type="radio"
                    name="condition"
                    value={condition}
                    checked={formData.condition === condition}
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Department & User Details Section */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
            3. Department & User Details
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Department Name *
              </label>
              <input
                type="text"
                value={formData.departmentName}
                onChange={(e) => handleInputChange('departmentName', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="e.g., Operations, Finance, HR"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Department Head Full Name *
              </label>
              <input
                type="text"
                value={formData.departmentHeadName}
                onChange={(e) => handleInputChange('departmentHeadName', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Full name of department head"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Employee ID *
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => handleInputChange('employeeId', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Employee identification number"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Position/Title *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Job title or position"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Contact Number *
              </label>
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Phone number"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Email Address *
              </label>
              <input
                type="email"
                value={formData.emailAddress}
                onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Email address"
              />
            </div>
          </div>
        </div>

        {/* Assignment Details Section */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
            4. Assignment Details
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Date of Assignment *
              </label>
              <input
                type="date"
                value={formData.assignmentDate}
                onChange={(e) => handleInputChange('assignmentDate', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Expected Return Date
              </label>
              <input
                type="date"
                value={formData.expectedReturnDate}
                onChange={(e) => handleInputChange('expectedReturnDate', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Purpose of Assignment *
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              >
                <option value="">Select Purpose</option>
                <option value="Official duties">Official duties</option>
                <option value="Daily commute">Daily commute</option>
                <option value="Field visits">Field visits</option>
                <option value="Client meetings">Client meetings</option>
                <option value="Training">Training</option>
                <option value="Emergency response">Emergency response</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Authorized Travel Area *
              </label>
              <select
                value={formData.authorizedTravelArea}
                onChange={(e) => handleInputChange('authorizedTravelArea', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              >
                <option value="">Select Travel Area</option>
                <option value="City only">City only</option>
                <option value="Inter-city">Inter-city</option>
                <option value="Nationwide">Nationwide</option>
                <option value="International">International</option>
              </select>
            </div>
          </div>
        </div>

        {/* Car Manager Details Section */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
            5. Car Manager Details
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Name of Car Manager *
              </label>
              <input
                type="text"
                value={formData.carManagerName}
                onChange={(e) => handleInputChange('carManagerName', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Full name of car manager"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Position *
              </label>
              <input
                type="text"
                value={formData.carManagerPosition}
                onChange={(e) => handleInputChange('carManagerPosition', e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Position/Title"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Signature
              </label>
              <input
                type="text"
                value={formData.carManagerSignature}
                onChange={(e) => handleInputChange('carManagerSignature', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                placeholder="Digital signature or initials"
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#374151' }}>
                Date
              </label>
              <input
                type="date"
                value={formData.carManagerDate}
                onChange={(e) => handleInputChange('carManagerDate', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Section */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
            6. Checklist (Optional but useful)
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
            {[
              { key: 'vehicleKeysHandedOver', label: 'Vehicle keys handed over' },
              { key: 'insuranceDocumentsProvided', label: 'Insurance documents provided' },
              { key: 'fuelCardProvided', label: 'Fuel card provided (if applicable)' },
              { key: 'logbookIssued', label: 'Logbook issued' },
              { key: 'vehicleInspectionCompleted', label: 'Vehicle inspection completed' }
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onChange={(e) => handleInputChange(item.key, e.target.checked)}
                  style={{ marginRight: 10, transform: 'scale(1.2)' }}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        {/* Administrative Use Section */}
        <div style={{ marginBottom: 30 }}>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 20, borderBottom: '2px solid #e5e7eb', paddingBottom: 10 }}>
            🔒 Administrative Use Only
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 15 }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={formData.trackingSystemEntryConfirmed}
                onChange={(e) => handleInputChange('trackingSystemEntryConfirmed', e.target.checked)}
                style={{ marginRight: 10, transform: 'scale(1.2)' }}
              />
              Entry in vehicle tracking system confirmed
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
              <input
                type="checkbox"
                checked={formData.assetRegisterUpdated}
                onChange={(e) => handleInputChange('assetRegisterUpdated', e.target.checked)}
                style={{ marginRight: 10, transform: 'scale(1.2)' }}
              />
              Asset register updated
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginTop: 40 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              backgroundColor: '#fff',
              color: '#374151',
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Reset Form
          </button>
          
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: 6,
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: 14,
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Submit Registration Form
          </button>
        </div>
      </form>
    </div>
  )
}
