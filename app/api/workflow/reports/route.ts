import { NextRequest, NextResponse } from "next/server";
import { WORKFLOW_REPORTS, Report, nextWorkflowId, PLATFORM_STORE, nextId } from "../../platform/_store";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

// GET /api/workflow/reports?planId=&assignmentId=&submittedTo=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const planId = searchParams.get('planId') || undefined;
  const assignmentId = searchParams.get('assignmentId') || undefined;
  const submittedTo = searchParams.get('submittedTo') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  let items = WORKFLOW_REPORTS as Report[];
  if (planId) items = items.filter(r => r.planId === planId);
  if (assignmentId) items = items.filter(r => r.assignmentId === assignmentId);
  if (submittedTo) items = items.filter(r => r.submittedTo === submittedTo);
  items = [...items].sort((a,b)=> String(b.id).localeCompare(String(a.id)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok: true, items: paged, page, pageSize, total });
}

// POST /api/workflow/reports  multipart or json
// multipart fields: planId, assignmentId, submittedBy, submittedTo, body, files
// extended optional fields: periodStart, periodEnd, employeeName, teamName, frequency, quarter,
// keyTasks, progressVsGoals, ongoing, challenges, collaboration, metrics, learnings, nextWeek, managerComments
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (/multipart\/form-data/i.test(contentType)) {
    const form = await req.formData();
    const planId = String(form.get('planId') || '');
    const assignmentId = String(form.get('assignmentId') || '');
    const submittedBy = String(form.get('submittedBy') || '');
    const submittedTo = String(form.get('submittedTo') || '');
    const body = String(form.get('body') || '');
    if (!planId || !assignmentId || !submittedBy || !submittedTo) return NextResponse.json({ ok:false, error:'missing fields' }, { status: 400 });
    // Extended fields
    const periodStart = form.get('periodStart') ? String(form.get('periodStart')) : undefined;
    const periodEnd = form.get('periodEnd') ? String(form.get('periodEnd')) : undefined;
    const employeeName = form.get('employeeName') ? String(form.get('employeeName')) : undefined;
    const teamName = form.get('teamName') ? String(form.get('teamName')) : undefined;
    const frequency = form.get('frequency') ? String(form.get('frequency')) as any : undefined;
    const quarter = form.get('quarter') ? String(form.get('quarter')) as any : undefined;
    const summary = {
      keyTasks: form.get('keyTasks') ? String(form.get('keyTasks')) : undefined,
      progressVsGoals: form.get('progressVsGoals') ? String(form.get('progressVsGoals')) : undefined,
      ongoing: form.get('ongoing') ? String(form.get('ongoing')) : undefined,
      challenges: form.get('challenges') ? String(form.get('challenges')) : undefined,
      collaboration: form.get('collaboration') ? String(form.get('collaboration')) : undefined,
      metrics: form.get('metrics') ? String(form.get('metrics')) : undefined,
      learnings: form.get('learnings') ? String(form.get('learnings')) : undefined,
      nextWeek: form.get('nextWeek') ? String(form.get('nextWeek')) : undefined,
      managerComments: form.get('managerComments') ? String(form.get('managerComments')) : undefined,
    };
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true }).catch(()=>{});
    const attachments: Report['attachments'] = [];
    const files = form.getAll('files');
    for (const f of files) {
      if (typeof File !== 'undefined' && f instanceof File) {
        const file = f as unknown as File;
        const buf = Buffer.from(await file.arrayBuffer());
        const safe = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${(file.name||'file').replace(/[^a-z0-9_.-]/gi,'_')}`;
        const dst = path.join(uploadDir, safe);
        await writeFile(dst, buf);
        attachments.push({ url: `/uploads/${safe}`, name: file.name || safe, type: file.type||'application/octet-stream', size: file.size||buf.length })
      }
    }
    const id = nextWorkflowId('RPTW');
    const rec: Report = {
      id,
      planId,
      assignmentId,
      submittedBy,
      submittedTo,
      body,
      attachments,
      status:'SUBMITTED',
      createdAt: new Date().toISOString(),
      history: [{ by: submittedBy, action: 'submit', at: new Date().toISOString() }],
      route: { chain: ['EMPLOYEE','TEAM','DEPARTMENT','PLANNING'], current: 'EMPLOYEE' },
      approvals: [],
      periodStart,
      periodEnd,
      employeeName,
      teamName,
      frequency,
      quarter,
      summary,
    };
    WORKFLOW_REPORTS.push(rec);
    try {
      PLATFORM_STORE.messages.push({ id: nextId('messages'), from: submittedBy, to: submittedTo, text: `New report ${id} submitted for assignment ${assignmentId}.`, createdAt: new Date().toISOString(), attachments: [], readBy: [] });
    } catch {}
    return NextResponse.json({ ok:true, item: rec });
  }
  const body = await req.json().catch(()=> ({} as any));
  const { planId, assignmentId, submittedBy, submittedTo, body: text,
    periodStart, periodEnd, employeeName, teamName, frequency, quarter, summary: sum,
    keyTasks, progressVsGoals, ongoing, challenges, collaboration, metrics, learnings, nextWeek, managerComments } = body as any;
  if (!planId || !assignmentId || !submittedBy || !submittedTo) return NextResponse.json({ ok:false, error:'missing fields' }, { status: 400 });
  const id = nextWorkflowId('RPTW');
  const rec: Report = {
    id,
    planId,
    assignmentId,
    submittedBy,
    submittedTo,
    body: String(text||''),
    attachments: [],
    status:'SUBMITTED',
    createdAt: new Date().toISOString(),
    history: [{ by: submittedBy, action: 'submit', at: new Date().toISOString() }],
    route: { chain: ['EMPLOYEE','TEAM','DEPARTMENT','PLANNING'], current: 'EMPLOYEE' },
    approvals: [],
    periodStart,
    periodEnd,
    employeeName,
    teamName,
    frequency,
    quarter,
    summary: sum || {
      keyTasks,
      progressVsGoals,
      ongoing,
      challenges,
      collaboration,
      metrics,
      learnings,
      nextWeek,
      managerComments,
    }
  };
  WORKFLOW_REPORTS.push(rec);
  try {
    PLATFORM_STORE.messages.push({ id: nextId('messages'), from: submittedBy, to: submittedTo, text: `New report ${id} submitted for assignment ${assignmentId}.`, createdAt: new Date().toISOString(), attachments: [], readBy: [] });
  } catch {}
  return NextResponse.json({ ok:true, item: rec });
}

// PATCH /api/workflow/reports/review  { id, action: 'review'|'approve'|'reject', by, comments? }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { id, action, by, comments } = body as { id: string; action: 'review'|'approve'|'reject'; by: string; comments?: string };
  if (!id || !action || !by) return NextResponse.json({ ok:false, error:'id/action/by required' }, { status: 400 });
  const idx = WORKFLOW_REPORTS.findIndex(r => r.id === id);
  if (idx === -1) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });
  let status = WORKFLOW_REPORTS[idx].status;
  if (action === 'review') status = 'REVIEWED';
  if (action === 'approve') status = 'APPROVED';
  if (action === 'reject') status = 'REJECTED';
  const cur = WORKFLOW_REPORTS[idx];
  const now = new Date().toISOString();
  const history = [...cur.history, { by, action, at: now, comments }];
  const approvals = Array.isArray(cur.approvals) ? [...cur.approvals] : [];
  const stage = cur.route?.current || 'TEAM';
  const decision = action === 'review' ? 'REVIEW' : (action === 'approve' ? 'APPROVE' : 'REJECT');
  approvals.push({ stage: stage as any, by, at: now, decision: decision as any, comments });
  // Advance stage on approve
  let route = cur.route;
  if (action === 'approve' && route && Array.isArray(route.chain)) {
    const i = route.chain.findIndex(s => s === route!.current);
    if (i >= 0 && i < route.chain.length - 1) {
      route = { ...route, current: route.chain[i+1] as any };
    }
  }
  WORKFLOW_REPORTS[idx] = { ...cur, status, history, approvals, route };
  try {
    const r = WORKFLOW_REPORTS[idx];
    PLATFORM_STORE.messages.push({ id: nextId('messages'), from: by, to: r.submittedBy, text: `Your report ${r.id} was ${action}.`, createdAt: new Date().toISOString(), attachments: [], readBy: [] });
  } catch {}
  return NextResponse.json({ ok:true, item: WORKFLOW_REPORTS[idx] });
}
