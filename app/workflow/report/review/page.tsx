"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getCurrentUserId, getCurrentUserRoles } from "@/app/lib/auth";
import dynamic from "next/dynamic";
import type { WorkflowReport } from "@/app/components/workflow/ReportReviewPanel";

const ReportReviewPanel = dynamic(() => import("@/app/components/workflow/ReportReviewPanel").then(m => m.ReportReviewPanel), { ssr: false });

export default function ReviewReportsPage() {
  const [reports, setReports] = useState<WorkflowReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useMemo(() => getCurrentUserId() || "", []);
  const roles = getCurrentUserRoles();
  const isReviewer = roles.includes("department_head") || roles.includes("manager") || roles.includes("admin") || roles.includes("commissioner") || roles.includes("employee") || roles.includes("finance");

  async function load() {
    if (!currentUserId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/workflow/reports?submittedTo=${encodeURIComponent(currentUserId)}&pageSize=50`);
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const data = await res.json();
      setReports(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [currentUserId]);

  if (!currentUserId) {
    return (
      <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Sign in required</h2>
        <p className="text-slate-600 text-sm">You need to be signed in to review reports.</p>
      </div>
    );
  }

  if (!isReviewer) {
    return (
      <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Access restricted</h2>
        <p className="text-slate-600 text-sm">Only designated reviewers can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Incoming Reports for Review</h1>
      {loading ? (
        <div className="text-slate-600">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : reports.length === 0 ? (
        <div className="text-slate-600">No reports awaiting your review.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <ReportReviewPanel
              key={r.id}
              report={r}
              currentUserId={currentUserId}
              onActionDone={() => load()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
