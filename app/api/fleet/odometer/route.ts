import { NextRequest, NextResponse } from 'next/server'

let MOCK_ODOMETER_LOGS: any[] = []

export async function GET() {
  return NextResponse.json({ items: MOCK_ODOMETER_LOGS })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = `ODO-${String(MOCK_ODOMETER_LOGS.length + 1).padStart(3, '0')}`
  const timestamp = new Date().toISOString()
  const item = { id, timestamp, ...body }
  MOCK_ODOMETER_LOGS.unshift(item)
  return NextResponse.json({ ok: true, item })
}
