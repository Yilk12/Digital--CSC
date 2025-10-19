import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { decodeJwt } from "@/app/lib/auth"

const DATA_DIR = path.join(process.cwd(), "data")
const PLAN_FILE = path.join(DATA_DIR, "plan.json")

function getAllowedRoles(): string[] {
  const env = process.env.PLAN_ALLOWED_ROLES || process.env.NEXT_PUBLIC_PLAN_ALLOWED_ROLES
  if (env) return env.split(",").map(s => s.trim().toLowerCase()).filter(Boolean)
  return ["admin", "manager", "staff_manager", "system_admin", "support_agent"]
}

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }) } catch {}
}

function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  if (auth && auth.toLowerCase().startsWith("bearer ")) return auth.slice(7)
  // try cookies used by app
  const cookies = req.cookies
  const cand = cookies.get("accessToken")?.value || cookies.get("jwt")?.value || cookies.get("token")?.value
  return cand || null
}

function hasAccess(token: string | null): boolean {
  try {
    if (!token) return false
    const payload: any = decodeJwt(token)
    const roles: string[] = []
    if (typeof payload?.role === 'string') roles.push(payload.role)
    if (Array.isArray(payload?.role)) roles.push(...payload.role)
    if (Array.isArray(payload?.roles)) roles.push(...payload.roles)
    if (payload?.realm_access?.roles) roles.push(...payload.realm_access.roles)
    if (payload?.resource_access) {
      for (const v of Object.values(payload.resource_access)) {
        const rr = (v as any)?.roles
        if (Array.isArray(rr)) roles.push(...rr)
      }
    }
    const lower = roles.map(String).map(r=>r.toLowerCase())
    const allowed = getAllowedRoles()
    return lower.some(r => allowed.some(a => r.includes(a)))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureDataDir()
    const buf = await fs.readFile(PLAN_FILE, 'utf8')
    const json = JSON.parse(buf)
    return NextResponse.json(json)
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      // Return empty/default if not found
      return NextResponse.json({})
    }
    return NextResponse.json({ error: "Failed to read" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const token = extractToken(req)
  if (!hasAccess(token)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const body = await req.json()
    await ensureDataDir()
    const json = JSON.stringify(body, null, 2)
    await fs.writeFile(PLAN_FILE, json, "utf8")
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}
