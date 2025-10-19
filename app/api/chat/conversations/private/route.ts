import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization');
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/chat/conversations/private`, {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create private conversation' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating private conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
