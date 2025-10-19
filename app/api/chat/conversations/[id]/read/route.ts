import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/app/lib/api';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get('authorization');
    const { id } = params;

    const response = await fetch(`${API_BASE_URL}/chat/conversations/${id}/read`, {
      method: 'POST',
      headers: {
        Authorization: token || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
