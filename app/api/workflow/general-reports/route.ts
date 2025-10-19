import { NextRequest, NextResponse } from "next/server";
import { DAILY_TASK_RECORDS, GENERAL_REPORTS, GeneralReport } from "../../platform/_store";

function nextGeneralReportId(): string {
  const n = GENERAL_REPORTS.length + 1;
  return `GR-${String(n).padStart(3, '0')}`;
}

function inRange(date: string, start?: string, end?: string): boolean {
  if (!start && !end) return true;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

// GET /api/workflow/general-reports?periodType=&periodStart=&periodEnd=&submittedBy=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const periodType = (searchParams.get('periodType') || '').toUpperCase();
  const periodStart = searchParams.get('periodStart') || undefined;
  const periodEnd = searchParams.get('periodEnd') || undefined;
  const submittedBy = searchParams.get('submittedBy') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));

  let items = GENERAL_REPORTS as GeneralReport[];
  if (periodType) items = items.filter(r => String(r.periodType||'').toUpperCase() === periodType);
  if (submittedBy) items = items.filter(r => String(r.submittedBy||'').toLowerCase() === submittedBy.toLowerCase());
  if (periodStart || periodEnd) items = items.filter(r => inRange(r.periodStart || '', periodStart, undefined) && inRange(r.periodEnd || '', undefined, periodEnd));

  items = [...items].sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok: true, items: paged, page, pageSize, total });
}

// POST /api/workflow/general-reports  JSON only
// If stats are not provided, compute from DAILY_TASK_RECORDS for the given submitter and period range
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({} as any));
  let { periodType, periodStart, periodEnd, submittedBy, submittedTo, title, notes, stats } = body as Partial<GeneralReport>;

  if (!periodType) periodType = 'All';
  if (!submittedBy) return NextResponse.json({ ok:false, error:'submittedBy required' }, { status: 400 });

  if (!stats) {
    const records = DAILY_TASK_RECORDS.filter(r => String(r.submittedBy||'').toLowerCase() === String(submittedBy).toLowerCase())
      .filter(r => inRange(r.date, periodStart, periodEnd));
    const totalTasks = records.reduce((acc, r)=> acc + (r.tasks?.length||0), 0);
    const totalMinutes = records.reduce((acc, r)=> acc + (r.totalMinutes||0), 0);
    let completed = 0, inProgress = 0, blocked = 0;
    for (const r of records) {
      for (const t of (r.tasks||[])) {
        const s = String(t.status||'').toLowerCase();
        if (s === 'completed') completed++;
        else if (s === 'in progress') inProgress++;
        else if (s === 'blocked') blocked++;
      }
    }
    stats = { totalMinutes, totalTasks, completed, inProgress, blocked };
    if (!title) title = `${periodType} Report ${periodStart || ''}${periodEnd ? ' to ' + periodEnd : ''}`.trim();
  }

  const rec: GeneralReport = {
    id: nextGeneralReportId(),
    periodType: periodType as any,
    periodStart,
    periodEnd,
    submittedBy: String(submittedBy),
    submittedTo: submittedTo ? String(submittedTo) : undefined,
    title: title ? String(title) : undefined,
    notes: notes ? String(notes) : undefined,
    stats: stats as GeneralReport['stats'],
    createdAt: new Date().toISOString(),
  };

  GENERAL_REPORTS.push(rec);
  return NextResponse.json({ ok:true, item: rec });
}
