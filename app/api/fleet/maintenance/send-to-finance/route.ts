import { NextRequest, NextResponse } from "next/server"
import { FINANCE_QUEUE, MAINTENANCE_REQUESTS, MaintenanceRequest, ReceiptPeriod, nextMaintenanceId } from "@/app/api/platform/_store"
import { getUserContext } from "@/app/api/_auth"
import { sendEmail } from "@/app/api/_notify"

export async function POST(req: NextRequest) {
  try {
    const ctx = getUserContext(req)
    if (!ctx.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    // Access control: only admin/manager/department_head/finance can queue
    const roles = (ctx.roles||[]).map(String)
    const allowed = roles.some(r => ["admin","manager","department_head","finance"].includes(r))
    if (!allowed) return NextResponse.json({ ok:false, error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { requestIds, period } = body || {}
    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ ok: false, error: "requestIds is required" }, { status: 400 })
    }
    if (!period || !["Daily","Weekly","Monthly","Yearly"].includes(String(period))) {
      return NextResponse.json({ ok: false, error: "period must be Daily|Weekly|Monthly|Yearly" }, { status: 400 })
    }

    const picks: MaintenanceRequest[] = MAINTENANCE_REQUESTS.filter(r => requestIds.includes(r.id))
    const total = picks.reduce((sum, r) => sum + r.receipts.reduce((s, x) => s + (Number(x.amount)||0), 0), 0)
    const receiptIds = picks.flatMap(r => r.receipts.map(x => x.id))

    // Mark requests as queued for finance
    for (const r of picks) {
      r.status = 'SENT_TO_FINANCE'
    }

    const batch = {
      id: nextMaintenanceId('FB'),
      createdAt: new Date().toISOString(),
      createdBy: String(ctx.id),
      period: period as ReceiptPeriod,
      totalAmount: total,
      requestIds: picks.map(p => p.id),
      receiptIds,
      status: 'QUEUED' as const,
    }
    FINANCE_QUEUE.push(batch)

    // Notify Finance via email if configured
    const financeEmail = process.env.FINANCE_EMAIL || process.env.SMTP_TO_FINANCE
    if (financeEmail) {
      const html = `<div>
        <div><b>Maintenance batch queued</b></div>
        <div>ID: ${batch.id}</div>
        <div>Period: ${batch.period}</div>
        <div>Total: ${batch.totalAmount}</div>
        <div>Requests: ${batch.requestIds.join(', ')}</div>
      </div>`
      try { await sendEmail(financeEmail, `[Finance] Maintenance batch queued: ${batch.id}`, html) } catch {}
    }

    return NextResponse.json({ ok: true, data: batch })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Error' }, { status: 500 })
  }
}
