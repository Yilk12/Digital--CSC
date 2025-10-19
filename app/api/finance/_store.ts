// In-memory mock store for Finance APIs (TCO records)
export interface TCORecord {
  id: string
  createdAt: string
  requestId?: string
  purchase: number
  fuel: number
  maintenance: number
  insurance: number
  depreciation: number
  taxes: number
  financing: number
  resale: number
  totalCosts: number
  netTCO: number
}

export const FIN_STORE = {
  tcos: [] as TCORecord[],
}

export function nextTcoId() {
  const n = FIN_STORE.tcos.length + 1
  return `TCO-${String(n).padStart(3, '0')}`
}
