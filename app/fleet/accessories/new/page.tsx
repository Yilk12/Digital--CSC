"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function NewAccessoryPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<{ id: string; plate: string }[]>([])
  const [form, setForm] = useState({
    name: "",
    category: "",
    serial: "",
    vehicleId: "",
    status: "in_stock" as "in_stock" | "in_use" | "retired",
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>("")

  useEffect(() => {
    // load vehicles for attach option (optional)
    fetch("/api/fleet/vehicles")
      .then(r => r.json())
      .then(data => setVehicles((data?.items || []).map((v: any) => ({ id: v.id, plate: v.plate }))))
      .catch(() => setVehicles([]))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch("/api/fleet/accessories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to register accessory")
      setMsg("Accessory registered")
      setTimeout(() => router.push("/fleet/manager"), 500)
    } catch (err: any) {
      setMsg(err?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Register Accessory</h1>
      <form onSubmit={submit} className="grid gap-3">
        <div>
          <label className="block text-sm">Name</label>
          <input className="border rounded w-full p-2" required value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Category</label>
            <input className="border rounded w-full p-2" required value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Serial</label>
            <input className="border rounded w-full p-2" value={form.serial} onChange={e=>setForm({...form, serial:e.target.value})} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Attach to Vehicle (optional)</label>
            <select className="border rounded w-full p-2" value={form.vehicleId} onChange={e=>setForm({...form, vehicleId:e.target.value})}>
              <option value="">-- None --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm">Status</label>
            <select className="border rounded w-full p-2" value={form.status} onChange={e=>setForm({...form, status: e.target.value as any})}>
              <option value="in_stock">In Stock</option>
              <option value="in_use">In Use</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>
        <button type="submit" disabled={loading} className="px-3 py-2 border rounded">
          {loading ? "Saving..." : "Save Accessory"}
        </button>
      </form>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  )
}
