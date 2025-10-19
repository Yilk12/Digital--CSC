import { NextRequest, NextResponse } from "next/server";
import { DAILY_TASK_RECORDS, DailyTaskRecord } from "../../platform/_store";

function nextDailyTaskId(): string {
  const n = DAILY_TASK_RECORDS.length + 1;
  return `DT-${String(n).padStart(3, '0')}`;
}

// GET /api/workflow/daily-tasks?date=yyyy-mm-dd&submittedBy=&page=&pageSize=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || undefined;
  const submittedBy = searchParams.get('submittedBy') || undefined;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  let items = DAILY_TASK_RECORDS as DailyTaskRecord[];
  if (date) items = items.filter(r => r.date === date);
  if (submittedBy) items = items.filter(r => String(r.submittedBy||'').toLowerCase() === String(submittedBy).toLowerCase());
  items = [...items].sort((a,b)=> String(b.createdAt).localeCompare(String(a.createdAt)));
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok: true, items: paged, page, pageSize, total });
}

// POST /api/workflow/daily-tasks  JSON only
export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({} as any));
  const {
    date,
    employeeName,
    department,
    team,
    supervisorName,
    tasks = [],
    totalMinutes,
    challenges,
    suggestions,
    submittedTo,
    signature,
    submittedBy,
  } = body as Partial<DailyTaskRecord>;

  if (!date || !employeeName || !submittedBy) {
    return NextResponse.json({ ok:false, error: 'date, employeeName, submittedBy are required' }, { status: 400 });
  }

  // Calculate totals if not provided
  function toMinutes(hhmm?: string): number | undefined {
    if (!hhmm) return undefined;
    const m = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
    if (!m) return undefined;
    const h = parseInt(m[1], 10), mi = parseInt(m[2], 10);
    return h * 60 + mi;
  }

  const normalizedTasks = (Array.isArray(tasks) ? tasks : []).map(t => {
    const start = toMinutes(t.startTime);
    const end = toMinutes(t.endTime);
    const duration = (start!=null && end!=null && end>=start) ? (end - start) : (t.totalMinutes||0);
    return {
      title: String(t.title||'').trim(),
      description: String(t.description||'').trim() || undefined,
      startTime: t.startTime,
      endTime: t.endTime,
      totalMinutes: typeof t.totalMinutes === 'number' ? t.totalMinutes : duration,
      priority: t.priority as any,
      status: t.status as any,
      remarks: String(t.remarks||'').trim() || undefined,
    };
  });

  const sumMinutes = typeof totalMinutes === 'number' ? totalMinutes : normalizedTasks.reduce((acc, t)=> acc + (t.totalMinutes||0), 0);

  const rec: DailyTaskRecord = {
    id: nextDailyTaskId(),
    date: String(date),
    employeeName: String(employeeName),
    department: department ? String(department) : undefined,
    team: team ? String(team) : undefined,
    supervisorName: supervisorName ? String(supervisorName) : undefined,
    tasks: normalizedTasks,
    totalMinutes: sumMinutes,
    challenges: challenges ? String(challenges) : undefined,
    suggestions: suggestions ? String(suggestions) : undefined,
    submittedTo: submittedTo ? String(submittedTo) : undefined,
    signature: signature ? String(signature) : undefined,
    submittedBy: String(submittedBy),
    createdAt: new Date().toISOString(),
  };

  DAILY_TASK_RECORDS.push(rec);
  return NextResponse.json({ ok: true, item: rec });
}
