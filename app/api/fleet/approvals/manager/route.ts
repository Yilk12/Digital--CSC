import { NextRequest, NextResponse } from 'next/server'
import { STORE } from '../../_store'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const { requestId, status, comments, approverName } = body
  if (!requestId) return NextResponse.json({ ok: false, error: 'requestId required' }, { status: 400 })

  const idx = STORE.requests.findIndex(r => r.id === requestId)
  if (idx === -1) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 })

  // Enforce: Manager can only act when status is APPROVED (by department)
  const current = STORE.requests[idx]
  if (String(current.status).toUpperCase() !== 'APPROVED') {
    return NextResponse.json({ ok: false, error: `Invalid state: expected APPROVED, got ${current.status}` }, { status: 409 })
  }
  // Allowed transitions: SCHEDULED or REJECTED
  const next = String(status || '').toUpperCase()
  if (!['SCHEDULED','REJECTED'].includes(next)) {
    return NextResponse.json({ ok: false, error: 'Invalid transition: manager can only set SCHEDULED or REJECTED' }, { status: 400 })
  }

  const record = {
    status: next,
    comments: comments || '',
    by: approverName || 'Fleet Manager',
    at: new Date().toISOString(),
  }
  STORE.requests[idx] = {
    ...STORE.requests[idx],
    status: next,
    managerApproval: record,
  }
  return NextResponse.json({ ok: true, request: STORE.requests[idx] })
}
