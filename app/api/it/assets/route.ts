import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  return new NextResponse(
    JSON.stringify({ error: 'Assets API not implemented. Please use the backend service when available.' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  )
}

export async function POST(req: NextRequest) {
  return new NextResponse(
    JSON.stringify({ error: 'Assets API not implemented. Please use the backend service when available.' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  )
}
