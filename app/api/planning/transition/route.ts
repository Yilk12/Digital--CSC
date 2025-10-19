import { NextRequest, NextResponse } from "next/server";
import { PLATFORM_STORE } from "../../platform/_store";

type Role = "STAFF" | "TEAM_LEAD" | "DEPARTMENT_HEAD" | "STRATEGY";

type Action =
  | "staff_submit"
  | "team_submit_up"
  | "team_request_changes"
  | "dh_approve"
  | "dh_reject"
  | "dh_request_changes"
  | "strategy_align_approve"
  | "strategy_reject"
  | "strategy_request_changes";

const allowed: Record<string, { by: Role; nextStatus: string; nextAssignee?: Role } | null> = {
  // From DRAFT -> UNDER_TEAM_REVIEW
  staff_submit: { by: "STAFF", nextStatus: "UNDER_TEAM_REVIEW", nextAssignee: "TEAM_LEAD" },
  // Team lead can escalate or request changes back to DRAFT
  team_submit_up: { by: "TEAM_LEAD", nextStatus: "UNDER_DH_REVIEW", nextAssignee: "DEPARTMENT_HEAD" },
  team_request_changes: { by: "TEAM_LEAD", nextStatus: "DRAFT", nextAssignee: "STAFF" },
  // Department head approvals
  dh_approve: { by: "DEPARTMENT_HEAD", nextStatus: "UNDER_STRATEGY_REVIEW", nextAssignee: "STRATEGY" },
  dh_reject: { by: "DEPARTMENT_HEAD", nextStatus: "REJECTED" },
  dh_request_changes: { by: "DEPARTMENT_HEAD", nextStatus: "DRAFT", nextAssignee: "STAFF" },
  // Strategy reviews
  strategy_align_approve: { by: "STRATEGY", nextStatus: "APPROVED" },
  strategy_reject: { by: "STRATEGY", nextStatus: "REJECTED" },
  strategy_request_changes: { by: "STRATEGY", nextStatus: "DRAFT", nextAssignee: "STAFF" },
};

function isTransitionValid(currentStatus: string, action: Action): boolean {
  const s = String(currentStatus).toUpperCase();
  switch (action) {
    case "staff_submit":
      return s === "DRAFT";
    case "team_submit_up":
    case "team_request_changes":
      return s === "UNDER_TEAM_REVIEW";
    case "dh_approve":
    case "dh_reject":
    case "dh_request_changes":
      return s === "UNDER_DH_REVIEW";
    case "strategy_align_approve":
    case "strategy_reject":
    case "strategy_request_changes":
      return s === "UNDER_STRATEGY_REVIEW";
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { id, action, by, comments } = body as { id: string; action: Action; by: Role; comments?: string };
  if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
  if (!action) return NextResponse.json({ ok: false, error: "action required" }, { status: 400 });
  if (!by) return NextResponse.json({ ok: false, error: "by (role) required" }, { status: 400 });

  const planIdx = PLATFORM_STORE.planning.findIndex((p) => p.id === id);
  if (planIdx === -1) return NextResponse.json({ ok: false, error: "Plan not found" }, { status: 404 });

  const plan = PLATFORM_STORE.planning[planIdx];
  const rule = allowed[action];
  if (!rule) return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
  if (rule.by !== by) return NextResponse.json({ ok: false, error: `Action not allowed for role ${by}` }, { status: 403 });

  if (!isTransitionValid(plan.status, action)) {
    return NextResponse.json({ ok: false, error: `Invalid state transition from ${plan.status} with ${action}` }, { status: 409 });
  }

  const nextStatus = rule.nextStatus;
  const nextAssignee = rule.nextAssignee;

  const historyItem = {
    by,
    action,
    at: new Date().toISOString(),
    comments: String(comments || ""),
  };

  PLATFORM_STORE.planning[planIdx] = {
    ...plan,
    status: nextStatus,
    assignee: nextAssignee || plan.assignee,
    history: [...(Array.isArray(plan.history) ? plan.history : []), historyItem],
  };

  return NextResponse.json({ ok: true, item: PLATFORM_STORE.planning[planIdx] });
}
