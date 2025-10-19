import { NextRequest, NextResponse } from 'next/server'
import { DRIVER_CERTIFICATIONS, nextItemId, type DriverCertificationItem } from '../../../_drivers_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = DRIVER_CERTIFICATIONS[params.id] || []
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=>({}))
  const list = DRIVER_CERTIFICATIONS[params.id] || (DRIVER_CERTIFICATIONS[params.id] = [])
  const id = nextItemId(`${params.id}-CER`, list.length)
  const item: DriverCertificationItem = {
    id,
    driverId: params.id,
    name: String(body.name || ''),
    date: String(body.date || new Date().toISOString().slice(0,10)),
    expiresAt: body.expiresAt,
    issuer: body.issuer,
  }
  if (!item.name) {
    return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 })
  }
  list.unshift(item)
  return NextResponse.json({ ok: true, item })
}
