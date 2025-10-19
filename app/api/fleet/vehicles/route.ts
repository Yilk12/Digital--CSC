import { NextRequest, NextResponse } from 'next/server'
import { STORE, nextVehicleId } from '../_store'

export async function GET() {
  return NextResponse.json({ items: STORE.vehicles })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  const id = body?.id || nextVehicleId()
  const item = { id, available: true, ...body }
  STORE.vehicles.unshift(item)
  return NextResponse.json({ ok: true, item })
}
