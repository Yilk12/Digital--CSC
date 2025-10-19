import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE } from "../../platform/_store";

// GET /api/report/users?role=DEPARTMENT_HEAD&q=dina
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "").toUpperCase();
  const q = (searchParams.get("q") || "").toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
  const sortBy = (searchParams.get('sortBy') || '').toLowerCase();
  const sortDir = ((searchParams.get('sortDir') || 'asc').toLowerCase() === 'desc') ? 'desc' : 'asc';
  const sortMulti = (searchParams.get('sort') || '').trim();
  let items = PLATFORM_STORE.users;
  if (role) items = items.filter((u: any) => String(u.role || '').toUpperCase() === role);
  if (q) items = items.filter((u: any) =>
    String(u.name || '').toLowerCase().includes(q) ||
    String(u.email || '').toLowerCase().includes(q) ||
    String(u.id || '').toLowerCase().includes(q)
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
