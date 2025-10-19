import { NextRequest, NextResponse } from "next/server"
import { FINANCE_QUEUE } from "@/app/api/platform/_store"
import { getUserContext } from "@/app/api/_auth"

export async function POST(req: NextRequest) {
  try {
    const ctx = getUserContext(req)
    if (!ctx.id) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { batchId } = body || {}
    if (!batchId) return NextResponse.json({ ok: false, error: 'batchId is required' }, { status: 400 })

    const batch = FINANCE_QUEUE.find(b => b.id === String(batchId))
    if (!batch) return NextResponse.json({ ok: false, error: 'Batch not found' }, { status: 404 })

    batch.status = 'PAID'
    return NextResponse.json({ ok: true, data: batch })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 })
  }
}
