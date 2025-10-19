import { NextRequest, NextResponse } from 'next/server'
import { DRIVER_DOCS, DriverDocType, nextDocId } from '../../../_drivers_store'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const list = DRIVER_DOCS[params.id] || []
  return NextResponse.json({ items: list })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await req.formData()
    const docTypeRaw = String(form.get('docType') || '') as string
    const docType = (docTypeRaw || 'other_documents') as DriverDocType

    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // In a real app, you would persist the file to object storage and generate a URL.
    // Here we keep only metadata in memory for demo purposes.
    const driverId = params.id
    const id = nextDocId(driverId)
    const item = {
      id,
      driverId,
      docType,
      name: (file as any).name || 'document',
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      url: `#/${encodeURIComponent(driverId)}/${encodeURIComponent(id)}`,
    }

    if (!DRIVER_DOCS[driverId]) DRIVER_DOCS[driverId] = []
    DRIVER_DOCS[driverId].unshift(item)

    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Upload failed' }, { status: 500 })
  }
}
