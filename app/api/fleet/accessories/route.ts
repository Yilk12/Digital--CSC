import { NextRequest, NextResponse } from 'next/server'
import { STORE, nextAccessoryId } from '../_store'

export async function GET() {
  return NextResponse.json({ items: STORE.accessories })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = body?.id || nextAccessoryId()
  const item = { id, status: 'in_stock', ...body }
  STORE.accessories.unshift(item)
  return NextResponse.json({ ok: true, item })
}
