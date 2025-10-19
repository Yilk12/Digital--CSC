import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE } from "../../platform/_store";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params?.id;
  if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
  const plan = PLATFORM_STORE.planning.find((p: any) => p.id === id);
  if (!plan) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, item: plan });
}
