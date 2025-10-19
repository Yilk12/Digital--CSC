import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE } from "../../platform/_store";

// GET /api/planning/comments?id=PLN-001 -> list comments for a plan
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  const plan = PLATFORM_STORE.planning.find((p: any) => p.id === id);
  if (!plan) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, items: Array.isArray(plan.comments) ? plan.comments : [] });
}

// POST /api/planning/comments  { id, by: 'TEAM_LEAD' | 'DEPARTMENT_HEAD', text }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { id, by, text } = body as { id: string; by: string; text: string };
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  if (!text || !String(text).trim()) return NextResponse.json({ ok: false, error: "text required" }, { status: 400 });
  const role = String(by || "").toUpperCase();
  if (!['TEAM_LEAD','DEPARTMENT_HEAD'].includes(role)) {
    return NextResponse.json({ ok: false, error: 'forbidden role' }, { status: 403 });
  }
  const idx = PLATFORM_STORE.planning.findIndex((p: any) => p.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  const plan = PLATFORM_STORE.planning[idx];
  const comments = Array.isArray(plan.comments) ? plan.comments : [];
  const item = {
    id: `${id}-CMT-${comments.length + 1}`,
    by: role,
    text: String(text).trim(),
    at: new Date().toISOString(),
  };
  PLATFORM_STORE.planning[idx] = {
    ...plan,
    comments: [...comments, item],
    history: [
      ...(Array.isArray(plan.history) ? plan.history : []),
      { by: role, action: 'comment', at: item.at, comments: item.text.slice(0, 120) },
    ],
  };
  return NextResponse.json({ ok: true, item: item, plan: PLATFORM_STORE.planning[idx] });
}
