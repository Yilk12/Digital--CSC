import { NextRequest, NextResponse } from 'next/server'

let MOCK_COSTS: any[] = [
  { id: 'c1', date: '2025-09-25', category: 'Fuel', amount: 120.5, vehicleId: 'V-01', departmentId: 'HR', projectCode: 'PRJ-001' },
  { id: 'c2', date: '2025-09-26', category: 'Repairs & maintenance', amount: 450.0, vehicleId: 'V-02', departmentId: 'OPS', projectCode: 'PRJ-002' },
]

export async function GET() {
  return NextResponse.json({ items: MOCK_COSTS })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const id = `c${MOCK_COSTS.length + 1}`
  const item = { id, ...body }
  MOCK_COSTS.unshift(item)
  return NextResponse.json({ ok: true, item })
}
