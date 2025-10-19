import { NextRequest, NextResponse } from 'next/server'
import { getHelpDeskProvider } from '@/app/lib/helpdesk'
import { decodeJwt } from '@/app/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Require auth
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !decodeJwt(token)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const item = await getHelpDeskProvider().getTicket(params.id)
  if (!item) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, item })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const updates = await req.json().catch(()=>({}))
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !decodeJwt(token)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  try {
    const item = await getHelpDeskProvider().updateTicket(params.id, updates)
    return NextResponse.json({ ok: true, item })
  } catch {
    return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  }
}
