import { NextRequest } from "next/server"
import { forwardToBackend } from "@/app/api/_gateway"

export async function POST(req: NextRequest) {
  return forwardToBackend(req, "/auth/login")
}


