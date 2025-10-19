import { NextRequest, NextResponse } from 'next/server'
import { getHelpDeskProvider } from '@/app/lib/helpdesk'
import { decodeJwt } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  if (!body.ticketId || !body.body) return NextResponse.json({ ok: false, error: 'ticketId and body required' }, { status: 400 })
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !decodeJwt(token)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const item = await getHelpDeskProvider().addComment(body)
  return NextResponse.json({ ok: true, item })
}
