import { NextResponse } from "next/server"
import { FINANCE_QUEUE } from "@/app/api/platform/_store"

export async function GET() {
  return NextResponse.json({ ok: true, data: FINANCE_QUEUE })
}
