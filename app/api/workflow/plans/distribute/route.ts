import { NextRequest, NextResponse } from "next/server";
import { WORKFLOW_ASSIGNMENTS, nextWorkflowId, Assignment, PLATFORM_STORE, nextId } from "../../../platform/_store";

// POST /api/workflow/plans/distribute  { planId: string, toUsers: string[], by: string, dueDate?: string, notes?: string }
// Creates DEPARTMENT level assignments for the selected recipients
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { planId, toUsers, by, dueDate, notes } = body as { planId: string; toUsers: string[]; by: string; dueDate?: string; notes?: string };
  if (!planId) return NextResponse.json({ ok: false, error: 'planId required' }, { status: 400 });
  if (!Array.isArray(toUsers) || toUsers.length === 0) return NextResponse.json({ ok: false, error: 'toUsers required' }, { status: 400 });
  if (!by) return NextResponse.json({ ok: false, error: 'by required' }, { status: 400 });

  const created: Assignment[] = [];
  for (const uid of toUsers) {
    const id = nextWorkflowId('ASN');
    const a: Assignment = {
      id,
      planId,
      level: 'DEPARTMENT',
      fromUserId: by,
      toUserId: uid,
      dueDate,
      notes,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      history: [{ by, action: 'create', at: new Date().toISOString(), comments: notes }],
    };
    WORKFLOW_ASSIGNMENTS.push(a);
    created.push(a);
    // notify assignee
    try {
      PLATFORM_STORE.messages.push({ id: nextId('messages'), from: by, to: uid, text: `New plan assignment ${id} for plan ${planId}.`, createdAt: new Date().toISOString(), attachments: [], readBy: [] });
    } catch {}
  }
  return NextResponse.json({ ok: true, items: created });
}
