import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization') || '';
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/abuse-reports/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
  } catch (e) {
    console.error('PATCH /api/abuse-reports/:id proxy failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
