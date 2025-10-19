import { NextRequest, NextResponse } from 'next/server'
import { getAgentRegistry } from '@/app/lib/agents'
import { decodeJwt } from '@/app/lib/auth'

function requireAdmin(req: NextRequest) {
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
  const lowered = roles.map(r => String(r).toLowerCase())
  const isAdmin = lowered.some(r => r.includes('admin'))
  return isAdmin
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const item = getAgentRegistry().get(params.id)
  if (!item || item.type !== 'helpdesk') return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, item })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const updates = await req.json().catch(()=>({}))
  const updated = getAgentRegistry().update(params.id, updates)
  if (!updated || updated.type !== 'helpdesk') return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, item: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAdmin(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const item = getAgentRegistry().get(params.id)
  if (!item || item.type !== 'helpdesk') return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  const ok = getAgentRegistry().delete(params.id)
  return NextResponse.json({ ok })
}
