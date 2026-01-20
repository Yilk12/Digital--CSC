import { NextRequest, NextResponse } from "next/server";
import { addItem, listItems, saveUpload } from "@/app/lib/plan-report-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const items = await listItems("report");
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = String(form.get("title") || "");
      const periodType = String(form.get("periodType") || "");
      const startDate = String(form.get("startDate") || "");
      const endDate = String(form.get("endDate") || "");
      const objectives = String(form.get("objectives") || "");
      const resources = String(form.get("resources") || "");
      const expectedOutcome = String(form.get("expectedOutcome") || "");
      const recommendations = String(form.get("recommendations") || "");
      const challenges = String(form.get("challenges") || "");
      const receiverId = String(form.get("receiverId") || "");
      const currentRole = String(form.get("currentRole") || "");

      const activities: string[] = [];
      for (const [k, v] of form.entries()) {
        if (k.startsWith("activities[")) activities.push(String(v));
      }

      const uploads: Array<{ filename: string; relPath: string; size: number }> = [];
      const files = form.getAll("attachments");
      for (const f of files) {
        if (f && typeof f !== "string") {
          const file = f as unknown as File;
          const buf = Buffer.from(await file.arrayBuffer());
          const saved = await saveUpload(buf, file.name, "report");
          uploads.push({ filename: saved.filename, relPath: saved.relPath, size: buf.length });
        }
      }

      const item = await addItem({
        kind: "report",
        title,
        periodType,
        startDate,
        endDate,
        objectives,
        activities,
        resources,
        expectedOutcome,
        recommendations,
        challenges,
        receiverId,
        currentRole,
        attachments: uploads,
      });
      return NextResponse.json({ ok: true, item }, { status: 201 });
    } else {
      const body = await req.json();
      const item = await addItem({
        kind: "report",
        title: String(body.title || ""),
        periodType: String(body.periodType || ""),
        startDate: String(body.startDate || ""),
        endDate: String(body.endDate || ""),
        objectives: String(body.objectives || ""),
        activities: Array.isArray(body.activities) ? body.activities.map(String) : [],
        resources: String(body.resources || ""),
        expectedOutcome: String(body.expectedOutcome || ""),
        recommendations: String(body.recommendations || ""),
        challenges: String(body.challenges || ""),
        receiverId: String(body.receiverId || ""),
        currentRole: String(body.currentRole || ""),
        attachments: [],
      });
      return NextResponse.json({ ok: true, item }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 400 });
  }
}
