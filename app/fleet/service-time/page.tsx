"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { listVehicles, listDrivers, type VehicleDTO, type DriverDTO } from "../../lib/fleet-api"

interface ServiceFormData {
  plateNumber: string
  vehicleModel: string
  odometerKm: string
  reachedDate: string
  driverName: string
  driverPhone: string

  serviceType5000: boolean
  serviceTypeCorrective: boolean
  serviceTypeOther: string
  otherWorkDone: boolean
  requestedBy: string
  requestDate: string
  reason: string

  // Pre‑service inspection
  engineOilStatus: "ok" | "low" | ""
  engineOilRemark: string
  brakeStatus: "ok" | "issue" | ""
  brakeRemark: string
  tireStatus: "ok" | "issue" | ""
  tireRemark: string
  coolantStatus: "ok" | "low" | ""
  coolantRemark: string
  batteryStatus: "ok" | "weak" | ""
  batteryRemark: string
  noisesStatus: "yes" | "no" | ""
  noisesRemark: string
  warningStatus: "yes" | "no" | ""
  warningRemark: string

  serviceCenter: string
  serviceStartDate: string
  serviceEndDate: string

  // GPS Reading Record
  gpsLatitude: string
  gpsLongitude: string
  gpsSpeed: string
  gpsHeading: string
  gpsIgnitionStatus: "ON" | "OFF" | ""
  gpsTimestamp: string
  gpsOdometer: string
  gpsFuelLevel: string
  gpsEngineStatus: string
  gpsTemperature: string
  gpsOtherTelemetry: string

  // Read-only status of the maintenance request / registration
  status?: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | string
}

const defaultData: ServiceFormData = {
  plateNumber: "",
  vehicleModel: "",
  odometerKm: "",
  reachedDate: "",
  driverName: "",
  driverPhone: "",

  serviceType5000: true,
  serviceTypeCorrective: false,
  serviceTypeOther: "",
  otherWorkDone: false,
  requestedBy: "",
  requestDate: "",
  reason: "",

  engineOilStatus: "",
  engineOilRemark: "",
  brakeStatus: "",
  brakeRemark: "",
  tireStatus: "",
  tireRemark: "",
  coolantStatus: "",
  coolantRemark: "",
  batteryStatus: "",
  batteryRemark: "",
  noisesStatus: "",
  noisesRemark: "",
  warningStatus: "",
  warningRemark: "",

  serviceCenter: "",
  serviceStartDate: "",
  serviceEndDate: "",

  gpsLatitude: "",
  gpsLongitude: "",
  gpsSpeed: "",
  gpsHeading: "",
  gpsIgnitionStatus: "",
  gpsTimestamp: "",
  gpsOdometer: "",
  gpsFuelLevel: "",
  gpsEngineStatus: "",
  gpsTemperature: "",
  gpsOtherTelemetry: "",
  status: 'PENDING',
}

