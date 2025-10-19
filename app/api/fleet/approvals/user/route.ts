import { NextRequest, NextResponse } from 'next/server'
import { STORE } from '../../_store'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const { requestId, status, comments, approverName } = body
  if (!requestId) return NextResponse.json({ ok: false, error: 'requestId required' }, { status: 400 })

  const idx = STORE.requests.findIndex(r => r.id === requestId)
  if (idx === -1) return NextResponse.json({ ok: false, error: 'Request not found' }, { status: 404 })

  // Enforce: User can only confirm when current status is PENDING
  const current = STORE.requests[idx]
  if (String(current.status).toUpperCase() !== 'PENDING') {
    return NextResponse.json({ ok: false, error: `Invalid state: expected PENDING, got ${current.status}` }, { status: 409 })
  }
  // Only allow CONFIRMED as target
  const next = (status || 'CONFIRMED').toString().toUpperCase()
  if (next !== 'CONFIRMED') {
    return NextResponse.json({ ok: false, error: `Invalid transition: user can only set CONFIRMED` }, { status: 400 })
  }

  const record = {
    status: next,
    comments: comments || '',
    by: approverName || 'User',
    at: new Date().toISOString(),
  }
  STORE.requests[idx] = {
    ...STORE.requests[idx],
    status: next,
    userApproval: record,
  }
  return NextResponse.json({ ok: true, request: STORE.requests[idx] })
}
