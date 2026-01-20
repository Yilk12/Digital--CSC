"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalization } from "@/app/hooks/use-localization";
import { getDepartmentInfo } from "@/app/lib/session";

type Receiver = "DEPARTMENT" | "COMMISSIONER" | "DEPARTMENT_HEAD";

type Dept = { id: string; name: string; nameAm?: string | null };
type Head = { id: string; firstName: string; lastName: string; email: string; departmentId: string | null; department?: { id: string; name: string } | null };
type DeptUser = { id: string; firstName: string; lastName: string; email: string; role: string };

type LocalSubmission = {
  id: string;
  category: string;
  department: string;
  message: string;
  createdAt: string;
};

export default function NewFeedbackPage() {
  const router = useRouter();
  const { t } = useLocalization();
  // --- State ---
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [heads, setHeads] = useState<Head[]>([]);
  const [deptUsers, setDeptUsers] = useState<DeptUser[]>([]);

  const [receiver, setReceiver] = useState<Receiver>("DEPARTMENT");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [selectedHeadId, setSelectedHeadId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Feedback-specific fields (FeedbackController)
  // feedback type simplified: always GENERAL; use category for user-facing selection
  const [feedbackType, setFeedbackType] = useState<"GENERAL" | "ARTICLE" | "TICKET">("GENERAL");
  
  const [category, setCategory] = useState<string>("Complaint");
  const [reportType, setReportType] = useState<"ANONYMOUS" | "IDENTIFIED" | "THIRD_PARTY" | "">("");
  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string>("");
  const [submitOk, setSubmitOk] = useState<boolean | null>(null);
  const [history, setHistory] = useState<LocalSubmission[]>([]);

  const departmentInfo = useMemo(() => {
    if (typeof window === "undefined") return { id: null as string | null, name: null as string | null };
    return getDepartmentInfo();
  }, []);

  const canSeeNonAnonymousReports = useMemo(() => {
    const name = departmentInfo.name || "";
    return name === "Executive Director, Women and Social Inclusion Program";
  }, [departmentInfo.name]);

  // --- Auth & API ---
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token") || "";
  }, []);

  const apiBase = useMemo(() => {
    const env = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
    return env;
  }, []);

  async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }

  const loadHistory = useCallback(async () => {
    try {
      const url = `${apiBase}/api/submissions?scope=mine`;
      const res = await fetchWithAuth(url, { method: "GET" });
      const j = await res.json().catch(() => ([]));
      const items = Array.isArray(j) ? j : Array.isArray(j?.items) ? j.items : [];

      const mapped: LocalSubmission[] = items.map((s: any) => ({
        id: String(s.id),
        category: String(s.type || ""),
        department:
          (s.department && (s.department.nameAm || s.department.name)) ||
          departments.find(d => d.id === s.departmentId)?.nameAm ||
          departments.find(d => d.id === s.departmentId)?.name ||
          "-",
        message: String(s.message || ""),
        createdAt: s.createdAt ? new Date(s.createdAt).toLocaleString() : "",
      }));

      setHistory(mapped);
    } catch {
      setHistory([]);
    }
  }, [apiBase, departments]);

  // --- Load Departments ---
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const url = `${apiBase}/api/feedback/departments`;
        const r = await fetchWithAuth(url);
        const j = await r.json();
        if (!r.ok) throw new Error(j?.message || "Failed to load departments");
        const items: Dept[] = Array.isArray(j) ? j : Array.isArray(j?.departments) ? j.departments : [];
        setDepartments(items);
        if (!departmentId && items.length > 0) setDepartmentId(items[0].id);
      } catch {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, [apiBase]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // --- Load Heads if receiver is DEPARTMENT_HEAD ---
  useEffect(() => {
    if (receiver !== "DEPARTMENT_HEAD") return;
    const loadHeads = async () => {
      try {
        const url = `${apiBase}/api/users/department-heads`;
        const r = await fetchWithAuth(url);
        const j = await r.json();
        const list: Head[] = Array.isArray(j?.users) ? j.users : Array.isArray(j) ? j : [];
        setHeads(list);
        if (!selectedHeadId && list.length > 0) setSelectedHeadId(list[0].id);
      } catch {
        setHeads([]);
      }
    };
    loadHeads();
  }, [receiver, apiBase]);

  // --- Load Users (for department or selected head) ---
  useEffect(() => {
    const deptId =
      receiver === "DEPARTMENT_HEAD"
        ? heads.find(h => h.id === selectedHeadId)?.department?.id || heads.find(h => h.id === selectedHeadId)?.departmentId
        : departmentId;

    if (!deptId) {
      setDeptUsers([]);
      return;
    }

    setDepartmentId(deptId);

    const loadUsers = async () => {
      try {
        const url = `${apiBase}/api/users/by-department?departmentId=${encodeURIComponent(deptId)}`;
        const r = await fetchWithAuth(url);
        const j = await r.json();
        const list: DeptUser[] = Array.isArray(j?.users) ? j.users : Array.isArray(j) ? j : [];
        setDeptUsers(list);
        if (selectedUserId && !list.some(u => u.id === selectedUserId)) setSelectedUserId("");
      } catch {
        setDeptUsers([]);
      }
    };
    loadUsers();
  }, [departmentId, selectedHeadId, receiver, heads]);

  const canSubmit = comments.trim().length > 0 && !submitting;

  // --- Submit ---
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitMsg("");
    setSubmitOk(null);

    try {
      if (category === "Sexual Assault" && !reportType) {
        throw new Error("Please select a report type");
      }

    // Correct endpoint
    const url = `${apiBase}/api/submissions`;

    // Resolve forced routing: always send to Ethics and Anti-Corruption Department
    // and, if available, the user with email 'dwk@gmail.com'.
    const ethicsDept = departments.find(d => {
      const name = (d.name || "").toLowerCase();
      const nameAmRaw = d.nameAm || "";
      const nameAmLower = nameAmRaw.toLowerCase();
      return (
        // English name
        name === "ethics and anti-corruption department" ||
        name.includes("ethics") ||
        // Exact Amharic name provided by user
        nameAmRaw === "የስነምግባርና ፀረሙስና ክፍል" ||
        // Fallback: contains keyword in Amharic
        nameAmLower.includes("የሥነ ምግባር")
      );
    });

    const forcedDepartmentId = ethicsDept?.id || departmentId || "";

    // Try to locate the special recipient user by email from loaded users and heads
    const ethicsUser = [...deptUsers, ...heads].find((u: any) =>
      String(u?.email || "").toLowerCase() === "dwk@gmail.com"
    );

    const forcedRecipientUserId = ethicsUser?.id as string | undefined;

    // Map UI fields to backend expectations (CreateSubmissionInput)
    const payload: Record<string, any> = {
      type: category?.toUpperCase() || "COMPLAINT", // COMPLAINT | SUGGESTION | COMPLIMENT
      message: comments,
      anonymous: false, // or true if you have an "anonymous" checkbox later
    };

    if (category === "Sexual Assault" && reportType) {
      payload.reportType = reportType;
    }

    // Include forced routing
    if (forcedDepartmentId) payload.departmentId = forcedDepartmentId;
    if (forcedRecipientUserId) {
      payload.recipientUserId = forcedRecipientUserId;
    }

    console.log(" Submitting payload:", payload);

    const res = await fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || "Failed to create submission");

    setSubmitMsg(" " + t("feedback.success"));
    setSubmitOk(true);
    await loadHistory();

    setComments("");
    setReportType("");
  } catch (e: any) {
    console.error(" Submission error:", e);
    setSubmitMsg(e?.message || "Failed to submit feedback");
    setSubmitOk(false);
  } finally {
    setSubmitting(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <p className="text-gray-600">{t("feedback.new.subtitle")}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Routing (receiver select removed) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Department */}
              <div>
                <label className="block text-sm font-medium mb-2">{t("feedback.labels.department")}</label>
                <select
                  value={departmentId}
                  onChange={e => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nameAm || d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Head */}
              {receiver === "DEPARTMENT_HEAD" && (
                <div>
                  <label className="block text-sm font-medium mb-2">{t("feedback.labels.department_head")}</label>
                  <select
                    value={selectedHeadId}
                    onChange={e => setSelectedHeadId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {heads.map(h => (
                      <option key={h.id} value={h.id}>
                        {`${h.firstName} ${h.lastName}` || h.email} {h.department?.name ? `- ${h.department.name}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department Users */}
              {(receiver === "DEPARTMENT" || receiver === "DEPARTMENT_HEAD") && (
                <div>
                  <label className="block text-sm font-medium mb-2">{t("feedback.labels.user_optional")}</label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t("feedback.none")}</option>
                    {deptUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {`${u.firstName} ${u.lastName}` || u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t("feedback.labels.category")}</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Complaint">{t("submissions.type.complaint")}</option>
                  <option value="Suggestion">{t("submissions.type.suggestion")}</option>
                  <option value="Sexual Assault">የፆታዊ ጥቃት ጥቆማ መስጫ</option>
                </select>
                {category === "Sexual Assault" && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-teal-400 text-white">
                    <h3 className="text-lg font-semibold mb-3">የፆታዊ ጥቃት ጥቆማዎን ይፃፉ</h3>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => router.push("/feedback/sexual-assault/anonymous")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                          reportType === "ANONYMOUS"
                            ? "bg-white text-blue-600 border-white"
                            : "bg-blue-600/70 hover:bg-blue-600 border-blue-100/60"
                        }`}
                      >
                        አመልካች
                      </button>
                      {canSeeNonAnonymousReports && (
                        <>
                          <button
                            type="button"
                            onClick={() => router.push("/feedback/sexual-assault/identified")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                              reportType === "IDENTIFIED"
                                ? "bg-white text-blue-600 border-white"
                                : "bg-white/10 hover:bg-white/20 border-white/40"
                            }`}
                          >
                            ጠቅላላ የተላከ የጥቆማ ሪፖርት
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="block text-sm font-medium mb-2">{t("feedback.labels.message")}</label>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                rows={6}
                placeholder={t("feedback.placeholders.message")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit message */}
            {submitMsg && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  submitOk ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {submitMsg}
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg"
              >
                {submitting ? t("feedback.actions.submitting") : t("feedback.actions.submit")}
              </button>
            </div>P

            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-3">Feedback History</h2>
              <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Department</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                          No feedback submitted yet.
                        </td>
                      </tr>
                    ) : (
                      history.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 align-top text-gray-700 whitespace-nowrap">{item.createdAt}</td>
                          <td className="px-3 py-2 align-top text-gray-700">{item.department}</td>
                          <td className="px-3 py-2 align-top text-gray-700">{item.category}</td>
                          <td className="px-3 py-2 align-top text-gray-700 max-w-xs break-words">{item.message}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
