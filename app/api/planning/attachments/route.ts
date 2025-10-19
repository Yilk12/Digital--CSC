import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE } from "../../platform/_store";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// POST: attach a file to a plan
// body: { id: string, name: string, type?: string, dataUrl: string, size?: number, by?: string }
export async function POST(req: NextRequest) {
  // Helper: extract user from Authorization header (best-effort)
  const auth = req.headers.get("authorization") || "";
  const m = auth.match(/bearer\s+([^\s]+)/i);
  let uploader = "unknown";
  let roles: string[] = [];
  if (m) {
    try {
      const token = m[1];
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        const decoded: any = JSON.parse(payload);
        uploader = decoded?.email || decoded?.name || decoded?.preferred_username || decoded?.sub || "unknown";
        // collect roles (lowercased)
        const out: string[] = [];
        if (typeof decoded?.role === 'string') out.push(decoded.role);
        if (Array.isArray(decoded?.role)) out.push(...decoded.role);
        if (Array.isArray(decoded?.roles)) out.push(...decoded.roles.map((r: any) => (typeof r === 'string' ? r : r?.name || '')));
        if (decoded?.realm_access?.roles) out.push(...decoded.realm_access.roles);
        if (decoded?.resource_access) {
          for (const v of Object.values(decoded.resource_access)) {
            const rr = (v as any)?.roles;
            if (Array.isArray(rr)) out.push(...rr);
          }
        }
        roles = out.filter(Boolean).map((s) => String(s).toLowerCase());
      }
    } catch {}
  }

  // Allow only staff/team/department/strategy/admin roles to upload
  const allowed = ["staff", "user", "team", "team_lead", "team-lead", "department_head", "department-head", "strategy", "planning", "admin", "system_admin", "support_agent"];
  const roleOk = roles.some((r) => allowed.some((a) => r.includes(a)));

  // Detect content type
  const contentType = req.headers.get("content-type") || "";

  // Resolve plan id early from either multipart or JSON
  let planId = "";

  if (/multipart\/form-data/i.test(contentType)) {
    const form = await req.formData();
    planId = String(form.get("id") || "");
    if (!planId) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    if (!roleOk) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    const idx = PLATFORM_STORE.planning.findIndex((p: any) => p.id === planId);
    if (idx === -1) return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
    const plan = PLATFORM_STORE.planning[idx];

    const files = form.getAll("files");
    if (!files || files.length === 0) return NextResponse.json({ ok: false, error: "files required" }, { status: 400 });

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true }).catch(() => {});

    const attachments = Array.isArray(plan.attachments) ? plan.attachments : [];
    const saved: any[] = [];
    for (const f of files) {
      if (typeof File !== 'undefined' && f instanceof File) {
        const file = f as unknown as File;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${(file.name || 'file').replace(/[^a-z0-9_.-]/gi, '_')}`;
        const filePath = path.join(uploadDir, safeName);
        await writeFile(filePath, buffer);
        const url = `/uploads/${safeName}`;
        const att = {
          id: `${planId}-ATT-${attachments.length + saved.length + 1}`,
          name: file.name || safeName,
          type: file.type || "application/octet-stream",
          url,
          size: file.size || buffer.length,
          by: uploader,
          uploadedAt: new Date().toISOString(),
        };
        saved.push(att);
      }
    }

    PLATFORM_STORE.planning[idx] = {
      ...plan,
      attachments: [...attachments, ...saved],
      history: [
        ...(Array.isArray(plan.history) ? plan.history : []),
        ...saved.map((att) => ({ by: att.by, action: "attach", at: att.uploadedAt, comments: att.name })),
      ],
    };
    return NextResponse.json({ ok: true, item: PLATFORM_STORE.planning[idx] });
  }

  // Fallback: JSON body with dataUrl (backward compatible)
  const body = await req.json().catch(() => ({} as any));
  const { id, name, type, dataUrl, size } = body as {
    id: string;
    name: string;
    type?: string;
    dataUrl: string;
    size?: number;
  };
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  if (!name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return NextResponse.json({ ok: false, error: "dataUrl (data:URI) required" }, { status: 400 });
  }
  if (!roleOk) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const idx = PLATFORM_STORE.planning.findIndex((p: any) => p.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });
  const plan = PLATFORM_STORE.planning[idx];
  const att = {
    id: `${id}-ATT-${(plan.attachments?.length || 0) + 1}`,
    name: String(name),
    type: String(type || "application/octet-stream"),
    dataUrl: String(dataUrl),
    size: Number(size || 0),
    by: uploader,
    uploadedAt: new Date().toISOString(),
  };
  const attachments = Array.isArray(plan.attachments) ? plan.attachments : [];
  PLATFORM_STORE.planning[idx] = {
    ...plan,
    attachments: [...attachments, att],
    history: [
      ...(Array.isArray(plan.history) ? plan.history : []),
      { by: att.by, action: "attach", at: att.uploadedAt, comments: att.name },
    ],
  };
  return NextResponse.json({ ok: true, item: PLATFORM_STORE.planning[idx] });
}
