// In-memory handover/return records store
export interface HandoverRecord {
  id: string
  formType: 'HANDOVER' | 'RETURN'
  assignmentType: 'WITH_DRIVER' | 'FREE_VEHICLE'
  vehicleId: string
  vehicleMakeModel?: string
  vehicleReg?: string
  odometer?: number
  fuelLevelPct?: number
  vehicleCondition?: 'GOOD' | 'MINOR_DAMAGE' | 'NEEDS_MAINTENANCE'
  accessories?: {
    jack?: boolean
    spareTire?: boolean
    tools?: boolean
    fireExtinguisher?: boolean
    firstAidKit?: boolean
  }
  driverInfo?: {
    name?: string
    licenseNumber?: string
    contact?: string
    signature?: string
  }
  recipient: {
    name: string
    department?: string
    contact?: string
    signature?: string
    dateTime: string
  }
  supervisor?: {
    name?: string
    signature?: string
    dateTime?: string
  }
  checklist?: Array<{ item: string; checked: boolean; notes?: string }>
  remarks?: string
  photos?: {
    preHandover?: string[]
    postReturn?: string[]
  }
  officialStamp?: boolean
  createdAt: string
}

export const HANDOVER_RECORDS: HandoverRecord[] = []

export function nextHandoverId() {
  return `HV-${String(HANDOVER_RECORDS.length + 1).padStart(4,'0')}`
}
