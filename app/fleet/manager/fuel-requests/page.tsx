"use client"

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

interface FuelRequest {
  id: string
  vehicleId: string
  date: string
  odometer: number
  amount: number
  amountType: 'LITER' | 'COUPON' | 'CASH'
  notes?: string | null
  status?: string | null
  vehicle?: {
    plate?: string | null
    make?: string | null
    model?: string | null
  } | null
  user?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  } | null
}

export default function FuelRequestsManagerPage() {
  const [items, setItems] = useState<FuelRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const monthlyKmAndFuel = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) {
      return { km: 0, liters: 0 }
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    let km = 0
    let liters = 0

    items.forEach((req: FuelRequest) => {
      if (!req?.date) return
      const d = new Date(req.date)
      if (isNaN(d.getTime())) return
      if (d < monthStart || d > monthEnd) return

      const odometerVal = Number(req.odometer)
      if (!isNaN(odometerVal)) {
        km += odometerVal
      }

      const amountVal = Number(req.amount)
      if (!isNaN(amountVal)) {
        liters += amountVal
      }
    })

    return { km, liters }
  }, [items])

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
        setItems(Array.isArray(arr) ? arr : [])
      } catch (e: any) {
        console.error('Error loading fuel requests:', e)
        setError(e?.message || 'Failed to load fuel requests')
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">የመጡ የነዳጅ ጥያቄዎች</h1>
        <Link
          href="/fleet/manager"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          ← Back to Fleet Manager
        </Link>
      </div>

      {loading && <p className="text-sm text-gray-600 mb-4">Loading fuel requests...</p>}
      {error && (
        <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-medium">Fuel Requests</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-sm text-gray-500 mr-2">Total: {items.length}</span>
            <span className="inline-flex items-center rounded-full bg-emerald-500 text-white px-3 py-1">
              በወር ውስጥ የተጓዘዉ ጠቅላላ ኪ.ሜ: {monthlyKmAndFuel.km} Km
            </span>
            <span className="inline-flex items-center rounded-full bg-teal-500 text-white px-3 py-1">
              በወር ውስጥ የተቀዳ ነዳጅ በሊትር: {monthlyKmAndFuel.liters} L
            </span>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">No fuel requests found.</p>
          ) : (
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left">#</th>
                  <th className="border px-3 py-2 text-left">Date</th>
                  <th className="border px-3 py-2 text-left">Vehicle</th>
                  <th className="border px-3 py-2 text-left">Odometer</th>
                  <th className="border px-3 py-2 text-left">የተጠየቀዉ ነዳጅ በሊትር</th>
                  <th className="border px-3 py-2 text-left">Amount Type</th>
                  <th className="border px-3 py-2 text-left">Requester</th>
                  <th className="border px-3 py-2 text-left">Status</th>
                  <th className="border px-3 py-2 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const vehicleLabel = it.vehicle
                    ? `${it.vehicle.plate || ''}${it.vehicle.make ? ` - ${it.vehicle.make}` : ''}${
                        it.vehicle.model ? ` ${it.vehicle.model}` : ''
                      }`.trim() || it.vehicleId
                    : it.vehicleId

                  const requesterName = it.user
                    ? `${it.user.firstName || ''} ${it.user.lastName || ''}`.trim() || it.user.email || '-'
                    : '-'

                  return (
                    <tr key={it.id || idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 align-top">{idx + 1}</td>
                      <td className="border px-3 py-2 align-top">
                        {it.date ? new Date(it.date).toLocaleDateString('en-GB') : '-'}
                      </td>
                      <td className="border px-3 py-2 align-top">{vehicleLabel}</td>
                      <td className="border px-3 py-2 align-top">{it.odometer}</td>
                      <td className="border px-3 py-2 align-top">{it.amount}</td>
                      <td className="border px-3 py-2 align-top">{it.amountType}</td>
                      <td className="border px-3 py-2 align-top">{requesterName}</td>
                      <td className="border px-3 py-2 align-top">{it.status || '-'}</td>
                      <td
                        className="border px-3 py-2 align-top max-w-xs truncate"
                        title={it.notes || ''}
                      >
                        {it.notes || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
