import { NextRequest, NextResponse } from "next/server";
import { FIELD_REQUESTS, FieldRequest, nextFieldId, ApprovalStatus } from "../../platform/_store";
import { requireAuth, requireRole } from "../../_auth";

function toISO(d: Date) { return d.toISOString(); }

function isHHMM(v?: string) {
  if (!v) return true;
  return /^([0-1]?\d|2[0-3]):([0-5]\d)$/.test(v);
}

function calcNumberOfDays(from: string, to: string): number {
  try {
    const a = new Date(from + 'T00:00:00Z');
    const b = new Date(to + 'T00:00:00Z');
    const diff = Math.round((b.getTime() - a.getTime()) / (24*60*60*1000));
    return diff >= 0 ? diff + 1 : 0;
  } catch { return 0; }
}

function inDateRange(d: string, start?: string, end?: string) {
  if (!start && !end) return true;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

// GET /api/workflow/field-requests?requesterId=&status=&from=&to=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || undefined;
  const requesterId = searchParams.get('requesterId') || undefined;
  const status = searchParams.get('status') as ApprovalStatus | null;
  const from = searchParams.get('from') || undefined; // yyyy-mm-dd
  const to = searchParams.get('to') || undefined;     // yyyy-mm-dd
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  let items = FIELD_REQUESTS as FieldRequest[];
  if (id) {
    const it = items.find(r => r.id === id);
    if (!it) return NextResponse.json({ ok:false, error:'not found' }, { status: 404 });
    return NextResponse.json({ ok:true, item: it });
  }
  if (requesterId) items = items.filter(r => String(r.requesterId).toLowerCase() === requesterId.toLowerCase());
  if (status) items = items.filter(r => r.status === status);
  if (from || to) items = items.filter(r => inDateRange(r.fromDate, from, undefined) && inDateRange(r.toDate, undefined, to));

  items = [...items].sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok:true, items: paged, page, pageSize, total });
}

// POST create field request
// Body: { requesterId, requesterName?, department?, departmentHeadId?, location, fromDate, toDate, startTime?, endTime?, durationType?, purposeType?, justification, remarks?, totalTime?, attachmentUrls? }
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if ('ok' in auth === false) return auth as any;
  const body = await req.json().catch(()=> ({} as any));
  const {
    requesterId,
    requesterName,
    department,
    departmentHeadId,
    location,
    fromDate,
    toDate,
    startTime,
    endTime,
    durationType,
    purposeType,
    justification,
    remarks,
    totalTime,
    attachmentUrls,
  } = body as Partial<FieldRequest>;

  if (!requesterId) return NextResponse.json({ ok:false, error:'requesterId required' }, { status: 400 });
  if (!location || !['In Addis Ababa','Out of Addis Ababa'].includes(String(location))) return NextResponse.json({ ok:false, error:'valid location required' }, { status: 400 });
  if (!fromDate || !toDate) return NextResponse.json({ ok:false, error:'fromDate and toDate required' }, { status: 400 });
  if (fromDate > toDate) return NextResponse.json({ ok:false, error:'fromDate must be <= toDate' }, { status: 400 });
  if (!isHHMM(startTime) || !isHHMM(endTime)) return NextResponse.json({ ok:false, error:'startTime/endTime must be HH:MM' }, { status: 400 });
  if (!justification || String(justification).trim() === '') return NextResponse.json({ ok:false, error:'justification required' }, { status: 400 });

  const numberOfDays = calcNumberOfDays(String(fromDate), String(toDate));
  const now = toISO(new Date());
  const rec: FieldRequest = {
    id: nextFieldId(),
    requesterId: String(requesterId),
    requesterName: requesterName ? String(requesterName) : undefined,
    department: department ? String(department) : undefined,
    departmentHeadId: departmentHeadId ? String(departmentHeadId) : undefined,
    requestType: 'FIELD',
    purposeType: purposeType ? String(purposeType) : undefined,
    justification: String(justification),
    attachmentUrls: Array.isArray(attachmentUrls) ? attachmentUrls : undefined,
    location: location as any,
    fromDate: String(fromDate),
    toDate: String(toDate),
    numberOfDays,
    startTime: startTime ? String(startTime) : undefined,
    endTime: endTime ? String(endTime) : undefined,
    totalTime: totalTime ? String(totalTime) : undefined,
    durationType: durationType as any,
    remarks: remarks ? String(remarks) : undefined,
    status: 'PENDING_DEPT',
    createdAt: now,
    updatedAt: now,
    history: [{ action:'SUBMIT', at: now }],
  };

  FIELD_REQUESTS.push(rec);
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
    const r = requireRole(req, ['admin','planning','strategy']);
    if ('ok' in r === false) return r as any;
  }
  const rec = FIELD_REQUESTS.find(r=> r.id === id);
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
  return NextResponse.json({ ok:true, item: rec });
}
