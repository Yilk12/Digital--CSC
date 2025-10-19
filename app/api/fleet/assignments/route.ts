import { NextRequest, NextResponse } from 'next/server'

let MOCK_ASSIGNMENTS: any[] = []

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const { requestId, vehicleId, driverId, notes } = body as any
  if (!requestId || !vehicleId || !driverId) return NextResponse.json({ ok: false, error: 'requestId, vehicleId, driverId required' }, { status: 400 })
  const id = `a${MOCK_ASSIGNMENTS.length + 1}`
  const item = { id, requestId, vehicleId, driverId, notes: notes || '', createdAt: new Date().toISOString() }
  MOCK_ASSIGNMENTS.unshift(item)
  return NextResponse.json({ ok: true, id, item })
}
