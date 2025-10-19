import { NextRequest, NextResponse } from "next/server";
import { WORKFLOW_ASSIGNMENTS, Assignment, nextWorkflowId, PLATFORM_STORE, nextId } from "../../platform/_store";

// GET /api/workflow/assignments?planId=&level=&toUserId=&status=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get('planId') || undefined;
  const level = searchParams.get('level') as Assignment['level'] | undefined;
  const toUserId = searchParams.get('toUserId') || undefined;
  const status = searchParams.get('status') as Assignment['status'] | undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  let items = WORKFLOW_ASSIGNMENTS as Assignment[];
  if (planId) items = items.filter(a => a.planId === planId);
  if (level) items = items.filter(a => a.level === level);
  if (toUserId) items = items.filter(a => a.toUserId === toUserId);
  if (status) items = items.filter(a => a.status === status);
  // newest first by id string
  items = [...items].sort((a,b)=> String(b.id).localeCompare(String(a.id)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok: true, items: paged, page, pageSize, total });
}

// POST /api/workflow/assignments { parentAssignmentId, level, by, toUsers: string[], dueDate?, notes? }
// Creates child assignments for fan-out (TEAM or EMPLOYEE)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { parentAssignmentId, level, by, toUsers, dueDate, notes } = body as { parentAssignmentId: string; level: Assignment['level']; by: string; toUsers: string[]; dueDate?: string; notes?: string };
  if (!parentAssignmentId) return NextResponse.json({ ok: false, error: 'parentAssignmentId required' }, { status: 400 });
  if (!level || (level !== 'TEAM' && level !== 'EMPLOYEE')) return NextResponse.json({ ok: false, error: 'level must be TEAM or EMPLOYEE' }, { status: 400 });
  if (!by) return NextResponse.json({ ok: false, error: 'by required' }, { status: 400 });
  if (!Array.isArray(toUsers) || toUsers.length === 0) return NextResponse.json({ ok: false, error: 'toUsers required' }, { status: 400 });

  const parent = WORKFLOW_ASSIGNMENTS.find(a => a.id === parentAssignmentId);
  if (!parent) return NextResponse.json({ ok: false, error: 'parent not found' }, { status: 404 });

  const created: Assignment[] = [];
  for (const uid of toUsers) {
    const id = nextWorkflowId('ASN');
    const a: Assignment = {
      id,
      planId: parent.planId,
      level,
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
    try {
      PLATFORM_STORE.messages.push({ id: nextId('messages'), from: by, to: uid, text: `New ${level} assignment ${id} for plan ${parent.planId}.`, createdAt: new Date().toISOString(), attachments: [], readBy: [] });
    } catch {}
  }
  return NextResponse.json({ ok: true, items: created });
}

// PATCH /api/workflow/assignments { id, action: 'start'|'complete'|'reject', by, comments? }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { id, action, by, comments } = body as { id: string; action: 'start'|'complete'|'reject'; by: string; comments?: string };
  if (!id || !action || !by) return NextResponse.json({ ok: false, error: 'id/action/by required' }, { status: 400 });
  const idx = WORKFLOW_ASSIGNMENTS.findIndex(a => a.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  let status: Assignment['status'] = WORKFLOW_ASSIGNMENTS[idx].status;
  if (action === 'start') status = 'IN_PROGRESS';
  if (action === 'complete') status = 'COMPLETED';
  if (action === 'reject') status = 'REJECTED';
  const hist = [...WORKFLOW_ASSIGNMENTS[idx].history, { by, action, at: new Date().toISOString(), comments }];
  WORKFLOW_ASSIGNMENTS[idx] = { ...WORKFLOW_ASSIGNMENTS[idx], status, history: hist };
  return NextResponse.json({ ok: true, item: WORKFLOW_ASSIGNMENTS[idx] });
}
