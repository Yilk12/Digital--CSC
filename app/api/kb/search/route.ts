import { NextRequest, NextResponse } from 'next/server'
import { getKBProvider } from '@/app/lib/kb'
import { decodeJwt } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q') || ''
  const limit = Number(url.searchParams.get('limit') || '10')
  const tags = url.searchParams.getAll('tag')
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !decodeJwt(token)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const items = await getKBProvider().search({ q, limit, tags })
  return NextResponse.json(items)
}
