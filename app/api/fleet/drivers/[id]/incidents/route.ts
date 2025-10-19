import { NextRequest, NextResponse } from 'next/server'
import { DRIVER_INCIDENTS, nextItemId, type DriverIncidentItem } from '../../../_drivers_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = DRIVER_INCIDENTS[params.id] || []
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=>({}))
  const list = DRIVER_INCIDENTS[params.id] || (DRIVER_INCIDENTS[params.id] = [])
  const id = nextItemId(`${params.id}-INC`, list.length)
  const item: DriverIncidentItem = {
    id,
    driverId: params.id,
    date: String(body.date || new Date().toISOString()),
    type: (body.type || 'other') as any,
    description: String(body.description || ''),
    location: body.location,
    severity: body.severity,
    actionTaken: body.actionTaken,
  }
  if (!item.description) {
    return NextResponse.json({ ok: false, error: 'description required' }, { status: 400 })
  }
  list.unshift(item)
  return NextResponse.json({ ok: true, item })
}
