import { apiGet, apiPost, apiPut } from "./api";

export type FleetRequestType = "ISSUE" | "FUEL" | "MAINTENANCE";

export interface FleetRequestDTO {
  id: string;
  type: FleetRequestType;
  date: string; // ISO
  status?: "PENDING" | "APPROVED" | "REJECTED" | string;
  vehicleId?: string;
  driverId?: string;
  departmentId?: string;
  description?: string;
  odometer?: number;
  amount?: number; // fuel amount in liters or cost depending on backend config
  cost?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface VehicleDTO {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  driverId?: string | null;
  assignedTo?: string | null;
}

export async function listFleetRequests(params?: { status?: string }): Promise<FleetRequestDTO[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);

  // Use the new fleet-requests endpoint that matches the backend
  const raw = await apiGet<any>(`/fleet/fleet-requests${qs.toString() ? `?${qs.toString()}` : ""}`);

  // Backend currently returns { data: [...] }; normalize to a plain array for callers
  if (Array.isArray(raw)) return raw as FleetRequestDTO[];
  const arr = (raw?.data || raw?.items || []) as any[];
  return Array.isArray(arr) ? (arr as FleetRequestDTO[]) : [];
}

export async function createFleetRequest(body: {
  type: FleetRequestType;
  date: string; // ISO
  vehicleId?: string;
  driverId?: string;
  departmentId?: string;
  description?: string;
  odometer?: number;
  amount?: number;
  cost?: number;
  attachments?: Array<{ name: string; url?: string }>;
}): Promise<FleetRequestDTO> {
  // Use the new fleet-requests endpoint that matches the backend
  return apiPost(`/fleet/fleet-requests`, body);
}

export async function approveFleetRequest(id: string): Promise<FleetRequestDTO> {
  // Use the new fleet-requests endpoint that matches the backend
  return apiPost(`/fleet/fleet-requests/${encodeURIComponent(id)}/approve`);
}

export async function rejectFleetRequest(id: string): Promise<FleetRequestDTO> {
  // Use the new fleet-requests endpoint that matches the backend
  return apiPost(`/fleet/fleet-requests/${encodeURIComponent(id)}/reject`);
}

export async function listVehicles(q?: string): Promise<VehicleDTO[]> {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  return apiGet(`/fleet/vehicles${qs.toString() ? `?${qs.toString()}` : ""}`);
}

export async function updateVehicle(id: string, body: Partial<VehicleDTO>): Promise<VehicleDTO> {
  return apiPut(`/fleet/vehicles/${encodeURIComponent(id)}`, body);
}

export interface DriverDTO { id: string; name: string; phone?: string }

export async function listDrivers(): Promise<DriverDTO[]> {
  try {
    // Use UsersController /users/drivers which returns { id, name, email, phone, role }
    const items = await apiGet<any[]>(`/users/drivers`)
    return (items || []).map(d => ({
      id: d.id,
      name: d.name || d.email,
      phone: d.phone,
    }))
  } catch {
    // Fallback to generic users API if available
    try {
      const res = await apiGet<any>(`/users?role=STAFF_MANAGER&limit=100`)
      const arr = res?.users || res?.items || []
      return arr.map((u: any) => ({ id: u.id, name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email }))
    } catch {
      return []
    }
  }
}
