import { NextRequest, NextResponse } from 'next/server'
import { STORE, nextRequestId } from '../_store'

export async function GET() {
  return NextResponse.json({ items: STORE.requests })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const id = nextRequestId()
  const date = body?.date || new Date().toISOString().slice(0,10)
  const item = { id, status: 'PENDING', date, ...body }
  STORE.requests.unshift(item)
  return NextResponse.json({ ok: true, id, item })
}
