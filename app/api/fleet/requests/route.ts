import { NextRequest, NextResponse } from 'next/server'
import { STORE, nextRequestId } from '../_store'

export async function GET() {
  return NextResponse.json({ items: STORE.requests })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Validate required fields
    const requiredFields = ['purpose', 'destination', 'date'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const id = nextRequestId();
    const date = body.date || new Date().toISOString().slice(0, 10);
    
    const item = { 
      id, 
      status: 'PENDING', 
      date,
      purpose: body.purpose,
      tripType: body.tripType || 'other',
      destination: body.destination,
      durationType: body.durationType || 'FULL_DAY',
      notes: body.notes || '',
      requestorId: body.requestorId,
      fromDate: body.fromDate || body.date,
      toDate: body.toDate || body.date,
      startTime: body.startTime || '09:00',
      endTime: body.endTime || '17:00'
    };
    
    STORE.requests.unshift(item);
    
    return NextResponse.json({ 
      ok: true, 
      id, 
      item 
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
