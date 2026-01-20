'use client';

import { useState, useEffect } from 'react';
import { useToast } from "@/app/components/toast-provider";
import AttachmentUploader from '@/app/components/attachment-uploader';
import { Vehicle, UploadItem } from './types';

interface MaintainedTabProps {
  vehicles: Vehicle[];
  onVehiclesUpdate: (vehicles: Vehicle[]) => void;
}

interface MaintainedHistoryRow {
  vehicleLabel: string;
  vehicleId: string;
  description: string;
  actualCost?: number;
  completionDate?: string;
  savedAt: string;
}

export default function MaintainedTab({ vehicles, onVehiclesUpdate }: MaintainedTabProps) {
  const { show: toast } = useToast();

  const [maintainedForm, setMaintainedForm] = useState<{
    vehicleId: string;
    description: string;
    actualCost?: number;
    completionDate?: string;
    attachments: UploadItem[];
  }>({
    vehicleId: '',
    description: '',
    actualCost: undefined,
    completionDate: new Date().toISOString().slice(0, 10),
    attachments: [],
  });
  const [maintainedSubmitting, setMaintainedSubmitting] = useState(false);
  const [maintainedError, setMaintainedError] = useState<string | null>(null);
  const [maintainedVehicles, setMaintainedVehicles] = useState<Vehicle[]>([]);
  const [maintainedVehiclesLoading, setMaintainedVehiclesLoading] = useState(false);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<MaintainedHistoryRow[]>([]);

  const resetMaintainedForm = () => {
    setMaintainedForm({
      vehicleId: '',
      description: '',
      actualCost: undefined,
      completionDate: new Date().toISOString().slice(0, 10),
      attachments: [],
    });
    setMaintainedError(null);
  };

  const loadMaintainedVehicles = async () => {
    try {
      setMaintainedVehiclesLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token') || '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/maintenance/maintained-vehicles`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error((data as any)?.error || 'Failed to load maintained vehicles');
      setMaintainedVehicles(Array.isArray(data) ? data as Vehicle[] : []);
    } catch (e) {
      setMaintainedVehicles([]);
    } finally {
      setMaintainedVehiclesLoading(false);
    }
  };

  const handleSubmitMaintained = async () => {
    try {
      setMaintainedSubmitting(true);
      setMaintainedError(null);

      // Basic Validation
      if (!maintainedForm.vehicleId) {
        setMaintainedError('Vehicle is required.');
        setMaintainedSubmitting(false);
        return;
      }

      if (!maintainedForm.description) {
        setMaintainedError('Description is required.');
        setMaintainedSubmitting(false);
        return;
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') ||
        localStorage.getItem('jwt') ||
        localStorage.getItem('token') ||
        ''
        : '';

      // Handle Image Upload
      let imageUrl: string | undefined;

      if (maintainedForm.attachments && maintainedForm.attachments.length > 0) {
        try {
          const first = maintainedForm.attachments[0];
          const response = await fetch(first.url);
          if (!response.ok) throw new Error('Failed to fetch attachment');

          const blob = await response.blob();

          let fileName = first.name || 'evidence';
          if (!/\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
            fileName += '.jpg';
          }

          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
          const fd = new FormData();
          fd.append('file', file);

          const uploadRes = await fetch(`${apiBase}/api/upload/image`, {
            method: 'POST',
            body: fd,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          const uploadJson = await uploadRes.json().catch(() => ({} as any));
          if (!uploadRes.ok) throw new Error(uploadJson?.message || 'Image upload failed');

          imageUrl = uploadJson?.url || uploadJson?.imageUrl || uploadJson?.secure_url;
        } catch (e: any) {
          console.warn('⚠️ Maintained image upload failed:', e.message);
          toast({
            title: 'Image Upload Warning',
            description: e.message || 'Could not upload image (only JPG, PNG, WEBP are allowed).',
            variant: 'destructive',
          });
        }
      }

      // Submit Maintained Vehicle Data
      const createRes = await fetch(`${apiBase}/api/fleet/manager/maintenance/maintained-vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          vehicleId: maintainedForm.vehicleId,
          description: maintainedForm.description,
          cost: maintainedForm.actualCost,
          completedDate: maintainedForm.completionDate,
          imageUrl,
          status: 'REJECTED',
        }),
      });

      const createJson = await createRes.json().catch(() => ({} as any));
      if (!createRes.ok) throw new Error(createJson?.message || 'Failed to register maintained vehicle');

      // Update UI State
      onVehiclesUpdate(
        vehicles.map(v =>
          v.id === maintainedForm.vehicleId ? { ...v, status: 'available' } : v
        )
      );

      const vehicle = maintainedVehicles.find(v => v.id === maintainedForm.vehicleId) || vehicles.find(v => v.id === maintainedForm.vehicleId);
      const vehicleLabel = vehicle
        ? `${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.licensePlate || vehicle.plate || ''})`.trim()
        : maintainedForm.vehicleId;

      setHistory(prev => [{
        vehicleLabel,
        vehicleId: maintainedForm.vehicleId,
        description: maintainedForm.description,
        actualCost: maintainedForm.actualCost,
        completionDate: maintainedForm.completionDate,
        savedAt: new Date().toISOString(),
      }, ...prev]);

      resetMaintainedForm();

      toast({
        title: 'Success',
        description: 'Vehicle maintenance registered successfully.',
      });
    } catch (e: any) {
      console.error('❌ handleSubmitMaintained error:', e);
      setMaintainedError(e?.message || 'Failed to submit maintenance record');
      toast({
        title: 'Error',
        description: e?.message || 'Failed to submit maintenance record',
        variant: 'destructive',
      });
    } finally {
      setMaintainedSubmitting(false);
    }
  };

  useEffect(() => {
    loadMaintainedVehicles();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="p-6">

        {/* Maintained Vehicles register form */}
        <div id="maintained-form" className="border rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Register Maintained Vehicle</h4>
          {maintainedError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-3">{maintainedError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle<span className="text-red-500">*</span></label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={maintainedForm.vehicleId}
                onChange={(e) => setMaintainedForm(v => ({ ...v, vehicleId: e.target.value }))}
              >
                <option value="">Select vehicle…</option>
                {maintainedVehiclesLoading && (
                  <option value="" disabled>Loading…</option>
                )}
                {!maintainedVehiclesLoading && maintainedVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make || ''} {v.model || ''} ({v.licensePlate || v.plate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Completion Date</label>
              <input
                type="date"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={maintainedForm.completionDate || ''}
                onChange={(e) => setMaintainedForm(v => ({ ...v, completionDate: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description<span className="text-red-500">*</span></label>
              <textarea
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Work performed / notes"
                value={maintainedForm.description}
                onChange={(e) => setMaintainedForm(v => ({ ...v, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Actual Cost (optional)</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g. 1500"
                value={typeof maintainedForm.actualCost === 'number' ? String(maintainedForm.actualCost) : ''}
                onChange={(e) => setMaintainedForm(v => ({ ...v, actualCost: e.target.value ? Number(e.target.value) : undefined }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Attachments</label>
              <div className="mt-2">
                <AttachmentUploader
                  action="/api/uploads"
                  buttonLabel="Attach files"
                  accept="image/*,application/pdf"
                  maxCount={5}
                  maxTotalBytes={10 * 1024 * 1024}
                  onError={(msg) => alert(msg)}
                  onUploaded={(data: any) => {
                    if (!data?.ok) { alert(data?.message || 'Upload failed'); return }
                    const items: UploadItem[] = data.items || [];
                    setMaintainedForm(v => ({ ...v, attachments: items }));
                  }}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-100"
              onClick={resetMaintainedForm}
              disabled={maintainedSubmitting}
            >Reset</button>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              onClick={handleSubmitMaintained}
              disabled={maintainedSubmitting}
            >{maintainedSubmitting ? 'Saving…' : 'Register Maintained'}</button>
          </div>
        </div>

        {/* Maintenance Vehicles List */}
        {vehicles.filter(v => v.status === 'maintenance').length === 0 ? (
          <p className="text-gray-500 text-center py-8">No vehicles currently in maintenance</p>
        ) : (
          <div className="space-y-4">
            {vehicles
              .filter(v => v.status === 'maintenance')
              .map(vehicle => {
                const request = maintenanceRequests.find(r => r.vehicleId === vehicle.id && r.status === 'in_progress');
                return (
                  <div key={vehicle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{vehicle.make} {vehicle.model} ({vehicle.licensePlate || vehicle.plate})</h4>
                        <p className="text-sm text-gray-600">Year: {vehicle.year} • Mileage: {(vehicle as any).mileage ? Number((vehicle as any).mileage).toLocaleString() : '—'} km</p>
                        {request && (
                          <p className="text-sm text-gray-500">Current Work: {request.issueDescription}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-600">
                          In Maintenance
                        </span>
                        <div className="mt-2 space-x-2">
                          <button className="text-blue-600 hover:text-blue-900 text-sm">View Details</button>
                          <button
                            className="text-green-600 hover:text-green-900 text-sm"
                            onClick={() => {
                              const req = maintenanceRequests.find((r: any) => r.vehicleId === vehicle.id && (r.status === 'in_progress' || r.status === 'pending'));
                              setMaintainedForm(v => ({
                                ...v,
                                vehicleId: vehicle.id,
                                description: req?.issueDescription || v.description,
                              }));
                              const el = document.getElementById('maintained-form');
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                          >Mark Complete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="mt-8">
          <h4 className="text-md font-medium text-gray-900 mb-3">Maintained Vehicles History (This Session)</h4>
          <div className="overflow-x-auto text-sm">
            <table className="min-w-full border text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-2 py-1 text-left">#</th>
                  <th className="border px-2 py-1 text-left">Saved At</th>
                  <th className="border px-2 py-1 text-left">Vehicle</th>
                  <th className="border px-2 py-1 text-left">Completion Date</th>
                  <th className="border px-2 py-1 text-left">Description</th>
                  <th className="border px-2 py-1 text-left">Actual Cost</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="border px-2 py-3 text-center text-gray-500" colSpan={6}>
                      No maintained vehicles registered in this session.
                    </td>
                  </tr>
                ) : (
                  history.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 align-top">
                      <td className="border px-2 py-1">{history.length - index}</td>
                      <td className="border px-2 py-1 whitespace-nowrap">{new Date(row.savedAt).toLocaleString('en-GB')}</td>
                      <td className="border px-2 py-1">{row.vehicleLabel || '-'}</td>
                      <td className="border px-2 py-1 whitespace-nowrap">{row.completionDate || '-'}</td>
                      <td className="border px-2 py-1 whitespace-pre-wrap">{row.description || '-'}</td>
                      <td className="border px-2 py-1">{typeof row.actualCost === 'number' ? row.actualCost : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}