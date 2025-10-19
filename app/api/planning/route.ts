import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE, nextId } from "../platform/_store";

// GET: list plans (optionally by owner or status)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const status = searchParams.get("status");
  const q = (searchParams.get('q') || '').toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const sortBy = (searchParams.get('sortBy') || '').toLowerCase();
  const sortDir = ((searchParams.get('sortDir') || 'asc').toLowerCase() === 'desc') ? 'desc' : 'asc';
  const sortMulti = (searchParams.get('sort') || '').trim();

  let items = PLATFORM_STORE.planning;
  if (owner) items = items.filter((p) => String(p.owner) === owner);
  if (status) items = items.filter((p) => String(p.status) === status);
  if (q) items = items.filter((p: any) =>
    String(p.title || '').toLowerCase().includes(q) ||
    String(p.description || '').toLowerCase().includes(q) ||
    String(p.id || '').toLowerCase().includes(q)
  );
  function compareWith(fields: Array<{ key: string; dir: 'asc'|'desc' }>) {
    return (a: any, b: any) => {
      for (const f of fields) {
        const av = a?.[f.key];
        const bv = b?.[f.key];
        if (av == null && bv == null) continue;
        if (av == null) return f.dir === 'asc' ? -1 : 1;
        if (bv == null) return f.dir === 'asc' ? 1 : -1;
        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        if (as < bs) return f.dir === 'asc' ? -1 : 1;
        if (as > bs) return f.dir === 'asc' ? 1 : -1;
      }
      return 0;
    };
  }
  if (sortMulti) {
    const fields = sortMulti.split(',').map(s => s.trim()).filter(Boolean).map(part => {
      const [k, d] = part.split(':').map(t => t.trim().toLowerCase());
      return { key: k, dir: d === 'desc' ? 'desc' as const : 'asc' as const };
    });
    if (fields.length > 0) items = [...items].sort(compareWith(fields));
  } else if (sortBy) {
    items = [...items].sort(compareWith([{ key: sortBy, dir: sortDir }]));
  }
  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return NextResponse.json({ ok: true, items: paged, page, pageSize, total });
}

// PUT: update a plan (title/description only for now)
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { id, title, description } = body as { id: string; title?: string; description?: string };
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const idx = PLATFORM_STORE.planning.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  const prev = PLATFORM_STORE.planning[idx];
  const updated = {
    ...prev,
    title: typeof title === 'string' && title.trim() ? String(title) : prev.title,
    description: typeof description === 'string' ? String(description) : prev.description,
  };
  PLATFORM_STORE.planning[idx] = updated;
  return NextResponse.json({ ok: true, item: updated });
}

// DELETE: delete a plan by id (use query param ?id=)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
  const idx = PLATFORM_STORE.planning.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  const removed = PLATFORM_STORE.planning.splice(idx, 1)[0];
  return NextResponse.json({ ok: true, item: removed });
}

// POST: create a new plan (creator is typically staff)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { title, description, owner } = body;
  if (!title) return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });
  const id = nextId("planning");
  const record = {
    id,
    title: String(title),
    description: String(description || ""),
    owner: String(owner || "unknown"),
    status: "DRAFT",
    assignee: "TEAM_LEAD", // next step: team lead review
    route: { chain: ['PLANNING','DEPARTMENT','TEAM','EMPLOYEE'], current: 'PLANNING' as const },
    approvals: [] as Array<{ stage: 'PLANNING'|'DEPARTMENT'|'TEAM'|'EMPLOYEE'; by?: string; at?: string; decision?: 'REVIEW'|'APPROVE'|'REJECT'; comments?: string }>,
    attachments: [],
    history: [
      { by: String(owner || "unknown"), action: "create", at: new Date().toISOString(), comments: "" },
    ],
  };
  PLATFORM_STORE.planning.push(record);
  return NextResponse.json({ ok: true, item: record });
}
