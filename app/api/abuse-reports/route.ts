import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization') || '';
    const url = new URL(request.url);
    const params = new URLSearchParams();
    // Map query params to backend expected names
    if (url.searchParams.get('status')) params.set('status', url.searchParams.get('status')!);
    if (url.searchParams.get('target_type')) params.set('targetType', url.searchParams.get('target_type')!);
    if (url.searchParams.get('reporter_id')) params.set('reporterId', url.searchParams.get('reporter_id')!);

    const res = await fetch(`${API_BASE_URL}/abuse-reports${params.toString() ? `?${params}` : ''}`, {
      headers: { Authorization: token },
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
  } catch (e) {
    console.error('GET /api/abuse-reports proxy failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization') || '';
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/abuse-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
  } catch (e) {
    console.error('POST /api/abuse-reports proxy failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
