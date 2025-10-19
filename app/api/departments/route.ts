import { NextRequest, NextResponse } from "next/server"

type Dept = {
  id: string
  name: string
  nameAm?: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function getStore(): Dept[] {
  const g = globalThis as any
  if (!g.__departments) {
    g.__departments = [
      {
        id: "dept-001",
        name: "Commissioner Office",
        description: "Office of the Commissioner",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ] as Dept[]
  }
  return g.__departments as Dept[]
}

function paginate<T>(arr: T[], page = 1, limit = 20) {
  const start = (page - 1) * limit
  const items = arr.slice(start, start + limit)
  const total = arr.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return { items, total, page, limit, totalPages }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") || 1)
  const limit = Number(searchParams.get("limit") || 50)
  const search = (searchParams.get("search") || "").toLowerCase()

  let filtered = getStore()
  if (search) {
    filtered = filtered.filter((d) =>
      [d.name, d.nameAm, d.description].some((v) => (v || "").toLowerCase().includes(search)),
    )
  }
  const { items, total, totalPages } = paginate(filtered, page, limit)
  return NextResponse.json({
    departments: items,
    pagination: { total, page, limit, totalPages },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 })
    }
    const now = new Date().toISOString()
    const item: Dept = {
      id: `dept_${Math.random().toString(36).slice(2, 10)}`,
      name: String(body.name).trim(),
      nameAm: body?.nameAm ? String(body.nameAm) : undefined,
      description: body?.description ? String(body.description) : undefined,
      isActive: body?.isActive !== false,
      createdAt: now,
      updatedAt: now,
    }
    getStore().unshift(item)
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
}
