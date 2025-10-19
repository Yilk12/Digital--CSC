import { promises as fs } from "fs"
import path from "path"

type Totals = {
  totalVehicles: number
  available: number
  activeDrivers: number
  activeAssignments: number
}

const DATA_DIR = path.join(process.cwd(), "data")
const FILENAME = path.join(DATA_DIR, "fleet-totals.json")

const DEFAULTS: Totals = {
  totalVehicles: 120,
  available: 42,
  activeDrivers: 68,
  activeAssignments: 55,
}

export async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    /* ignore */
  }
}

export async function getTotals(): Promise<Totals> {
  try {
    await ensureDataDir()
    const raw = await fs.readFile(FILENAME, "utf-8")
    const parsed = JSON.parse(raw)
    return {
      totalVehicles: Number(parsed.totalVehicles) || DEFAULTS.totalVehicles,
      available: Number(parsed.available) || DEFAULTS.available,
      activeDrivers: Number(parsed.activeDrivers) || DEFAULTS.activeDrivers,
      activeAssignments: Number(parsed.activeAssignments) || DEFAULTS.activeAssignments,
    }
  } catch {
    // If file missing or parse fails, return defaults
    return DEFAULTS
  }
}

export async function setTotals(totals: Partial<Totals>): Promise<Totals> {
  const current = await getTotals()
  const merged: Totals = {
    totalVehicles: Number(totals.totalVehicles ?? current.totalVehicles),
    available: Number(totals.available ?? current.available),
    activeDrivers: Number(totals.activeDrivers ?? current.activeDrivers),
    activeAssignments: Number(totals.activeAssignments ?? current.activeAssignments),
  }
  try {
    await ensureDataDir()
    await fs.writeFile(FILENAME, JSON.stringify(merged, null, 2), "utf-8")
  } catch {
    /* ignore write errors for now */
  }
  return merged
}
