import { NextRequest, NextResponse } from "next/server";

// All workflow reporting APIs are disabled in this deployment.

export async function GET(_req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Planning and reporting workflow is disabled" },
    { status: 410 },
  );
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Planning and reporting workflow is disabled" },
    { status: 410 },
  );
}

export async function PATCH(_req: NextRequest) {
  return NextResponse.json(
    { ok: false, error: "Planning and reporting workflow is disabled" },
    { status: 410 },
  );
}
