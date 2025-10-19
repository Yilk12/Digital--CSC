import { NextRequest, NextResponse } from 'next/server'
import { STORE } from '../../_store'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const { requestId, status, comments, approverName } = body
  if (!requestId) return NextResponse.json({ ok: false, error: 'requestId required' }, { status: 400 })

  const idx = STORE.requests.findIndex(r => r.id === requestId)
  if (idx === -1) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 })

  // Enforce: Department can only act when status is CONFIRMED (by user)
  const current = STORE.requests[idx]
  if (String(current.status).toUpperCase() !== 'CONFIRMED') {
    return NextResponse.json({ ok: false, error: `Invalid state: expected CONFIRMED, got ${current.status}` }, { status: 409 })
  }
  // Allowed transitions: APPROVED or REJECTED
  const next = String(status || '').toUpperCase()
  if (!['APPROVED','REJECTED'].includes(next)) {
    return NextResponse.json({ ok: false, error: 'Invalid transition: department can only set APPROVED or REJECTED' }, { status: 400 })
  }

  const record = {
    status: next,
    comments: comments || '',
    by: approverName || 'Department Head',
    at: new Date().toISOString(),
  }
  STORE.requests[idx] = {
    ...STORE.requests[idx],
    status: next,
    departmentApproval: record,
  }
  return NextResponse.json({ ok: true, request: STORE.requests[idx] })
}
