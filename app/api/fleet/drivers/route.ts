import { NextRequest, NextResponse } from 'next/server'

let MOCK_DRIVERS = [
  { id: 'D-01', name: 'Daniel', license: 'Valid', available: true },
  { id: 'D-02', name: 'Sara', license: 'Valid', available: true },
]

export async function GET() { return NextResponse.json({ items: MOCK_DRIVERS }) }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const id = body?.id || `D-${String(MOCK_DRIVERS.length + 1).padStart(2,'0')}`
  const item = { id, available: true, license: 'Valid', ...body }
  MOCK_DRIVERS.unshift(item)
  return NextResponse.json({ ok: true, item })
}
