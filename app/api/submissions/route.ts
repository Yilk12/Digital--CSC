import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization') || '';
    const url = new URL(request.url);
    const params = new URLSearchParams();
    if (url.searchParams.get('type')) params.set('type', url.searchParams.get('type')!);
    if (url.searchParams.get('status')) params.set('status', url.searchParams.get('status')!);

    const res = await fetch(`${API_BASE_URL}/submissions${params.toString() ? `?${params}` : ''}`, {
      headers: { Authorization: token },
      cache: 'no-store',
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
  } catch (e) {
    console.error('GET /api/submissions proxy failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization') || '';
    const body = await request.json();
    const res = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') || 'application/json' } });
  } catch (e) {
    console.error('POST /api/submissions proxy failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
