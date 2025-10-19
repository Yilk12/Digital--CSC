import { NextRequest, NextResponse } from 'next/server'
import { HANDOVER_RECORDS, nextHandoverId, type HandoverRecord } from '../../../_handover_store'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const items = HANDOVER_RECORDS.filter(h => h.vehicleId === params.id)
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(()=>({}))
  const formTypeRaw = String(body.formType || body.form || '').toUpperCase()
  const assignmentRaw = String(body.assignmentType || body.assignment || '').toUpperCase()
  const formType = formTypeRaw === 'RETURN' ? 'RETURN' : 'HANDOVER'
  const assignmentType = assignmentRaw === 'WITH_DRIVER' ? 'WITH_DRIVER' : 'FREE_VEHICLE'

  const record: HandoverRecord = {
    id: nextHandoverId(),
    formType,
    assignmentType,
    vehicleId: params.id,
    vehicleMakeModel: body.vehicleMakeModel,
    vehicleReg: body.vehicleReg,
    odometer: typeof body.odometer === 'number' ? body.odometer : (body.odometer ? Number(body.odometer) : undefined),
    fuelLevelPct: typeof body.fuelLevelPct === 'number' ? body.fuelLevelPct : (body.fuelLevelPct ? Number(body.fuelLevelPct) : undefined),
    vehicleCondition: (String(body.vehicleCondition || '').toUpperCase() as any) || undefined,
    accessories: body.accessories || {},
    driverInfo: body.driverInfo || {},
    recipient: {
      name: String(body.recipient?.name || ''),
      department: body.recipient?.department,
      contact: body.recipient?.contact,
      signature: body.recipient?.signature,
      dateTime: String(body.recipient?.dateTime || new Date().toISOString()),
    },
    supervisor: body.supervisor || {},
    checklist: Array.isArray(body.checklist) ? body.checklist : [],
    remarks: body.remarks || '',
    photos: body.photos || {},
    officialStamp: !!body.officialStamp,
    createdAt: new Date().toISOString(),
  }
  if (!record.recipient.name) return NextResponse.json({ ok: false, error: 'Recipient name required' }, { status: 400 })
  HANDOVER_RECORDS.unshift(record)
  return NextResponse.json({ ok: true, item: record })
}
