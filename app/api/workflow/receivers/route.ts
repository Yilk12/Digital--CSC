import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Role = "planning" | "departmentHead" | "teamLeader" | "employee";

type UserOption = { id: string; name: string; role: Role };

const MOCK_USERS: UserOption[] = [
  { id: "u1", name: "Alice - Dept Head A", role: "departmentHead" },
  { id: "u2", name: "Bob - Team Lead A", role: "teamLeader" },
  { id: "u3", name: "Charlie - Employee 1", role: "employee" },
  { id: "u4", name: "Diana - Strategy", role: "planning" },
  { id: "u5", name: "Eve - Employee 2", role: "employee" },
];

function computeReceiverOptions(role: Role, mode: "plan" | "report"): UserOption[] {
  if (mode === "plan") {
    if (role === "employee") return MOCK_USERS.filter((u) => u.role === "teamLeader");
    if (role === "teamLeader") return MOCK_USERS.filter((u) => u.role === "departmentHead");
    if (role === "departmentHead") return MOCK_USERS.filter((u) => u.role === "planning");
    return [];
  }
  if (mode === "report") {
    if (role === "employee") return MOCK_USERS.filter((u) => u.role === "teamLeader");
    if (role === "teamLeader") return MOCK_USERS.filter((u) => u.role === "departmentHead");
    if (role === "departmentHead") return MOCK_USERS.filter((u) => u.role === "planning");
    return [];
  }
  return [];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "employee") as Role;
  const mode = (searchParams.get("mode") || "plan") as "plan" | "report";
  const items = computeReceiverOptions(role, mode);
  return NextResponse.json({ items });
}
