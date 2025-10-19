import { NextRequest, NextResponse } from 'next/server'

// Proxy to real backend (NestJS) tickets service
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005'
const API_BASE = `${API_ORIGIN}/api/v1`

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const qs = new URLSearchParams()
  // Map common filters
  if (url.searchParams.get('page')) qs.set('page', url.searchParams.get('page')!)
  if (url.searchParams.get('pageSize')) qs.set('limit', url.searchParams.get('pageSize')!)
  if (url.searchParams.get('status')) qs.set('status', url.searchParams.get('status')!)
  if (url.searchParams.get('priority')) qs.set('priority', url.searchParams.get('priority')!)
  if (url.searchParams.get('category')) qs.set('category', url.searchParams.get('category')!)
  if (url.searchParams.get('assigneeId')) qs.set('assigneeId', url.searchParams.get('assigneeId')!)
  if (url.searchParams.get('departmentId')) qs.set('departmentId', url.searchParams.get('departmentId')!)
  if (url.searchParams.get('q')) qs.set('search', url.searchParams.get('q')!)

  const resp = await fetch(`${API_BASE}/tickets?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Forward Authorization if present
      ...(req.headers.get('authorization') ? { Authorization: req.headers.get('authorization') as string } : {}),
    },
    // include cookies if any
    credentials: 'include',
    cache: 'no-store',
  })

  const data = await resp.json().catch(() => null)
  return new NextResponse(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } })
}

export async function POST(req: NextRequest) {
  // Forward JSON body directly; for attachments, call backend endpoints from client
  const body = await req.json().catch(() => ({}))
  const resp = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(req.headers.get('authorization') ? { Authorization: req.headers.get('authorization') as string } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const data = await resp.json().catch(() => null)
  return new NextResponse(JSON.stringify(data), { status: resp.status, headers: { 'Content-Type': 'application/json' } })
}
