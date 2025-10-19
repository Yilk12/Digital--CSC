import { NextRequest, NextResponse } from 'next/server'

let MOCK_BUDGETS: any[] = [
  { id: 'b1', scope: 'Vehicle', scopeRef: 'V-01', period: '2025-Q4', amount: 3000, thresholdAlert: '90%' },
  { id: 'b2', scope: 'Department', scopeRef: 'HR', period: '2025', amount: 12000, thresholdAlert: '85%' },
]

export async function GET() { return NextResponse.json({ items: MOCK_BUDGETS }) }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const id = `b${MOCK_BUDGETS.length + 1}`
  const item = { id, ...body }
  MOCK_BUDGETS.unshift(item)
  return NextResponse.json({ ok: true, item })
}
