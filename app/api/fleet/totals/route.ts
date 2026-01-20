import { NextResponse } from "next/server"
import { getTotals, setTotals } from "@/backend/lib/fleet-store"

export async function GET() {
  const totals = await getTotals()
  return NextResponse.json(totals)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Only accept fields we know about
    const allowed = ["totalVehicles", "available", "activeDrivers", "activeAssignments"]
    const partial: Record<string, unknown> = {}

    for (const key of allowed) {
      if (key in body) {
        const val = body[key]
        // allow numeric-like values (strings or numbers)
        const num = Number(val)
        if (!isFinite(num)) {
          return NextResponse.json({ error: `Invalid numeric value for ${key}` }, { status: 400 })
        }
        partial[key] = num
      }
    }

    // If nothing provided, reject the request
    if (Object.keys(partial).length === 0) {
      return NextResponse.json({ error: "No valid fields provided" }, { status: 400 })
    }

    const saved = await setTotals(partial)
    return NextResponse.json(saved, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
