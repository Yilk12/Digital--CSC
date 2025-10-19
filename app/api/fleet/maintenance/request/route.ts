import { NextRequest, NextResponse } from "next/server"
import { MAINTENANCE_REQUESTS, MaintenanceRequest, MaintenanceReceipt, ReceiptPeriod, nextMaintenanceId } from "@/app/api/platform/_store"
import { getUserContext } from "@/app/api/_auth"

export async function GET() {
  return NextResponse.json({ ok: true, data: MAINTENANCE_REQUESTS })
}

export async function POST(req: NextRequest) {
  try {
    const ctx = getUserContext(req)
    if (!ctx.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      managerId,
      driverId,
      vehicleId,
      sourceRecordId,
      incidentSeverity,
      organization,
      receipts,
      receiptPeriod,
      notes,
    } = body || {}

    if (!managerId) return NextResponse.json({ ok: false, error: "managerId is required" }, { status: 400 })
    if (!driverId) return NextResponse.json({ ok: false, error: "driverId is required" }, { status: 400 })
    if (!organization) return NextResponse.json({ ok: false, error: "organization is required" }, { status: 400 })
    if (!incidentSeverity || !["HIGH","LOW"].includes(String(incidentSeverity))) {
      return NextResponse.json({ ok: false, error: "incidentSeverity must be 'HIGH' or 'LOW'" }, { status: 400 })
    }
    if (!receiptPeriod || !["Daily","Weekly","Monthly","Yearly"].includes(String(receiptPeriod))) {
      return NextResponse.json({ ok: false, error: "receiptPeriod must be Daily|Weekly|Monthly|Yearly" }, { status: 400 })
    }

    const recs: MaintenanceReceipt[] = Array.isArray(receipts) ? receipts.map((r: any, idx: number) => ({
      id: r?.id || `${Date.now()}-${idx}`,
      organization: String(r?.organization || organization),
      number: r?.number,
      date: r?.date,
      amount: Number(r?.amount || 0),
      currency: r?.currency || "ETB",
      fileName: r?.fileName,
      fileUrl: r?.fileUrl,
    })) : []

    const reqObj: MaintenanceRequest = {
      id: nextMaintenanceId('MQ'),
      managerId: String(managerId),
      driverId: String(driverId),
      vehicleId: vehicleId ? String(vehicleId) : undefined,
      sourceRecordId,
      status: 'OPEN',
      incidentSeverity,
      organization: String(organization),
      receipts: recs,
      receiptPeriod: receiptPeriod as ReceiptPeriod,
      notes,
      createdAt: new Date().toISOString(),
    }

    MAINTENANCE_REQUESTS.push(reqObj)
    return NextResponse.json({ ok: true, data: reqObj })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 })
  }
}
