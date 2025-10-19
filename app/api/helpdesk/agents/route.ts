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

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const departmentId = url.searchParams.get('departmentId') || undefined
  const q = url.searchParams.get('q') || undefined
  const items = getAgentRegistry().list({ type: 'helpdesk', departmentId, q }).items
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(()=>({}))
  const item = getAgentRegistry().create({ ...body, type: 'helpdesk' })
  return NextResponse.json({ ok: true, item })
}
