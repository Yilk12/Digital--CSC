import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    // Accept multipart/form-data
    const form = await req.formData()
    const file = form.get('file') as File | null
    const org = String(form.get('organization') || '')
    if (!file) return NextResponse.json({ ok: false, error: 'file is required' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts')
    await fs.mkdir(uploadsDir, { recursive: true })

    const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
    const base = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_')
    const filename = `${Date.now()}_${base}`
    const fullPath = path.join(uploadsDir, filename)
    await fs.writeFile(fullPath, buffer)

    const url = `/uploads/receipts/${filename}`
    return NextResponse.json({ ok: true, data: { fileName: file.name, fileUrl: url, size: buffer.length, organization: org } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Upload error' }, { status: 500 })
  }
}
