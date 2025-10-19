import { NextRequest, NextResponse } from "next/server"

// Lightweight in-memory workflow store keyed by maintenance request id
// Tracks operational status independent of financial status in _store.ts
// status: 'pending' | 'in_progress' | 'completed'
export type MaintenanceWorkflow = {
  requestId: string
  status: 'pending'|'in_progress'|'completed'
  assignedTo?: string
  history: Array<{ by?: string; action: 'assign'|'start'|'complete'; at: string; assignedTo?: string }>
}

const WORKFLOWS: Record<string, MaintenanceWorkflow> = {}

export async function GET() {
  return NextResponse.json({ ok: true, data: Object.values(WORKFLOWS) })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { requestId, action, assignedTo, by } = body || {}

    if (!requestId) return NextResponse.json({ ok: false, error: 'requestId is required' }, { status: 400 })
    if (!['assign','start','complete'].includes(String(action))) {
      return NextResponse.json({ ok: false, error: "action must be 'assign'|'start'|'complete'" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const wf: MaintenanceWorkflow = WORKFLOWS[requestId] || { requestId, status: 'pending', history: [] }

    if (action === 'assign') {
      wf.assignedTo = String(assignedTo || '') || undefined
      wf.status = 'pending'
      wf.history.push({ by, action: 'assign', at: now, assignedTo: wf.assignedTo })
    } else if (action === 'start') {
      wf.status = 'in_progress'
      wf.history.push({ by, action: 'start', at: now })
    } else if (action === 'complete') {
      wf.status = 'completed'
      wf.history.push({ by, action: 'complete', at: now })
    }

    WORKFLOWS[requestId] = wf
    return NextResponse.json({ ok: true, data: wf })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 })
  }
}
