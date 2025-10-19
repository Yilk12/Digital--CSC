"use client"
import React from "react"

type Totals = {
  totalVehicles: number
  available: number
  activeDrivers: number
  activeAssignments: number
}

type Props = {
  totals: Totals
  // optional fixed height for the chart area
  height?: number
  // optional colors
  colors?: {
    totalVehicles?: string
    available?: string
    activeDrivers?: string
    activeAssignments?: string
  }
}

export default function FleetReportChart({
  totals,
  height = 220,
  colors,
}: Props) {
  const items = [
    { key: "totalVehicles", label: "Total Vehicles", value: totals.totalVehicles, color: colors?.totalVehicles ?? "#2563eb" },
    { key: "available", label: "Available", value: totals.available, color: colors?.available ?? "#10b981" },
    { key: "activeDrivers", label: "Active Drivers", value: totals.activeDrivers, color: colors?.activeDrivers ?? "#f59e0b" },
    { key: "activeAssignments", label: "Active Assignments", value: totals.activeAssignments, color: colors?.activeAssignments ?? "#ef4444" },
  ]

  const max = Math.max(...items.map(i => i.value), 1)
  const barMaxWidth = 620 // px

  return (
    <div style={{ width: "100%", maxWidth: 740, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h4 style={{ margin: 0, fontSize: 16 }}>Fleet Summary</h4>
        <small style={{ color: "#6b7280" }}>Overview for Fleet Manager</small>
      </div>

      <div role="img" aria-label="Fleet totals bar chart" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it) => {
          return (
            <div key={it.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 140, color: "#374151", fontSize: 14 }}>{it.label}</div>

              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, background: "#f3f4f6", height: 18, borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ width: `${(it.value / max) * 100}%`, maxWidth: "100%", height: "100%", background: it.color }} />
                </div>

                <div style={{ minWidth: 64, textAlign: "right", color: "#111827", fontWeight: 600 }}>{it.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {items.map(i => (
          <div key={i.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151" }}>
            <span style={{ width: 12, height: 12, background: i.color, borderRadius: 3, display: "inline-block" }} />
            <span>{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
