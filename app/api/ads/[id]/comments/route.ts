import { NextRequest, NextResponse } from "next/server"
import { addComment, getComments, getAdById } from "../../_store"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const list = getComments(params.id)
  return NextResponse.json(list)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const author = body?.author || 'Anonymous'
    const content = String(body?.content || '').trim()
    if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    if (!getAdById(params.id)) return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    const c = addComment(params.id, author, content, body?.parentId)
    return NextResponse.json(c, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 400 })
  }
}
