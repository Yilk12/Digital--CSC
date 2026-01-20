'use client';

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useToast } from "@/app/components/toast-provider";
import { Vehicle, Driver, AssignmentRequest } from './types';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  assignments: AssignmentRequest[];
  serviceRegistrations: any[];
  onVehiclesUpdate: (vehicles: Vehicle[]) => void;
}

interface DepartmentHead {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: { name?: string } | string | null;
}

export default function VehiclesTab({ vehicles, drivers, assignments, serviceRegistrations, onVehiclesUpdate }: VehiclesTabProps) {
  const { show: toast } = useToast();
  const router = useRouter();
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [departmentHeads, setDepartmentHeads] = useState<DepartmentHead[]>([]);
  const [selectedDepartmentHead, setSelectedDepartmentHead] = useState('');

  useEffect(() => {
    const loadDepartmentHeads = async () => {
      try {
        const token =
          (typeof window !== 'undefined' &&
            (window.localStorage.getItem('accessToken') ||
              window.localStorage.getItem('jwt') ||
              window.localStorage.getItem('token'))) ||
          '';

        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const base = apiBase.replace(/\/$/, '');
        const res = await fetch(`${base}/api/users/department-heads`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          console.error('Failed to load department heads', res.status);
          return;
        }

        const json = await res.json();
        const items: any[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.items)
              ? json.items
              : [];
        setDepartmentHeads(items as DepartmentHead[]);
      } catch (err) {
        console.error('Error loading department heads', err);
      }
    };

    loadDepartmentHeads();
  }, []);

  const isVehicleInService = (vehicle: Vehicle): boolean => {
    if (!serviceRegistrations || serviceRegistrations.length === 0) return false;

    const now = new Date();

    return serviceRegistrations.some((reg: any) => {
      if (!reg) return false;

      const regVehicleId = (reg as any).vehicleId as string | undefined;
      const regPlateRaw = (reg as any).plateNumber as string | undefined;
      const regPlate = regPlateRaw ? regPlateRaw.trim() : undefined;

      const vehiclePlate = vehicle.plate ? vehicle.plate.trim() : '';

      const sameVehicle =
        (regVehicleId && regVehicleId === vehicle.id) ||
        (regPlate && vehiclePlate && regPlate.toLowerCase() === vehiclePlate.toLowerCase());

      if (!sameVehicle) return false;

      const statusRaw = ((reg as any).status || 'PENDING').toString().toUpperCase();

      // If backend marks this registration as PENDING or IN_PROGRESS,
      // always treat the vehicle as currently in service.
      if (statusRaw === 'PENDING' || statusRaw === 'IN_PROGRESS') {
        return true;
      }

      const startRaw = (reg as any).serviceStart as string | undefined;
      const endRaw = (reg as any).serviceEnd as string | undefined;

      const start = startRaw ? new Date(startRaw) : null;
      const end = endRaw ? new Date(endRaw) : null;

      // If dates are invalid, treat as active
      const startValid = start && !Number.isNaN(start.getTime());
      const endValid = end && !Number.isNaN(end.getTime());

      if (startValid && endValid) {
        return now >= start! && now <= end!;
      }
      if (startValid && !endValid) {
        return now >= start!;
      }
      if (!startValid && endValid) {
        return now <= end!;
      }
      // No dates -> assume active until explicitly updated
      return true;
    });
  };

  const isDriverOnActiveField = (vehicle: Vehicle): boolean => {
    const driverId = vehicle.user?.id;

    return assignments.some((req) => {
      const status = (req.status || '').toUpperCase();
      if (status === 'COMPLETED') return false;
      const isActiveStatus = status === 'ASSIGNED' || status === 'ACTIVE' || status === 'IN_PROGRESS';

      // Shape 1: flattened summary row (one vehicle per request)
      const flatVehicleId: string | null | undefined = (req as any).vehicleId;
      const flatDriverId: string | null | undefined = (req as any).driverId;

      if (flatVehicleId || flatDriverId) {
        const sameVehicle = flatVehicleId === vehicle.id;
        const sameDriver = driverId && flatDriverId === driverId;

        return isActiveStatus && (sameVehicle || sameDriver);
      }

      // Shape 2: detailed AssignmentRequest with vehicles[]
      const vehiclesArr = (req as any).vehicles as any[] | undefined;
      if (!Array.isArray(vehiclesArr)) return false;

      return vehiclesArr.some((v) => {
        if (!v) return false;

        const sameVehicle = v.id === vehicle.id;
        const sameDriver = driverId && v.driver && v.driver.id === driverId;
        const isVehicleCompleted = !!(v.completedAt || v.endTime);

        return !isVehicleCompleted && (sameVehicle || sameDriver);
      });
    });
  };

  const assignDriver = async () => {
    if (!selectedDriver || selectedVehicleIds.length === 0) {
      toast({
        title: 'Warning',
        description: 'Select a driver and at least one vehicle.',
        variant: 'destructive',
      });
      return;
    }

    const blockedVehicles = vehicles.filter((v) =>
      selectedVehicleIds.includes(v.id) && isDriverOnActiveField(v)
    );

    if (blockedVehicles.length > 0) {
      toast({
        title: 'Warning',
        description: 'እዚህ ሹፌር መስክ ላይ ነው። እስካልጨረሰው ድረስ አትመድቡት።',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || '';

      await Promise.all(
        selectedVehicleIds.map(vehicleId =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles/${vehicleId}/assign-driver`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: selectedDriver }),
          }).then(async res => {
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || 'Failed to assign driver');
            }
          })
        )
      );

      toast({ title: 'Success', description: 'Driver assigned successfully!' });
      setSelectedVehicleIds([]);
      setSelectedDriver('');
      
      // Refresh vehicles data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      onVehiclesUpdate(Array.isArray(data) ? data : []);
      
    } catch (err: any) {
      console.error('Failed to assign driver:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign driver.',
        variant: 'destructive',
      });
    }
  };

  const assignDepartmentHead = async () => {
    if (!selectedDepartmentHead || selectedVehicleIds.length === 0) {
      toast({
        title: 'Warning',
        description: 'Select a department head and at least one vehicle.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const token = localStorage.getItem('accessToken') || '';

      await Promise.all(
        selectedVehicleIds.map(vehicleId =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles/${vehicleId}/assign-driver`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ userId: selectedDepartmentHead }),
          }).then(async res => {
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.message || 'Failed to assign department head');
            }
          })
        )
      );

      toast({ title: 'Success', description: 'Vehicles assigned to department head successfully!' });
      setSelectedVehicleIds([]);
      setSelectedDepartmentHead('');

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      onVehiclesUpdate(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to assign department head:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign department head.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div id="vehicles-section" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Vehicle Fleet Management</h2>
              <p className="text-emerald-100 mt-1">Manage and assign vehicles to drivers</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {vehicles.length} vehicles
            </span>
          </div>
        </div>
      </div>

      {/* Assignment Controls */}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">ሹፌር መድብ</label>

              <select
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={selectedDriver}
                onChange={(e) => {
                  setSelectedDriver(e.target.value);
                  if (e.target.value) {
                    setSelectedDepartmentHead('');
                  }
                }}
              >
                <option value="">Choose a driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.firstName} {d.lastName} • {d.role}
                  </option>
                ))}
              </select>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                የስራ አስፈፃሚዎች መኪና መመደቢያ
              </label>
              <select
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
                value={selectedDepartmentHead}
                onChange={(e) => {
                  setSelectedDepartmentHead(e.target.value);
                  if (e.target.value) {
                    setSelectedDriver('');
                  }
                }}
              >
                <option value="">Choose department head...</option>
                {departmentHeads.map((h) => {
                  const deptName =
                    typeof h.department === 'string'
                      ? h.department
                      : h.department?.name;
                  const displayName = `${h.firstName || ''} ${h.lastName || ''}`.trim() || h.email || 'Unknown';
                  return (
                    <option key={h.id} value={h.id}>
                      {displayName}
                      {deptName ? ` • ${deptName}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-w-[140px] justify-center"
                onClick={assignDriver}
                disabled={!selectedDriver || !!selectedDepartmentHead || selectedVehicleIds.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className="font-medium">ሹፌር መድብ</span>
              </button>

              <button
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-w-[180px] justify-center"
                onClick={assignDepartmentHead}
                disabled={!selectedDepartmentHead || !!selectedDriver || selectedVehicleIds.length === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A4 4 0 019 15h6a4 4 0 013.879 2.804M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">ለስራ አስፈፃሚዎች መኪና መደብ</span>
              </button>
            </div>
          </div>

          {selectedVehicleIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <div className="flex items-center space-x-2 text-blue-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">
                  {selectedVehicleIds.length} vehicle{selectedVehicleIds.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="p-6">
        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Vehicles Available</h3>
            <p className="text-gray-400">Add vehicles to your fleet to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg group ${
                  selectedVehicleIds.includes(vehicle.id)
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Vehicle Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    {!isDriverOnActiveField(vehicle) && !isVehicleInService(vehicle) && (
                      <input
                        type="checkbox"
                        className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition duration-200"
                        checked={selectedVehicleIds.includes(vehicle.id)}
                        onChange={(e) =>
                          setSelectedVehicleIds((prev) =>
                            e.target.checked
                              ? [...prev, vehicle.id]
                              : prev.filter((id) => id !== vehicle.id)
                          )
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">License Plate</span>
                    <span className="text-sm font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {vehicle.plate || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className="text-sm text-gray-700 italic">
                      {vehicle.user ? 'Assigned' : 'Available'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">ሹፌር መድብ</span>
                    <div className="flex items-center space-x-2">
                      {vehicle.user ? (
                        <>
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {vehicle.user.firstName?.[0]}
                              {vehicle.user.lastName?.[0]}
                            </span>
                          </div>
                          <span className="text-sm text-gray-900">
                            {vehicle.user.firstName} {vehicle.user.lastName}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Unassigned</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Vehicle ID: {vehicle.id.slice(0, 8)}...</span>
                      <span>
                        {isVehicleInService(vehicle)
                          ? 'ሰርቪስ ላይ'
                          : isDriverOnActiveField(vehicle)
                            ? 'መስክ ላይ'
                            : 'Ready for assignment'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="flex-1 min-w-[110px] bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-1 hover:bg-gray-50"
                      onClick={() => router.push(`/fleet/vehicleAdd?mode=edit&vehicleId=${encodeURIComponent(vehicle.id)}`)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>

                    <button
                      className={`flex-1 min-w-[110px] px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center space-x-1
                        ${isDriverOnActiveField(vehicle)
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      type="button"
                      disabled={!vehicle.user}
                    >
                      <span>መስክ ላይ</span>
                    </button>
                    <button
                      className={`flex-1 min-w-[110px] px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center hover:bg-gray-50
                        ${isVehicleInService(vehicle)
                          ? 'bg-red-600 text-white hover:bg-red-700 border border-red-600'
                          : 'bg-white border border-gray-300 text-gray-700'
                        }`}
                      type="button"
                      onClick={() => router.push(`/fleet/service-time?vehicleId=${encodeURIComponent(vehicle.id)}`)}
                    >
                      ሰርቪስ ላይ
                    </button>
                    <button
                      className="flex-1 min-w-[110px] bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center hover:bg-gray-50"
                      type="button"
                      onClick={() => router.push(`/fleet/manager?tab=serviced&vehicleId=${encodeURIComponent(vehicle.id)}`)}
                    >
                      ጥገና ላይ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Footer */}
      {selectedVehicleIds.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{selectedVehicleIds.length}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {selectedVehicleIds.length} vehicle{selectedVehicleIds.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-blue-700">
                  {selectedDriver
                    ? `Will be assigned to ${drivers.find((d) => d.id === selectedDriver)?.firstName} ${drivers.find((d) => d.id === selectedDriver)?.lastName}`
                    : 'Select a driver to assign'}
                </p>
              </div>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={assignDriver}
              disabled={!selectedDriver}
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}