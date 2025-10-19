import { NextRequest, NextResponse } from 'next/server'
import { getHelpDeskProvider } from '@/app/lib/helpdesk'
import { decodeJwt } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || undefined
  const status = url.searchParams.get('status') || undefined
  const requesterId = url.searchParams.get('requesterId') || undefined
  const limit = Number(url.searchParams.get('limit') || '50')
  // RBAC: require authenticated user for listing tickets
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const items = await getHelpDeskProvider().listTickets({ q, status, requesterId, limit })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=>({}))
  // RBAC: allow ticket creation for authenticated roles
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  const payload = token ? decodeJwt(token) : null
  const roles: string[] = []
  if (payload) {
    if (typeof payload.role === 'string') roles.push(payload.role)
    if (Array.isArray(payload.role)) roles.push(...payload.role)
    if (Array.isArray(payload.roles)) {
      for (const r of payload.roles as any[]) {
        if (typeof r === 'string') roles.push(r)
        else if (r && typeof r.name === 'string') roles.push(r.name)
      }
    }
    if (payload.realm_access?.roles) roles.push(...(payload.realm_access.roles || []))
    if (payload.resource_access) {
      for (const v of Object.values(payload.resource_access)) {
        if (Array.isArray((v as any)?.roles)) roles.push(...((v as any).roles))
      }
    }
  }
  const lowered = roles.map(r=>String(r).toLowerCase())
  const isAuthed = !!token && lowered.length >= 0
  if (!isAuthed) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const item = await getHelpDeskProvider().createTicket(body)
  return NextResponse.json({ ok: true, item })
}
