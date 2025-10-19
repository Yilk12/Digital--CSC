"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewVehiclePage() {
  const router = useRouter()
  const [form, setForm] = useState({
    plate: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    vin: "",
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch("/api/fleet/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || "Failed to register vehicle")
      setMsg("Vehicle registered")
      setTimeout(() => router.push("/fleet/manager"), 500)
    } catch (err: any) {
      setMsg(err?.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl w-full mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Register New Vehicle</h1>
      <form onSubmit={submit} className="grid gap-3">
        <div>
          <label className="block text-sm">Plate Number</label>
          <input className="border rounded w-full p-2" required value={form.plate} onChange={e=>setForm({...form, plate:e.target.value})} />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm">Make</label>
            <input className="border rounded w-full p-2" required value={form.make} onChange={e=>setForm({...form, make:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Model</label>
            <input className="border rounded w-full p-2" required value={form.model} onChange={e=>setForm({...form, model:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">Year</label>
            <input type="number" min={1970} max={2100} className="border rounded w-full p-2" required value={form.year} onChange={e=>setForm({...form, year: Number(e.target.value)})} />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm">Color</label>
            <input className="border rounded w-full p-2" value={form.color} onChange={e=>setForm({...form, color:e.target.value})} />
          </div>
          <div>
            <label className="block text-sm">VIN</label>
            <input className="border rounded w-full p-2" value={form.vin} onChange={e=>setForm({...form, vin:e.target.value})} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="px-3 py-2 border rounded">
          {loading ? "Saving..." : "Save Vehicle"}
        </button>
      </form>
      {msg && <p className="text-sm">{msg}</p>}
    </div>
  )
}
