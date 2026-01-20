'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from "@/app/components/toast-provider";
import { Driver } from './types';

interface DriversTabProps {
  drivers: Driver[];
  onDriversUpdate: (drivers: Driver[]) => void;
}

export default function DriversTab({ drivers, onDriversUpdate }: DriversTabProps) {
  const router = useRouter();
  const { show: toast } = useToast();
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [driverDocs, setDriverDocs] = useState<Array<{ id: string; name: string; docType: string; uploadedAt: string; url?: string }>>([]);
  const [uploadingType, setUploadingType] = useState<string>('');

  const loadDrivers = async () => {
    try {
      setDriversLoading(true);
      const token = localStorage.getItem('accessToken') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/driver`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const data = await res.json();
      const driversData = data.data || data.items || data.drivers || data || [];
      onDriversUpdate(driversData);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      toast({
        title: 'Error',
        description: 'Failed to load drivers.',
        variant: 'destructive',
      });
    } finally {
      setDriversLoading(false);
    }
  };

  const getDriverStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getDocTypeColor = (docType: string) => {
    switch (docType) {
      case 'educational_paper':
        return 'bg-blue-100 text-blue-800';
      case 'license_certificate':
        return 'bg-green-100 text-green-800';
      case 'agreement_paper':
        return 'bg-orange-100 text-orange-800';
      case 'other_documents':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const loadDriverDocs = async (driverId: string) => {
    try {
      if (!driverId) return;
      const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(driverId)}/documents`);
      const data = await res.json();
      setDriverDocs(Array.isArray(data.items) ? data.items : []);
    } catch {
      setDriverDocs([]);
    }
  };

  const uploadDriverDoc = async (driverId: string, docType: string, file: File) => {
    if (!driverId) return alert('Select a driver first');
    try {
      setUploadingType(docType);
      const fd = new FormData();
      fd.append('docType', docType);
      fd.append('file', file);
      const res = await fetch(`/api/fleet/drivers/${encodeURIComponent(driverId)}/documents`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      await loadDriverDocs(driverId);
    } catch (e: any) {
      alert(e?.message || 'Upload failed');
    } finally {
      setUploadingType('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Driver Management</h2>
              <p className="text-indigo-100 mt-1">Manage driver profiles and documents</p>
            </div>
          </div>
          <button
            onClick={loadDrivers}
            disabled={driversLoading}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${driversLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{driversLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="p-6">
        {drivers.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Drivers Found</h3>
            <p className="text-gray-400">Get started by adding drivers to your fleet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {drivers.map(driver => (
              <div
                key={driver.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/fleet/drivers/register?driverId=${encodeURIComponent(driver.id)}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    router.push(`/fleet/drivers/register?driverId=${encodeURIComponent(driver.id)}`);
                  }
                }}
                className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {/* Driver Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {driver.firstName?.[0]}{driver.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {driver.firstName} {driver.lastName}
                      </h3>
                      <p className="text-blue-100 text-sm">{driver.role}</p>
                    </div>
                  </div>
                </div>

                {/* Driver Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDriverStatusColor(driver.isActive ? 'active' : 'inactive')}`}>
                      {driver.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Phone</span>
                    <span className="text-sm text-gray-900">{driver.phone || 'Not provided'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Email</span>
                    <span className="text-sm text-gray-900 truncate" title={driver.email}>
                      {driver.email}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Member since</span>
                    <span className="text-sm text-gray-900">
                      {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-6 py-4 bg-white border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    
                    <button
                      onClick={(e) => { e.stopPropagation() }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Remove</span>
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDriverId(driver.id);
                        loadDriverDocs(driver.id);
                        setTimeout(() => {
                          document.getElementById('driver-docs-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Docs</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents Panel */}
      <div id="driver-docs-panel" className="border-t border-gray-200">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Driver Documents</h3>
              <p className="text-gray-600 text-sm">
                {!selectedDriverId 
                  ? "Select a driver and click 'Docs' to manage documents"
                  : `Managing documents for driver: ${selectedDriverId.slice(0, 8)}...`
                }
              </p>
            </div>
          </div>
        </div>

        {selectedDriverId && (
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Educational Paper */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Educational Paper</h4>
                    <p className="text-sm text-gray-500">Academic qualifications</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={uploadingType === 'educational_paper'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDriverDoc(selectedDriverId, 'educational_paper', f);
                    e.currentTarget.value = '';
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* License Certificate */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">License Certificate</h4>
                    <p className="text-sm text-gray-500">Driving license documents</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={uploadingType === 'license_certificate'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDriverDoc(selectedDriverId, 'license_certificate', f);
                    e.currentTarget.value = '';
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>

              {/* Other Documents */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Other Documents</h4>
                    <p className="text-sm text-gray-500">Additional supporting files</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={uploadingType === 'other_documents'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDriverDoc(selectedDriverId, 'other_documents', f);
                    e.currentTarget.value = '';
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              {/* Agreement Paper */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Agreement Paper</h4>
                    <p className="text-sm text-gray-500">Contract and agreement files</p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  disabled={uploadingType === 'agreement_paper'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadDriverDoc(selectedDriverId, 'agreement_paper', f);
                    e.currentTarget.value = '';
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
              {driverDocs.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {driverDocs.map(doc => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDocTypeColor(doc.docType)}`}>
                          {doc.docType.replace('_', ' ')}
                        </span>
                        {doc.url && (
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                        {doc.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}