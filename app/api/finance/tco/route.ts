import { NextRequest, NextResponse } from 'next/server'
import { FIN_STORE, nextTcoId, TCORecord } from '../_store'

export async function GET() {
  // Return all TCO records (latest first)
  const items = [...FIN_STORE.tcos].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = nextTcoId()
    const createdAt = new Date().toISOString()

    const purchase = Number(body?.purchase || 0)
    const fuel = Number(body?.fuel || 0)
    const maintenance = Number(body?.maintenance || 0)
    const insurance = Number(body?.insurance || 0)
    const depreciation = Number(body?.depreciation || 0)
    const taxes = Number(body?.taxes || 0)
    const financing = Number(body?.financing || 0)
    const resale = Number(body?.resale || 0)

    const totalCosts = purchase + fuel + maintenance + insurance + depreciation + taxes + financing
    const netTCO = totalCosts - resale

    const item: TCORecord = {
      id,
      createdAt,
      requestId: body?.requestId || undefined,
      purchase,
      fuel,
      maintenance,
      insurance,
      depreciation,
      taxes,
      financing,
      resale,
      totalCosts,
      netTCO,
    }

    FIN_STORE.tcos.unshift(item)
    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Failed to save TCO' }, { status: 400 })
  }
}
