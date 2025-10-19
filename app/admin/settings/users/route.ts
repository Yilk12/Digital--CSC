import { NextRequest, NextResponse } from "next/server"

// Simple in-memory mock store (resets on server restart)
let mockUsers = [
  { id: "u1", name: "Admin User", email: "admin@csc.gov.et", roles: ["Admin"], status: "Active" },
  { id: "u2", name: "Fleet Manager", email: "fleet.manager@csc.gov.et", roles: ["Fleet Manager"], status: "Active" },
  { id: "u3", name: "BSC Analyst", email: "bsc.analyst@csc.gov.et", roles: ["BSC Analyst"], status: "Active" },
  { id: "u4", name: "Helpdesk Lead", email: "helpdesk.lead@csc.gov.et", roles: ["Admin"], status: "Active" },
]

export async function GET(_: NextRequest) {
  return NextResponse.json({ ok: true, users: mockUsers })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const id = `u_${Math.random().toString(36).slice(2, 8)}`
    const item = {
      id,
      name: String(body?.name || "New User"),
      email: String(body?.email || "user@example.com"),
      roles: Array.isArray(body?.roles) ? body.roles : [],
      status: body?.status || "Active",
    }
    mockUsers.unshift(item)
    return NextResponse.json({ ok: true, user: item }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const id = String(body?.id || "")
    const idx = mockUsers.findIndex(u => u.id === id)
    if (idx === -1) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 })
    mockUsers[idx] = { ...mockUsers[idx], ...body }
    return NextResponse.json({ ok: true, user: mockUsers[idx] })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 })
    const before = mockUsers.length
    mockUsers = mockUsers.filter(u => u.id !== id)
    const removed = mockUsers.length < before
    return NextResponse.json({ ok: removed })
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 })
  }
}
