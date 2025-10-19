import { NextRequest, NextResponse } from 'next/server'
import { FIN_STORE } from '../../_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = FIN_STORE.tcos.find(t => t.id === params.id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ item })
}
