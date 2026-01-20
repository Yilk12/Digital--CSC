"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, Clock, User, ChevronDown, ChevronUp } from "lucide-react";

export type WorkflowReport = {
  id: string;
  planId: string;
  assignmentId: string;
  submittedBy: string;
  submittedTo: string;
  body: string;
  attachments: Array<{ url: string; name: string; type: string; size?: number }>;
  status: "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";
  createdAt: string;
  history: Array<{ by: string; action: string; at: string; comments?: string }>;
  route?: { chain: Array<"EMPLOYEE" | "TEAM" | "DEPARTMENT" | "PLANNING">; current: "EMPLOYEE" | "TEAM" | "DEPARTMENT" | "PLANNING" };
  approvals?: Array<{ stage: "EMPLOYEE" | "TEAM" | "DEPARTMENT" | "PLANNING"; by?: string; at?: string; decision?: "REVIEW" | "APPROVE" | "REJECT"; comments?: string }>; 
  periodStart?: string;
  periodEnd?: string;
  employeeName?: string;
  teamName?: string;
  frequency?: string;
  quarter?: string;
  summary?: {
    keyTasks?: string;
    progressVsGoals?: string;
    ongoing?: string;
    challenges?: string;
    collaboration?: string;
    metrics?: string;
    learnings?: string;
    nextWeek?: string;
    managerComments?: string;
  };
};

export function ReportReviewPanel({
  report,
  currentUserId,
  onActionDone,
}: {
  report: WorkflowReport;
  currentUserId: string;
  onActionDone?: (updated: WorkflowReport) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canAct = useMemo(() => {
    // Only allow the current assignee or chain stage owners to act; for simplicity, allow the submittedTo user
    return currentUserId && report.submittedTo === currentUserId;
  }, [currentUserId, report.submittedTo]);

  async function act(action: "review" | "approve" | "reject") {
    try {
      setBusy(true);
      setError(null);
      const res = await fetch("/api/workflow/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: report.id, action, by: currentUserId, comments }),
      });
      if (!res.ok) throw new Error(`Action failed: ${res.status}`);
      const data = await res.json();
      const updated = data?.item as WorkflowReport;
      onActionDone?.(updated);
      setComments("");
    } catch (e: any) {
      setError(e?.message || "Failed to perform action");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded-xl bg-white shadow-sm">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 rounded-t-xl"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-slate-500" />
          <div>
            <div className="font-semibold text-slate-800">Report {report.id}</div>
            <div className="text-xs text-slate-500">Assignment {report.assignmentId} • Plan {report.planId} • {new Date(report.createdAt).toLocaleString()}</div>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="text-sm text-slate-700 whitespace-pre-wrap border rounded-lg p-3 bg-slate-50">{report.body || "(no body)"}</div>
              {report.summary && (
                <div className="mt-3 text-sm">
                  <div className="font-semibold text-slate-700 mb-1">Summary</div>
                  <ul className="list-disc ml-5 text-slate-600">
                    {report.summary.keyTasks && <li><strong>Key Tasks:</strong> {report.summary.keyTasks}</li>}
                    {report.summary.progressVsGoals && <li><strong>Progress vs Goals:</strong> {report.summary.progressVsGoals}</li>}
                    {report.summary.ongoing && <li><strong>Ongoing:</strong> {report.summary.ongoing}</li>}
                    {report.summary.challenges && <li><strong>Challenges:</strong> {report.summary.challenges}</li>}
                    {report.summary.collaboration && <li><strong>Collaboration:</strong> {report.summary.collaboration}</li>}
                    {report.summary.metrics && <li><strong>Metrics:</strong> {report.summary.metrics}</li>}
                    {report.summary.learnings && <li><strong>Learnings:</strong> {report.summary.learnings}</li>}
                    {report.summary.nextWeek && <li><strong>Next Week:</strong> {report.summary.nextWeek}</li>}
                    {report.summary.managerComments && <li><strong>Manager Comments:</strong> {report.summary.managerComments}</li>}
                  </ul>
                </div>
              )}
              {report.attachments?.length ? (
                <div className="mt-3">
                  <div className="font-semibold text-sm text-slate-700 mb-1">Attachments ({report.attachments.length})</div>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {report.attachments.map((a, i) => (
                      <li key={i}>
                        <a className="text-indigo-600 hover:underline" href={a.url} target="_blank" rel="noreferrer">{a.name}</a>
                        <span className="text-xs text-slate-400 ml-2">{a.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="md:col-span-1">
              <div className="border rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Clock className="w-4 h-4" /> Status: {report.status}
                </div>
                <div className="mt-2 text-xs text-slate-500">Stage: {report.route?.current || "-"}</div>
                <div className="mt-4">
                  <label className="text-sm font-medium mb-1 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-slate-500" /> Comments
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full border rounded-lg p-2 text-sm"
                    rows={3}
                    placeholder="Add review comments"
                  />
                  {error && (
                    <div className="mt-2 text-xs text-red-600">{error}</div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button disabled={!canAct || busy} onClick={() => act("review")} className={`px-2 py-2 rounded-lg text-white text-sm ${!canAct || busy ? "bg-slate-300" : "bg-sky-600 hover:bg-sky-700"}`}>
                      Review
                    </button>
                    <button disabled={!canAct || busy} onClick={() => act("approve")} className={`px-2 py-2 rounded-lg text-white text-sm flex items-center justify-center gap-1 ${!canAct || busy ? "bg-slate-300" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button disabled={!canAct || busy} onClick={() => act("reject")} className={`px-2 py-2 rounded-lg text-white text-sm flex items-center justify-center gap-1 ${!canAct || busy ? "bg-slate-300" : "bg-rose-600 hover:bg-rose-700"}`}>
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="font-semibold text-slate-700 mb-2">History</div>
            <ul className="text-sm text-slate-700 space-y-1">
              {report.history?.map((h, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{new Date(h.at).toLocaleString()}</span>
                  <span className="font-semibold">{h.action}</span>
                  <span className="text-slate-500">by {h.by}</span>
                  {h.comments && <span className="text-slate-500">— {h.comments}</span>}
                </li>
              ))}
            </ul>
          </div>

          {report.approvals?.length ? (
            <div className="mt-4">
              <div className="font-semibold text-slate-700 mb-2">Approvals</div>
              <ul className="text-sm text-slate-700 space-y-1">
                {report.approvals.map((a, i) => (
                  <li key={i}>
                    <span className="text-xs text-slate-500">{a.at ? new Date(a.at).toLocaleString() : ""}</span>
                    <span className="ml-2 font-medium">{a.stage}</span>
                    <span className="ml-2">{a.decision}</span>
                    {a.by && <span className="ml-2 text-slate-500">by {a.by}</span>}
                    {a.comments && <span className="ml-2 text-slate-500">— {a.comments}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
