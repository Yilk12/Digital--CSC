"use client"
import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import FleetReportChart from "@/app/components/fleet-report-chart"

type Totals = {
  totalVehicles: number
  available: number
  activeDrivers: number
  activeAssignments: number
}

export default function FleetReportWidget() {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)
  const [totals, setTotals] = useState<Totals | null>(null)
  const STORAGE_KEY = "fleetTotals"

  useEffect(() => {
    if (typeof window === "undefined") return

    const storedRole =
      localStorage.getItem("userRole") || sessionStorage.getItem("userRole") || null
    setRole(storedRole)

    const raw =
      localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)

    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        setTotals({
          totalVehicles: Number(parsed.totalVehicles) || 0,
          available: Number(parsed.available) || 0,
          activeDrivers: Number(parsed.activeDrivers) || 0,
          activeAssignments: Number(parsed.activeAssignments) || 0,
        })
        return
      } catch {
        // fall through to fetch
      }
    }

    // If no stored totals, try fetching from API and persist to localStorage
    const fetchAndStoreTotals = async () => {
      try {
        const res = await fetch("/api/fleet/totals")
        if (!res.ok) throw new Error("Fetch failed")
        const data = await res.json()
        const resolved: Totals = {
          totalVehicles: Number(data.totalVehicles) || 0,
          available: Number(data.available) || 0,
          activeDrivers: Number(data.activeDrivers) || 0,
          activeAssignments: Number(data.activeAssignments) || 0,
        }
        // persist to localStorage as JSON
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resolved))
        } catch {
          /* ignore storage errors */
        }
        setTotals(resolved)
      } catch {
        // fallback to safe defaults and store them
        const fallback: Totals = {
          totalVehicles: 0,
          available: 0,
          activeDrivers: 0,
          activeAssignments: 0,
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback))
        } catch {
          /* ignore storage errors */
        }
        setTotals(fallback)
      }
    }

    fetchAndStoreTotals()
  }, [])

  // Hide on About page
  if (pathname === "/about" || pathname?.startsWith("/about/")) return null
  if (!role) return null

  const normalized = role.toLowerCase()
  const isFleetManager =
    normalized === "fleet_manager" ||
    normalized === "fleet manager" ||
    normalized === "fleet" ||
    normalized.includes("fleet")

  if (!isFleetManager) return null
  if (!totals) return null

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <FleetReportChart totals={totals} />
    </div>
  )
}
