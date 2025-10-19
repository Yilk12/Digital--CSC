import { NextRequest, NextResponse } from 'next/server'
import { DRIVER_TRAININGS, nextItemId, type DriverTrainingItem } from '../../../_drivers_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = DRIVER_TRAININGS[params.id] || []
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=>({}))
  const list = DRIVER_TRAININGS[params.id] || (DRIVER_TRAININGS[params.id] = [])
  const id = nextItemId(`${params.id}-TRN`, list.length)
  const item: DriverTrainingItem = {
    id,
    driverId: params.id,
    topic: String(body.topic || ''),
    date: String(body.date || new Date().toISOString().slice(0,10)),
    trainer: body.trainer,
    certificateUrl: body.certificateUrl,
  }
  if (!item.topic) {
    return NextResponse.json({ ok: false, error: 'topic required' }, { status: 400 })
  }
  list.unshift(item)
  return NextResponse.json({ ok: true, item })
}
