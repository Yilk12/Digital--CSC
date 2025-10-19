import { NextRequest, NextResponse } from 'next/server'

let MOCK_TRIPS = [
  { id: 't1', date: new Date().toISOString().slice(0,10), time: '09:00', destination: 'Airport', passengers: 2, driverId: 'D-01', status: 'ASSIGNED', odometerStart: null as number | null, odometerEnd: null as number | null },
  { id: 't2', date: new Date(Date.now()+86400000).toISOString().slice(0,10), time: '13:00', destination: 'HQ', passengers: 1, driverId: 'D-02', status: 'ASSIGNED', odometerStart: null as number | null, odometerEnd: null as number | null },
]

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const me = url.searchParams.get('me')
  const driverId = url.searchParams.get('driverId')
  const items = driverId ? MOCK_TRIPS.filter(t=>t.driverId===driverId) : MOCK_TRIPS
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const id = `t${MOCK_TRIPS.length+1}`
  const item = { id, status: 'ASSIGNED', ...body }
  MOCK_TRIPS.unshift(item)
  return NextResponse.json({ ok: true, item })
}
