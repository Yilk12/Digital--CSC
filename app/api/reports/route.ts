import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const url = new URL(request.url);
    const params = url.searchParams.toString();

    const response = await fetch(`${API_BASE_URL}/reports${params ? `?${params}` : ''}`, {
      headers: {
        Authorization: token || '',
      },
    });

    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' } });
  } catch (error) {
    console.error('GET /api/reports failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        Authorization: token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    return new NextResponse(text, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' } });
  } catch (error) {
    console.error('POST /api/reports failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
