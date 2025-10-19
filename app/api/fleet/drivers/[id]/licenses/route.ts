import { NextRequest, NextResponse } from 'next/server'
import { DRIVER_LICENSES, nextItemId, type DriverLicenseItem } from '../../../_drivers_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = DRIVER_LICENSES[params.id] || []
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=>({}))
  const list = DRIVER_LICENSES[params.id] || (DRIVER_LICENSES[params.id] = [])
  const id = nextItemId(`${params.id}-LIC`, list.length)
  const item: DriverLicenseItem = {
    id,
    driverId: params.id,
    licenseClass: String(body.licenseClass || body.class || ''),
    number: String(body.number || ''),
    issuingAuthority: body.issuingAuthority || body.authority,
    issuedAt: body.issuedAt,
    expiresAt: String(body.expiresAt || ''),
  }
  if (!item.licenseClass || !item.number || !item.expiresAt) {
    return NextResponse.json({ ok: false, error: 'licenseClass, number, expiresAt required' }, { status: 400 })
  }
  list.unshift(item)
  return NextResponse.json({ ok: true, item })
}
