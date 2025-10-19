import { NextRequest, NextResponse } from 'next/server'
import { STORE } from '../../_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = STORE.requests.find(r => r.id === params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const idx = STORE.requests.findIndex(r => r.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const patch = await req.json().catch(()=>({}))
  STORE.requests[idx] = { ...STORE.requests[idx], ...patch, id: STORE.requests[idx].id }
  return NextResponse.json({ ok: true, item: STORE.requests[idx] })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = STORE.requests.findIndex(r => r.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = STORE.requests.splice(idx, 1)
  return NextResponse.json({ ok: true, item: removed })
}
