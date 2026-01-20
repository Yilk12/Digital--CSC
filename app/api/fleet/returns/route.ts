import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
import { forwardToBackend } from "@/app/api/_gateway";

// Proxy for vehicle return submissions from the UI to the backend Fleet module
export async function POST(req: NextRequest) {
  return forwardToBackend(req, "/api/fleet/returns");
}

// Proxy for fetching vehicle return history
export async function GET(req: NextRequest) {
  return forwardToBackend(req, "/api/fleet/returns");
}
