// In-memory store for driver documents (mock)
export type DriverDocType = 'educational_paper' | 'license_certificate' | 'other_documents' | 'agreement_paper'

export interface DriverDocumentItem {
  id: string
  driverId: string
  docType: DriverDocType
  name: string
  size?: number
  mimeType?: string
  uploadedAt: string
  url?: string // placeholder for a future static serving path
}

export const DRIVER_DOCS: Record<string, DriverDocumentItem[]> = {}

export function nextDocId(driverId: string) {
  const list = DRIVER_DOCS[driverId] || []
  return `${driverId}-DOC-${String(list.length + 1).padStart(3,'0')}`
}

// Extended driver data stores
export interface DriverLicenseItem {
  id: string
  driverId: string
  licenseClass: string
  number: string
  issuingAuthority?: string
  issuedAt?: string
  expiresAt: string
}

export interface DriverTrainingItem {
  id: string
  driverId: string
  topic: string
  date: string
  trainer?: string
  certificateUrl?: string
}

export interface DriverIncidentItem {
  id: string
  driverId: string
  date: string
  type: 'violation' | 'accident' | 'complaint' | 'misuse' | 'other'
  description: string
  location?: string
  severity?: 'low' | 'medium' | 'high'
  actionTaken?: string
}

export interface DriverCertificationItem {
  id: string
  driverId: string
  name: string // e.g., First Aid, Defensive Driving, Dangerous Goods
  date: string
  expiresAt?: string
  issuer?: string
}

export const DRIVER_LICENSES: Record<string, DriverLicenseItem[]> = {}
export const DRIVER_TRAININGS: Record<string, DriverTrainingItem[]> = {}
export const DRIVER_INCIDENTS: Record<string, DriverIncidentItem[]> = {}
export const DRIVER_CERTIFICATIONS: Record<string, DriverCertificationItem[]> = {}

export function nextItemId(prefix: string, listLen: number) {
  return `${prefix}-${String(listLen + 1).padStart(3,'0')}`
}
