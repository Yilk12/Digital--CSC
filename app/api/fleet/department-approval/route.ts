import { NextRequest, NextResponse } from 'next/server'
import { getHelpDeskProvider } from '@/app/lib/helpdesk'
import { getKBProvider } from '@/app/lib/kb'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any))
  const { requestId, status, comments, approverName, approvalDate } = body
  if (!requestId || !status) return NextResponse.json({ ok: false, error: 'requestId and status required' }, { status: 400 })
  const base = {
    ok: true,
    requestId,
    status,
    comments: comments || '',
    approverName: approverName || 'Dept Head',
    approvalDate: approvalDate || new Date().toISOString().slice(0,10),
    recordedAt: new Date().toISOString(),
  }

  // Optional integration: create a help desk ticket on rejection or when explicitly requested
  let ticket: any = null
  let related: any = null
  try {
    const shouldCreate = Boolean(body?.createTicket) || String(status).toUpperCase() === 'REJECTED'
    if (shouldCreate) {
      const provider = getHelpDeskProvider()
      ticket = await provider.createTicket({
        subject: `[FLEET APPROVAL] ${status} - ${requestId}`,
        description: `Department approval status: ${status}.\nComments: ${comments || ''}.\nApprover: ${approverName || 'Dept Head'}.\nApproval date: ${approvalDate || ''}.`,
        priority: String(status).toUpperCase() === 'REJECTED' ? 'high' : 'medium',
        tags: ['fleet', 'department-approval'],
      })
      const kb = getKBProvider()
      related = await kb.search({ q: `fleet approval ${status} ${comments || ''}`, limit: 5, tags: ['fleet'] })
    }
  } catch {
    // fail-soft: do not block
  }

  return NextResponse.json({ ...base, ...(ticket ? { ticket } : {}), ...(related ? { related } : {}) })
}
