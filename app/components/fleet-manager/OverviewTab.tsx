'use client';

import Link from 'next/link';
import { Vehicle, Driver, Assignment } from './types';

interface OverviewTabProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  assignments: Assignment[];
  stats: {
    totalVehicles: number;
    availableVehicles: number;
    assignedVehicles: number;
    maintenanceVehicles: number;
    totalDrivers: number;
    activeDrivers: number;
    activeAssignments: number;
  };
}

export default function OverviewTab({ vehicles, drivers, assignments, stats }: OverviewTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-600 bg-green-100';
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'out_of_service': return 'text-red-600 bg-red-100';
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recent Assignments */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Assignments</h3>
        </div>
        <div className="p-6">
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No assignments found</p>
          ) : (
            <div className="space-y-4">
              {assignments.map(assignment => {
                const vehicle = vehicles.find(v => v.id === assignment.vehicleId);
                const driver = drivers.find(d => d.id === assignment.driverId);
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{vehicle?.make} {vehicle?.model} - {vehicle?.licensePlate}</p>
                      <p className="text-sm text-gray-600">Assigned to {driver?.firstName} {driver?.lastName} ({assignment.department})</p>
                      <p className="text-sm text-gray-500">Purpose: {assignment.purpose}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assignment.status || 'unknown')}`}>
                      {assignment.status || 'unknown'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}