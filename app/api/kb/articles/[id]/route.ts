import { NextRequest, NextResponse } from 'next/server'
import { getKBProvider } from '@/app/lib/kb'
import { decodeJwt } from '@/app/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !decodeJwt(token)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  const article = await getKBProvider().get(params.id)
  if (!article) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, article })
}
