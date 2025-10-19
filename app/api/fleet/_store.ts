// In-memory mock store for Fleet APIs (shared across endpoints)
export interface VehicleItem {
  id: string
  plate: string
  make?: string
  model?: string
  year?: number
  available?: boolean
  [key: string]: any
}

export interface AccessoryItem {
  id: string
  name: string
  category?: string
  serial?: string
  vehicleId?: string
  status?: "in_stock" | "in_use" | "retired"
  [key: string]: any
}

export const STORE = {
  vehicles: [
    { id: 'V-01', plate: 'ABC-1234', make: 'Toyota', model: 'Corolla', year: 2020, available: true },
    { id: 'V-02', plate: 'XYZ-9876', make: 'Hyundai', model: 'Tucson', year: 2019, available: false },
  ] as VehicleItem[],
  accessories: [
    { id: 'A-01', name: 'GPS Tracker', category: 'Electronics', serial: 'GPS-0001', vehicleId: 'V-01', status: 'in_use' },
  ] as AccessoryItem[],
  requests: [
    { id: 'R-001', requestorName: 'John Doe', purpose: 'Meeting', tripType: 'official_meeting', placeCategory: 'urban', destination: 'HQ', date: '2025-09-29', status: 'PENDING' },
  ] as any[],
}

export function nextVehicleId() {
  // Find next number based on current length; simple mock
  const n = STORE.vehicles.length + 1
  return `V-${String(n).padStart(2, '0')}`
}

export function nextAccessoryId() {
  const n = STORE.accessories.length + 1
  return `A-${String(n).padStart(2, '0')}`
}

export function nextRequestId() {
  const n = STORE.requests.length + 1
  return `R-${String(n).padStart(3, '0')}`
}
