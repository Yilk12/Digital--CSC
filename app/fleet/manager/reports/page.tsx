'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

interface VehicleRow {
  id: string
  plate?: string | null
  make?: string | null
  model?: string | null
  // From vehicle registration form: "ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ"
  kmPerLiter?: number | null
}

interface TripHistoryItem {
  id: string
  fleetRequestId?: number | null
  vehicleId?: string | null
  date?: string | null
  odometerKmDiff?: number | null
  returnOdometerKm?: number | null
  vehiclePlate?: string | null
  vehicle?: {
    plate?: string | null
  } | null
}

interface FuelRequest {
  id: string
  vehicleId: string
  date: string
  odometer: number
  amount: number
  amountType: "LITER" | "COUPON" | "CASH"
  notes?: string | null
  status?: string | null
  vehicle?: {
    plate?: string | null
    make?: string | null
    model?: string | null
  } | null
}

interface FleetCostRow {
  id: string
  date: string
  amount: number
  currency: string
  category: string | null
  vehicle?: {
    plate?: string | null
  } | null
}

interface ReportRow {
  plate: string
  col1: string
  col2: string
  col3: string
  col4: string
  col5: string
  col6: string
  col7: string
  col8: string
  col9: string
  col10: string
  col11: string
  col12: string
}

export default function FleetManagerReportsPage() {
  const [items, setItems] = useState<FuelRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [costs, setCosts] = useState<FleetCostRow[]>([])
  const [loadingCosts, setLoadingCosts] = useState(false)
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [tripHistory, setTripHistory] = useState<TripHistoryItem[]>([])
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly')
  const [exportFormat, setExportFormat] = React.useState<'excel' | 'word' | 'pdf'>('excel')
  const tableRef = useRef<HTMLTableElement | null>(null)

  const downloadBlob = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = () => {
    if (exportFormat === 'excel') return exportAsExcel()
    if (exportFormat === 'word') return exportAsWord()
    if (exportFormat === 'pdf') return exportAsPDF()
  }

  const exportAsExcel = () => {
    if (!tableRef.current) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${tableRef.current.outerHTML}</body></html>`
    downloadBlob(html, 'application/vnd.ms-excel', 'fleet-report.xls')
  }

  const exportAsWord = () => {
    if (!tableRef.current) return
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${tableRef.current.outerHTML}</body></html>`
    downloadBlob(html, 'application/msword', 'fleet-report.doc')
  }

  const exportAsPDF = () => {
    if (!tableRef.current) return
    const printContents = tableRef.current.outerHTML
    const win = window.open('', '_blank', 'width=1024,height=768')
    if (!win) return
    win.document.open()
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8" /><title>Fleet Report</title></head><body>${printContents}</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  // Load manager fuel requests once on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('accessToken') ||
              window.localStorage.getItem('jwt') ||
              window.localStorage.getItem('token')
            : null

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/manager/fuel-requests`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) {
          throw new Error(`Failed to load fuel requests (${res.status})`)
        }

        const data = await res.json().catch(() => ({}))
        const arr = (data?.data || data?.items || data) as any
        setItems(Array.isArray(arr) ? (arr as FuelRequest[]) : [])

        // Also load all registered vehicles so that the report table shows
        // every vehicle, even if it has no fuel/cost activity in the period.
        try {
          // Use the generic vehicles listing endpoint (no filters) which
          // returns all vehicles, instead of /vehicles/all which may not
          // be implemented consistently on the backend.
          const vehRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/vehicles`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          const vehJson = await vehRes.json().catch(() => ({} as any))
          const vehArr = (vehJson?.data || vehJson?.items || vehJson) as any
          const list: VehicleRow[] = Array.isArray(vehArr) ? vehArr : []
          setVehicles(list)
        } catch (vehErr) {
          console.error('Error loading vehicles for manager reports:', vehErr)
          setVehicles([])
        }
      } catch (e: any) {
        console.error('Error loading fuel requests for reports:', e)
        setError(e?.message || 'Failed to load fuel requests')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // Load fleet cost registrations so fuel cost column matches finance view
  useEffect(() => {
    const loadCosts = async () => {
      try {
        setLoadingCosts(true)

        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('accessToken') ||
              window.localStorage.getItem('jwt') ||
              window.localStorage.getItem('token')
            : null

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/costs`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) {
          throw new Error(`Failed to load fleet costs (${res.status})`)
        }

        const data = await res.json().catch(() => ({}))
        const arr = (data?.data || data?.items || data) as any
        setCosts(Array.isArray(arr) ? (arr as FleetCostRow[]) : [])
      } catch (e) {
        console.error('Error loading fleet costs for manager reports:', e)
        setCosts([])
      } finally {
        setLoadingCosts(false)
      }
    }

    loadCosts()
  }, [])

  // Load trip history for managers so distance is computed from completed trips
  useEffect(() => {
    const loadTripHistory = async () => {
      try {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('accessToken') ||
              window.localStorage.getItem('jwt') ||
              window.localStorage.getItem('token')
            : null

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/trip-history/manager/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) {
          console.error('Failed to load trip history for manager reports', res.status)
          setTripHistory([])
          return
        }

        const data = await res.json().catch(() => ({} as any))
        const arr = (data?.data || data?.items || data) as any
        const list: TripHistoryItem[] = Array.isArray(arr) ? arr : []
        setTripHistory(list)
      } catch (e) {
        console.error('Error loading trip history for manager reports:', e)
        setTripHistory([])
      }
    }

    loadTripHistory()
  }, [])

  // Build per-vehicle aggregates for the selected range (weekly/monthly/yearly/all).
  // We no longer require fuel requests to exist; rows are built from any
  // combination of fuel requests, costs, trip history, or registered vehicles.
  const rows: ReportRow[] = useMemo(() => {
    const now = new Date()

    let rangeStart: Date | null = null
    let rangeEnd: Date | null = null

    if (range === 'daily') {
      // Today only
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    } else if (range === 'monthly') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1)
      rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    } else if (range === 'weekly') {
      const dayOfWeek = now.getDay() // 0 = Sunday
      rangeStart = new Date(now)
      rangeStart.setDate(now.getDate() - dayOfWeek)
      rangeStart.setHours(0, 0, 0, 0)

      rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeStart.getDate() + 6)
      rangeEnd.setHours(23, 59, 59, 999)
    } else if (range === 'yearly') {
      rangeStart = new Date(now.getFullYear(), 0, 1)
      rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
    } else if (range === 'all') {
      rangeStart = null
      rangeEnd = null
    }

    const byPlate = new Map<
      string,
      {
        liters: number
      }
    >()

    // For monthly total km we want the latest cumulative odometer reading per
    // vehicle (returnOdometerKm), not the sum of per-trip distances.
    const kmByPlate = new Map<string, { value: number; ts: number }>()

    const fuelCostByPlate = new Map<string, number>()
    const maintenanceCostByPlate = new Map<string, number>()

    // Per-vehicle configured km-per-liter, keyed by plate, coming from the
    // registration form field "ተሽከርካሪዉ በሊትር የሚሸፍነዉ ኪሜ" (kmPerLiter).
    const kmPerLiterByPlate = new Map<string, number>()

    ;(vehicles || []).forEach(v => {
      if (!v) return
      const anyV: any = v
      const rawPlate = (v.plate || anyV.licensePlate || '').trim()
      if (!rawPlate) return

      const rawKmPerLiter = anyV.kmPerLiter ?? anyV.km_per_liter
      const value = Number(rawKmPerLiter)
      if (!Number.isNaN(value) && value > 0) {
        kmPerLiterByPlate.set(rawPlate, value)
      }
    })

    items.forEach(req => {
      if (!req?.date) return
      const d = new Date(req.date)
      if (isNaN(d.getTime())) return
      if (rangeStart && d < rangeStart) return
      if (rangeEnd && d > rangeEnd) return

      const status = String(req?.status || '').toUpperCase()
      if (status !== 'FUELED' && status !== 'HALF_FUELED') return

      const plate = (req.vehicle?.plate || req.vehicleId || '').trim()
      if (!plate) return

      const current = byPlate.get(plate) || { liters: 0 }

      const amountVal = Number(req.amount)
      if (!isNaN(amountVal)) {
        current.liters += amountVal
      }

      byPlate.set(plate, current)
    })

    // From trip history, compute for each plate the maximum cumulative
    // returnOdometerKm recorded for that vehicle across ALL history. If the
    // history row does not carry a plate string, we try to resolve it from the
    // loaded vehicles list using vehicleId so that rows with null plates still
    // contribute (this is important for cases like bigvcar-124).
    ;(tripHistory || []).forEach((h: TripHistoryItem) => {
      if (!h) return

      let plate = (h.vehiclePlate || h.vehicle?.plate || '')?.trim() || ''

      if (!plate && h.vehicleId) {
        const match = (vehicles || []).find(v => {
          const anyV: any = v
          return anyV?.id === h.vehicleId
        })
        if (match) {
          const anyM: any = match
          plate = String((anyM.plate || anyM.licensePlate || '')).trim()
        }
      }

      plate = String(plate || '').trim()
      if (!plate) return

      const kmRaw = (h as any).returnOdometerKm
      const kmVal = Number(kmRaw)
      if (Number.isNaN(kmVal)) return

      const existing = kmByPlate.get(plate)
      if (!existing || kmVal > existing.value) {
        // timestamp is optional here; we keep it for completeness but we
        // primarily compare by value.
        const d = h?.date ? new Date(h.date as any) : null
        const ts = d && !Number.isNaN(d.getTime()) ? d.getTime() : 0
        kmByPlate.set(plate, { value: kmVal, ts })
      }
    })

    // Aggregate Fuel & Energy and Maintenance & Repairs costs per vehicle for the same month
    costs.forEach(cost => {
      if (!cost?.date) return
      const d = new Date(cost.date)
      if (isNaN(d.getTime())) return
      if (rangeStart && d < rangeStart) return
      if (rangeEnd && d > rangeEnd) return

      const plate = (cost.vehicle?.plate || '').trim()
      if (!plate) return

      const amountVal = Number(cost.amount)
      if (!isNaN(amountVal)) {
        if ((cost.category || '') === 'Fuel & Energy') {
          fuelCostByPlate.set(plate, (fuelCostByPlate.get(plate) || 0) + amountVal)
        } else if ((cost.category || '') === 'Maintenance & Repairs') {
          maintenanceCostByPlate.set(plate, (maintenanceCostByPlate.get(plate) || 0) + amountVal)
        }
      }
    })

    const result: ReportRow[] = []

    // Include plates from:
    // - vehicles with fuel activity (byPlate)
    // - vehicles with cost activity (fuelCostByPlate)
    // - all registered vehicles list (vehicles state)
    const vehiclePlates = (vehicles || [])
      .map(v => {
        const anyV = v as any
        const rawPlate = v.plate || anyV.licensePlate || ''
        return String(rawPlate || '').trim()
      })
      .filter(p => p.length > 0)

    if (process.env.NODE_ENV !== 'production') {
      console.log('Manager reports vehicles sample:', (vehicles || []).slice(0, 5))
      console.log('Manager reports derived vehiclePlates:', vehiclePlates)
    }

    const allPlates = new Set<string>([
      ...byPlate.keys(),
      ...fuelCostByPlate.keys(),
      ...kmByPlate.keys(),
      ...vehiclePlates,
    ])

    allPlates.forEach(plate => {
      const agg = byPlate.get(plate) || { liters: 0 }
      const liters = agg.liters
      const kmEntry = kmByPlate.get(plate)
      const km = kmEntry ? kmEntry.value : 0
      const fuelCost = fuelCostByPlate.get(plate) || 0
      const maintenanceCost = maintenanceCostByPlate.get(plate) || 0
      const totalCost = fuelCost + maintenanceCost

      // Prefer the configured kmPerLiter from vehicle registration; if missing,
      // fall back to the computed km/liters average.
      const configuredKmPerLiter = kmPerLiterByPlate.get(plate)
      let avgKmPerLiter = ''
      if (typeof configuredKmPerLiter === 'number' && !Number.isNaN(configuredKmPerLiter) && configuredKmPerLiter > 0) {
        avgKmPerLiter = String(configuredKmPerLiter)
      } else if (liters > 0) {
        avgKmPerLiter = (km / liters).toFixed(1)
      }

      result.push({
        plate,
        // በወር ውስጥ የተቀዳ ነዳጅ በሊትር -> sum of amount
        col1: liters ? String(liters) : '',
        // በወር ውስጥ የተጓዘዉ ጠቅላላ ኪ.ሜ -> sum of odometer
        col2: km ? String(km) : '',
        // በአማካኝ በሊትር የተጓዘዉ ኪ.ሜ -> simple average
        col3: avgKmPerLiter,
        // የተቀዳለት ጠቅላላ የነዳጅ ዋጋ በብር -> monthly Fuel & Energy cost from finance
        col4: fuelCost
          ? Number(fuelCost).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : '',
        col5: '',
        col6: '',
        col7: '',
        col8: '',
        // የተሽከርካሪዉ የጥገና ወጪ በብር -> monthly Maintenance & Repairs cost from finance
        col9: maintenanceCost
          ? Number(maintenanceCost).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : '',
        col10: '',
        // የወሩ ጠቅላላ ወጪ በብር -> sum of fuel + maintenance costs for the month
        col11: totalCost
          ? Number(totalCost).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : '',
        col12: '',
      })
    })

    // Sort rows by plate for stable output
    result.sort((a, b) => a.plate.localeCompare(b.plate))
    return result
  }, [items, costs, vehicles, range, tripHistory])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ጠቅላላ ሪፖርት</h1>
          <p className="mt-2 text-sm text-gray-600">
            የመኪናዎች ጠቅላላ ሪፖርት ሰንጠረዥ (የነዳጅ፣ የመንገድ ርቀት እና የጥገና ወጪ መረጃዎች)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs md:text-sm">
            <span className="text-gray-700">Report range:</span>
            <select
              value={range}
              onChange={e => setRange(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-800"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'excel' | 'word' | 'pdf')}
            className="px-2 py-2 text-xs md:text-sm border border-gray-300 rounded bg-white text-gray-800"
          >
            <option value="excel">Export Excel</option>
            <option value="word">Export Word</option>
            <option value="pdf">Export PDF</option>
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 text-xs md:text-sm rounded bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
        <table ref={tableRef} className="min-w-[1200px] table-auto text-xs md:text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="border px-2 py-2 text-center whitespace-nowrap">የመኪና ፕሌት</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">በወር ዉስጥ የተቀዳ ነዳጅ በሊትር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">በወር ውስጥ የተጓዘዉ ጠቅላላ ኪ.ሜ</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">በአማካኝ በሊትር የተጓዘዉ ኪ.ሜ</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የተቀዳለት ጠቅላላ የነዳጅ ዋጋ በብር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የፍሬን ዘይት በሊትር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የፍሬን ዘይት ዋጋ በብር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የሞተር ዘይት በሊትር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የሞተር ዘይት ዋጋ በብር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የተሽከርካሪዉ የጥገና ወጪ በብር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">ወጪ በኪ.ሜ ብር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">የወሩ ጠቅላላ ወጪ በብር</th>
              <th className="border px-2 py-2 text-center whitespace-nowrap">ምርመራ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: ReportRow, idx: number) => (
              <tr key={row.plate + idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border px-2 py-1 text-center whitespace-nowrap">{row.plate}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col1}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col2}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col3}</td>
                <td className="border px-2 py-1 text-center min-w-[110px]">{row.col4}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col5}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col6}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col7}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col8}</td>
                <td className="border px-2 py-1 text-center min-w-[110px]">{row.col9}</td>
                <td className="border px-2 py-1 text-center min-w-[90px]">{row.col10}</td>
                <td className="border px-2 py-1 text-center min-w-[110px]">{row.col11}</td>
                <td className="border px-2 py-1 min-w-[140px]">{row.col12}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
