import { NextRequest, NextResponse } from 'next/server'
import { STORE } from '../../_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = STORE.vehicles.find(v => v.id === params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const idx = STORE.vehicles.findIndex(v => v.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const patch = await req.json().catch(()=>({}))
  STORE.vehicles[idx] = { ...STORE.vehicles[idx], ...patch, id: STORE.vehicles[idx].id }
  return NextResponse.json({ ok: true, item: STORE.vehicles[idx] })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const idx = STORE.vehicles.findIndex(v => v.id === params.id)
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const [removed] = STORE.vehicles.splice(idx, 1)
  return NextResponse.json({ ok: true, item: removed })
}
