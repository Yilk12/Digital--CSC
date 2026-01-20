export interface Vehicle {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  status?: string;
  assignedTo?: string;
  fuelType?: string;
  user?: { firstName?: string; lastName?: string; id?: string };
}

export interface Driver {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  userType: string;
  departmentId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedVehicle?: string;
}

export interface FleetRequestDTO {
  id: string;
  purpose?: string;
  status?: string;
  date?: string;
  requestor?: { firstName?: string; lastName?: string };
  department?: { name?: string };
  tripType?: string;
  destination?: string;
  createdAt?: string;
}

export interface AssignmentRequest {
  id: number;
  requestorId: string;
  purpose: string;
  tripType: string;
  destination: string;
  departmentId: string;
  date: string;
  fromDate: string | null;
  toDate: string | null;
  startTime: string | null;
  endTime: string | null;
  // Optional: actual return time recorded by the driver when completing the trip
  // (used to align manager assignment completion time with driver reports)
  returnTime?: string | null;
  status: string;
  createdAt: string;
  requestor: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    phone: string;
  };
  department: {
    id: string;
    name: string;
  };
  vehicles: Array<{
    id: string;
    plate: string;
    make: string;
    model: string;
    year: number;
    endTime?: string | null;
    completedAt?: string | null;
    managerNotifiedAt?: string | null;
    driver?: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string | null;
    } | null;
  }>;
}

export interface Assignment {
  id: string;
  vehicleId: string;
  driverId: string;
  department: string;
  assignedBy: string;
  assignedDate: string;
  purpose: string;
  status: 'active' | 'completed' | 'cancelled';
}

export type UploadItem = { name: string; url: string; size: number; type: string };