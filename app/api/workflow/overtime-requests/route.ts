import { NextRequest, NextResponse } from "next/server";
import { OVERTIME_REQUESTS, OvertimeRequest, nextOvertimeId, ApprovalStatus } from "../../platform/_store";
import { requireAuth, requireRole } from "../../_auth";
import { notifyRequestSubmitted, notifyRequestStatus } from "../../_notify";
import { PLATFORM_STORE } from "../../platform/_store";
import { getPrisma } from "@/app/lib/db";

function toISO(d: Date) { return d.toISOString(); }

function isHHMM(v?: string) {
  if (!v) return true;
  return /^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(v);
}

function inDateRange(date: string, start?: string, end?: string) {
  if (!start && !end) return true;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

// GET /api/workflow/overtime-requests?requesterId=&status=&from=&to=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || undefined;
  const requesterId = searchParams.get('requesterId') || undefined;
  const status = searchParams.get('status') as ApprovalStatus | null;
  const from = searchParams.get('from') || undefined; // yyyy-mm-dd
  const to = searchParams.get('to') || undefined;     // yyyy-mm-dd
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  const prisma = getPrisma();
  let items = OVERTIME_REQUESTS as OvertimeRequest[];
  if (prisma) {
    try {
      const where: any = {};
      if (id) where.id = id;
      if (requesterId) where.requesterId = requesterId;
      if (status) where.status = status;
      // date range filter: any dates overlap
      const dbItems = await (prisma as any).overtimeRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
      if (id) return NextResponse.json({ ok:true, item: dbItems[0]||null });
      items = dbItems;
    } catch {}
  }
  if (id) {
    const it = items.find(r => r.id === id);
    if (!it) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });
    return NextResponse.json({ ok:true, item: it });
  }
  if (requesterId) items = items.filter(r => String(r.requesterId).toLowerCase() === requesterId.toLowerCase());
  if (status) items = items.filter(r => r.status === status);
  if (from || to) items = items.filter(r => (r.dates||[]).some(d => inDateRange(d, from, to)));

  items = [...items].sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok:true, items: paged, page, pageSize, total });
}

// POST create overtime request
// Body: { requesterId, requesterName?, department?, departmentHeadId?, overtimeType, dates[], startTime, endTime, durationType?, justification, attachmentUrls? }
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('ok' in auth === false) return auth as any;
  const body = await req.json().catch(()=> ({} as any));
  const {
    requesterId,
    requesterName,
    department,
    departmentHeadId,
    overtimeType,
    dates,
    startTime,
    endTime,
    durationType,
    justification,
    attachmentUrls,
    purposeType,
  } = body as Partial<OvertimeRequest> & { dates?: string[] };

  if (!requesterId) return NextResponse.json({ ok:false, error:'requesterId required' }, { status: 400 });
  if (!overtimeType || !['Extra Time','Weekend'].includes(String(overtimeType))) return NextResponse.json({ ok:false, error:'valid overtimeType required' }, { status: 400 });
  if (!Array.isArray(dates) || dates.length === 0) return NextResponse.json({ ok:false, error:'at least one date required' }, { status: 400 });
  if (!isHHMM(startTime) || !isHHMM(endTime)) return NextResponse.json({ ok:false, error:'startTime/endTime must be HH:MM' }, { status: 400 });
  if (!justification || String(justification).trim() === '') return NextResponse.json({ ok:false, error:'justification required' }, { status: 400 });

  const now = toISO(new Date());
  const rec: OvertimeRequest = {
    id: nextOvertimeId(),
    requesterId: String(requesterId),
    requesterName: requesterName ? String(requesterName) : undefined,
    department: department ? String(department) : undefined,
    departmentHeadId: departmentHeadId ? String(departmentHeadId) : undefined,
    requestType: 'OVERTIME',
    purposeType: purposeType ? String(purposeType) : undefined,
    overtimeType: overtimeType as any,
    dates: dates.map(d=> String(d)),
    startTime: startTime ? String(startTime) : undefined,
    endTime: endTime ? String(endTime) : undefined,
    durationType: durationType as any,
    justification: String(justification),
    attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : undefined,
    status: 'PENDING_DEPT',
    createdAt: now,
    updatedAt: now,
    history: [{ action:'SUBMIT', at: now }],
  };

  const prisma = getPrisma();
  if (prisma) {
    try { await (prisma as any).overtimeRequest.create({ data: rec }); } catch {}
  } else {
    OVERTIME_REQUESTS.push(rec);
  }
  // Notify Dept Head and Requester (email if available)
  try {
    const dh = PLATFORM_STORE.users.find(u=> u.id === rec.departmentHeadId);
    await notifyRequestSubmitted({ kind:'OVERTIME', id: rec.id, to: dh?.email, details: `Dates: ${(rec.dates||[]).join(', ')}` });
    const rq = PLATFORM_STORE.users.find(u=> [u.id,u.email].includes(rec.requesterId));
    await notifyRequestSubmitted({ kind:'OVERTIME', id: rec.id, to: rq?.email, details: `Type: ${rec.overtimeType}` });
  } catch {}
  return NextResponse.json({ ok:true, item: rec });
}

// PATCH status updates: { id, action: 'APPROVE'|'REJECT', actor: 'DEPT'|'HRM', comments? }
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(()=> ({} as any));
  const { id, action, actor, by, comments } = body as { id?: string; action?: 'APPROVE'|'REJECT'; actor?: 'DEPT'|'HRM'; by?: string; comments?: string };
  if (!id || !action || !actor) return NextResponse.json({ ok:false, error:'id, action, actor required' }, { status: 400 });
  if (actor === 'DEPT') {
    const r = requireRole(req, ['department_head']);
    if ('ok' in r === false) return r as any;
  } else if (actor === 'HRM') {
    // Treat admin/planning/strategy as HRM-level controllers for now
    const r = requireRole(req, ['admin','planning','strategy']);
    if ('ok' in r === false) return r as any;
  }
  const prisma = getPrisma();
  let rec: OvertimeRequest | undefined;
  if (prisma) {
    try { rec = await (prisma as any).overtimeRequest.findUnique({ where: { id } }); } catch {}
  } else {
    rec = OVERTIME_REQUESTS.find(r=> r.id === id);
  }
  if (!rec) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });

  const now = toISO(new Date());
  if (actor === 'DEPT') {
    if (rec.status !== 'PENDING_DEPT') return NextResponse.json({ ok:false, error:'invalid state' }, { status: 400 });
    if (action === 'APPROVE') rec.status = 'PENDING_HRM';
    else if (action === 'REJECT') rec.status = 'REJECTED';
  } else if (actor === 'HRM') {
    if (rec.status !== 'PENDING_HRM') return NextResponse.json({ ok:false, error:'invalid state' }, { status: 400 });
    if (action === 'APPROVE') rec.status = 'APPROVED';
    else if (action === 'REJECT') rec.status = 'REJECTED';
  }
  rec.updatedAt = now;
  rec.history.push({ by, at: now, action, comments });
  // Notify requester on status change
  try {
    const rq = PLATFORM_STORE.users.find(u=> [u.id,u.email].includes(rec.requesterId));
    await notifyRequestStatus({ kind:'OVERTIME', id: rec.id, to: rq?.email, status: rec.status, comments });
  } catch {}
  return NextResponse.json({ ok:true, item: rec });
}