export default function ServiceTimePage() {
  const [form, setForm] = useState<ServiceFormData>(defaultData)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [drivers, setDrivers] = useState<DriverDTO[]>([])
  const [history, setHistory] = useState<ServiceFormData[]>([])

  function update<K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type, checked } = e.target as HTMLInputElement
    if (type === "checkbox") {
      // @ts-expect-error name is a valid key
      update(name, checked)
    } else {
      // @ts-expect-error name is a valid key
      update(name, value)
    }
  }

  const mapServiceRegistration = (r: any): ServiceFormData => ({
    plateNumber: r.plateNumber,
    vehicleModel: r.vehicleModel || r.vehicle?.model || "",
    odometerKm: String(r.odometerKm ?? ""),
    reachedDate: r.reachedDate5000 ? new Date(r.reachedDate5000).toISOString().slice(0, 10) : "",
    driverName:
      r.driverName ||
      (r.driver ? `${r.driver.firstName || ""} ${r.driver.lastName || ""}`.trim() : ""),
    driverPhone: "",
    serviceType5000: true,
    serviceTypeCorrective: false,
    serviceTypeOther: "",
    otherWorkDone: false,
    requestedBy: r.driverName || "",
    requestDate: r.garageName || "",
    reason: "",
    engineOilStatus: "",
    engineOilRemark: "",
    brakeStatus: "",
    brakeRemark: "",
    tireStatus: "",
    tireRemark: "",
    coolantStatus: "",
    coolantRemark: "",
    batteryStatus: "",
    batteryRemark: "",
    noisesStatus: "",
    noisesRemark: "",
    warningStatus: "",
    warningRemark: "",
    serviceCenter: r.serviceCenter || "",
    serviceStartDate: r.serviceStart
      ? new Date(r.serviceStart).toISOString().slice(0, 10)
      : "",
    serviceEndDate: r.serviceEnd ? new Date(r.serviceEnd).toISOString().slice(0, 10) : "",
    gpsLatitude: "",
    gpsLongitude: "",
    gpsSpeed: "",
    gpsHeading: "",
    gpsIgnitionStatus: "",
    gpsTimestamp: "",
    gpsOdometer: "",
    gpsFuelLevel: "",
    gpsEngineStatus: "",
    gpsTemperature: "",
    gpsOtherTelemetry: "",
    status: (r.status as any) || 'PENDING',
  })

  async function loadHistory() {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token")
          : null

      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const url = apiBase
        ? `${apiBase}/api/fleet/service-registrations`
        : "/api/fleet/service-registrations"

      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        console.error("Failed to load service registrations", await res.text())
        return
      }

      const data = await res.json()
      const items = Array.isArray(data) ? data : data?.items || data?.data || []

      const mapped: ServiceFormData[] = (items || []).map(mapServiceRegistration)

      setHistory(mapped)
    } catch (err) {
      console.error("Error loading service registration history", err)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") ||
            localStorage.getItem("jwt") ||
            localStorage.getItem("token")
          : null

      const selectedVehicle = vehicles.find(v => v.plate === form.plateNumber)

      const payload = {
        vehicleId: selectedVehicle?.id || "",
        plateNumber: form.plateNumber,
        vehicleModel: form.vehicleModel || undefined,
        odometerKm: Number(form.odometerKm || 0),
        reachedDate5000: form.reachedDate || undefined,
        driverId: selectedVehicle ? (selectedVehicle as any).userId : undefined,
        driverName: form.driverName || undefined,
        garageName: form.requestDate || undefined,
        serviceCenter: form.serviceCenter || undefined,
        serviceStart: form.serviceStartDate || undefined,
        serviceEnd: form.serviceEndDate || undefined,
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL
      const url = apiBase
        ? `${apiBase}/api/fleet/service-registrations`
        : "/api/fleet/service-registrations"

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with status ${res.status}`)
      }

      // Use the created record from the API response to immediately
      // append to the local history table for this session.
      const created = await res.json().catch(() => null)
      if (created) {
        const newItems = Array.isArray(created)
          ? created.map(mapServiceRegistration)
          : [mapServiceRegistration(created)]
        setHistory(prev => [...newItems, ...prev])
      } else {
        // Fallback to reloading if response body is not as expected
        await loadHistory()
      }

      setMessage("Service registration saved successfully.")
      setForm(defaultData)
    } catch (err: any) {
      console.error("Failed to submit service registration", err)
      setMessage(err?.message || "Failed to submit form")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function loadVehicles() {
      try {
        setVehiclesLoading(true)
        const items = await listVehicles()
        if (!cancelled) setVehicles(items || [])
      } catch (err) {
        console.warn("Failed to load vehicles", err)
      } finally {
        if (!cancelled) setVehiclesLoading(false)
      }
    }
    async function loadDriversWrap() {
      try {
        const items = await listDrivers()
        if (!cancelled) setDrivers(items || [])
      } catch (err) {
        console.warn("Failed to load drivers", err)
      }
    }

    loadVehicles()
    loadDriversWrap()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const plate = form.plateNumber?.trim()
    if (!plate) return

    const controller = new AbortController()

    async function loadGps() {
      try {
        const res = await fetch(`/api/fleet/gps/latest?plate=${encodeURIComponent(plate)}`, {
          signal: controller.signal,
        })
        if (!res.ok) {
          console.warn("Failed to load GPS data", res.status)
          return
        }
        const data = await res.json()

        setForm(prev => ({
          ...prev,
          gpsLatitude: data.latitude ?? prev.gpsLatitude,
          gpsLongitude: data.longitude ?? prev.gpsLongitude,
          gpsSpeed: data.speedKph ?? prev.gpsSpeed,
          gpsHeading: data.heading ?? prev.gpsHeading,
          gpsIgnitionStatus: (data.ignition as any) ?? prev.gpsIgnitionStatus,
          gpsTimestamp: data.timestamp ?? prev.gpsTimestamp,
          gpsOdometer: data.odometerKm ?? prev.gpsOdometer,
          gpsFuelLevel: data.fuelLevel ?? prev.gpsFuelLevel,
          gpsEngineStatus: data.engineStatus ?? prev.gpsEngineStatus,
          gpsTemperature: data.temperature ?? prev.gpsTemperature,
          gpsOtherTelemetry: data.otherTelemetry ?? prev.gpsOtherTelemetry,
        }))
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.warn("Error loading GPS data", err)
      }
    }

    loadGps()

    return () => controller.abort()
  }, [form.plateNumber])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ሰርቪስ ላይ ያሉ መኪኖች</h1>
        </div>
        <Link
          href="/fleet"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          ← Back to Fleet Hub
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow border p-6">
        {/* 1. Vehicle Information */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">1. Vehicle Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle Plate Number *</label>
              <select
                name="plateNumber"
                value={form.plateNumber}
                onChange={e => {
                  const plate = e.target.value
                  const vehicle = vehicles.find(v => v.plate === plate)
                  const vehicleUser = vehicle && (vehicle as any).user
                  const driverId = vehicle && (vehicle as any).userId

                  console.log("Selected vehicle from backend:", vehicle)
                  console.log("Vehicle.user (assigned driver):", vehicleUser)

                  setForm(prev => ({
                    ...prev,
                    plateNumber: plate,
                    vehicleModel: vehicle
                      ? [vehicle.make, vehicle.model].filter(Boolean).join(" ")
                      : "",
                    driverName: vehicleUser
                      ? `${vehicleUser.firstName || ""} ${vehicleUser.lastName || ""}`.trim()
                      : plate
                        ? "Not assigned"
                        : "",
                    driverPhone: vehicleUser?.phone ?? "",
                  }))
                }}
                disabled={vehiclesLoading}
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">Select vehicle…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.plate}>
                    {v.plate}{v.make || v.model ? ` - ${[v.make, v.model].filter(Boolean).join(" ")}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vehicle Type / Model</label>
              <input
                name="vehicleModel"
                value={form.vehicleModel}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Odometer (KM) *</label>
              <input
                name="odometerKm"
                value={form.odometerKm}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date Reached 5,000 KM *</label>
              <input
                type="date"
                name="reachedDate"
                value={form.reachedDate}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assigned Driver Name *</label>
              <input
                name="driverName"
                value={form.driverName}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Phone *</label>
              <input
                name="driverPhone"
                value={form.driverPhone}
                readOnly
                className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-50"
              />
            </div>
          </div>
        </section>

        {/* 3. Pre-Service Inspection */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">3. Pre-Service Inspection (By Driver or Supervisor)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {[{
              label: "Engine oil level",
              statusKey: "engineOilStatus" as const,
              remarkKey: "engineOilRemark" as const,
              options: ["ok", "low"],
            },{
              label: "Brake performance",
              statusKey: "brakeStatus" as const,
              remarkKey: "brakeRemark" as const,
              options: ["ok", "issue"],
            },{
              label: "Tire pressure / condition",
              statusKey: "tireStatus" as const,
              remarkKey: "tireRemark" as const,
              options: ["ok", "issue"],
            },{
              label: "Coolant level",
              statusKey: "coolantStatus" as const,
              remarkKey: "coolantRemark" as const,
              options: ["ok", "low"],
            },{
              label: "Battery condition",
              statusKey: "batteryStatus" as const,
              remarkKey: "batteryRemark" as const,
              options: ["ok", "weak"],
            },{
              label: "Unusual noises",
              statusKey: "noisesStatus" as const,
              remarkKey: "noisesRemark" as const,
              options: ["yes", "no"],
            },{
              label: "Warning lights on dashboard",
              statusKey: "warningStatus" as const,
              remarkKey: "warningRemark" as const,
              options: ["yes", "no"],
            }].map(item => (
              <div key={item.label} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">{item.label}</span>
                  <select
                    name={item.statusKey}
                    value={form[item.statusKey]}
                    onChange={e => update(item.statusKey, e.target.value as any)}
                    className="ml-2 border rounded px-2 py-1 text-xs"
                  >
                    <option value="">Status…</option>
                    {item.options.map(opt => (
                      <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <input
                  name={item.remarkKey}
                  value={form[item.remarkKey]}
                  onChange={handleChange}
                  placeholder="Remark"
                  className="mt-1 w-full border rounded px-2 py-1 text-xs"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 5. Service Center Details */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">5. Service Center Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700">Service Center / Garage Name *</label>
              <input
                name="serviceCenter"
                value={form.serviceCenter}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Start Date *</label>
              <input
                type="date"
                name="serviceStartDate"
                value={form.serviceStartDate}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Service Completion Date *</label>
              <input
                type="date"
                name="serviceEndDate"
                value={form.serviceEndDate}
                onChange={handleChange}
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="px-4 py-2 rounded border text-sm"
            onClick={() => setForm(defaultData)}
            disabled={submitting}
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Submit Service Form"}
          </button>
        </div>

        {message && (
          <p className="mt-2 text-sm text-gray-700">{message}</p>
        )}
      </form>

      <section className="mt-8 bg-white rounded-lg shadow border">
        <h2 className="text-lg font-medium">Service Registration History</h2>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left">#</th>
                  <th className="border px-3 py-2 text-left">Plate Number</th>
                  <th className="border px-3 py-2 text-left">Vehicle Model</th>
                  <th className="border px-3 py-2 text-left">Odometer (KM)</th>
                  <th className="border px-3 py-2 text-left">Date Reached 5,000 KM</th>
                  <th className="border px-3 py-2 text-left">Driver</th>
                  <th className="border px-3 py-2 text-left">Service Center</th>
                  <th className="border px-3 py-2 text-left">Service Start</th>
                  <th className="border px-3 py-2 text-left">Service End</th>
                  <th className="border px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="border px-3 py-4 text-center text-gray-500" colSpan={9}>
                      No service registrations recorded in this session.
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 align-top">{history.length - index}</td>
                      <td className="border px-3 py-2 align-top">{item.plateNumber || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.vehicleModel || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.odometerKm || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.reachedDate || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.requestedBy || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.serviceCenter || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.serviceStartDate || '-'}</td>
                      <td className="border px-3 py-2 align-top">{item.serviceEndDate || '-'}</td>
                      <td className="border px-3 py-2 align-top">
                        {(() => {
                          const raw = (item.status || 'PENDING').toString().toUpperCase()

                          // Derive an effective status based on dates:
                          // if still PENDING but the service end date (or reached date)
                          // is today or in the past, treat it as COMPLETED.
                          const today = new Date().toISOString().slice(0, 10)
                          const endDate = item.serviceEndDate || item.reachedDate || ''

                          let effective: string
                          if (raw === 'PENDING' && endDate && endDate <= today) {
                            effective = 'COMPLETED'
                          } else {
                            effective = raw
                          }

                          const label =
                            effective === 'APPROVED' ||
                            effective === 'IN_PROGRESS' ||
                            effective === 'PENDING' ||
                            effective === 'COMPLETED'
                              ? effective
                              : 'PENDING'

                          const base =
                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold'
                          const cls =
                            label === 'APPROVED' || label === 'COMPLETED'
                              ? `${base} bg-green-100 text-green-700`
                              : label === 'IN_PROGRESS'
                                ? `${base} bg-blue-100 text-blue-700`
                                : `${base} bg-yellow-100 text-yellow-700`

                          return <span className={cls}>{label}</span>
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  )
}
