"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalization } from "@/app/hooks/use-localization";
import { getDepartmentInfo } from "@/app/lib/session";

interface HistoryReport {
  id: string;
  typeOfMisconduct: string;
  dateTime: string;
  location: string;
  detailDescriptionOfIncident: string;
  reportedBefore: boolean;
  medicalHelpNeeded: boolean;
  createdAt: string;
}

// Anonymous Sexual Assault Report page
export default function AnonymousSexualAssaultReportPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [typeOfMisconduct, setTypeOfMisconduct] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [comments, setComments] = useState("");
  const [wasReportedBefore, setWasReportedBefore] = useState(false);
  const [needsMedicalHelp, setNeedsMedicalHelp] = useState(false);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string>("");
  const [submitOk, setSubmitOk] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string; nameAm?: string | null }[]>([]);
  const [departmentId, setDepartmentId] = useState<string>(""); // Department of perpetrator
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string; email: string; phone?: string | null }[]>([]); // Perpetrator candidates for selected department
  const [victimUsers, setVictimUsers] = useState<{ id: string; firstName: string; lastName: string; email: string; phone?: string | null }[]>([]); // Employees from logged-in user's department
  const [offenderUserId, setOffenderUserId] = useState<string>("");
  const [isAnonymousVictim, setIsAnonymousVictim] = useState<boolean>(true);
  const [victimUserId, setVictimUserId] = useState<string>("");
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string>("");

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return (
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token") ||
      ""
    );
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

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");
      const res = await fetchWithAuth(
        `${apiBase}/api/submissions/women-social-inclusion/anonymous-history`
      );
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error((data as any)?.message || "Failed to load history");
      }
      if (Array.isArray(data)) {
        const sorted = [...data].sort((a: any, b: any) => {
          const aDate = new Date(a.createdAt || a.dateTime || 0).getTime();
          const bDate = new Date(b.createdAt || b.dateTime || 0).getTime();
          return bDate - aDate;
        });
        setHistoryReports(sorted.slice(0, 10));
      }
    } catch (err) {
      console.error("Failed to load anonymous history", err);
      setHistoryError("Failed to load recent reports");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [apiBase, token]);

  // Load departments for perpetrator selection
  useEffect(() => {
    let cancelled = false;
    const loadDepartments = async () => {
      try {
        const res = await fetchWithAuth(`${apiBase}/api/submissions/departments`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load departments");
        if (!cancelled && Array.isArray(data)) {
          setDepartments(data);
        }
      } catch (err) {
        console.error("Failed to load departments for anonymous report", err);
      }
    };
    loadDepartments();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  // Load users for selected department (perpetrator candidates)
  useEffect(() => {
    let cancelled = false;
    async function loadUsers() {
      if (!departmentId) {
        setUsers([]);
        setOffenderUserId("");
        return;
      }
      try {
        const res = await fetchWithAuth(
          `${apiBase}/api/users/by-department?departmentId=${encodeURIComponent(departmentId)}`,
        );
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
        if (!cancelled) {
          setUsers(list);
          if (!list.some((u: any) => u.id === offenderUserId)) {
            setOffenderUserId("");
          }
          if (!list.some((u: any) => u.id === victimUserId)) {
            setVictimUserId("");
          }
        }
      } catch (err) {
        console.error("Failed to load users for department", err);
        if (!cancelled) {
          setUsers([]);
          setOffenderUserId("");
        }
      }
    }
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [apiBase, departmentId, offenderUserId, victimUserId]);

  // Load victim candidates from the logged-in user's own department (independent of perpetrator dept)
  useEffect(() => {
    let cancelled = false;

    const info = getDepartmentInfo();
    const victimDeptId = info?.id || "";
    if (!victimDeptId) {
      setVictimUsers([]);
      setVictimUserId("");
      return;
    }

    async function loadVictimUsers() {
      try {
        const res = await fetchWithAuth(
          `${apiBase}/api/users/by-department?departmentId=${encodeURIComponent(victimDeptId)}`,
        );
        const data = await res.json().catch(() => ({}));
        const list = Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
        if (!cancelled) {
          setVictimUsers(list);
          if (victimUserId && !list.some((u: any) => u.id === victimUserId)) {
            setVictimUserId("");
          }
        }
      } catch (err) {
        console.error("Failed to load victim users for reporter's department", err);
        if (!cancelled) {
          setVictimUsers([]);
          setVictimUserId("");
        }
      }
    }

    loadVictimUsers();
    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  // Ensure victim and perpetrator cannot be the same user
  useEffect(() => {
    if (offenderUserId && victimUserId && offenderUserId === victimUserId) {
      setVictimUserId("");
    }
  }, [offenderUserId, victimUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comments.trim()) {
      setSubmitMsg("Please provide a detailed description of the incident.");
      setSubmitOk(false);
      return;
    }

    if (!consent) {
      setSubmitMsg("Please confirm that you consent to use of the information for investigation.");
      setSubmitOk(false);
      return;
    }

    setSubmitting(true);
    setSubmitMsg("");
    setSubmitOk(null);

    try {
      let uploadedImageUrl: string | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(uploadJson?.message || "Failed to upload image");
        }

        uploadedImageUrl = uploadJson.url || uploadJson.secure_url || undefined;
      }

      const url = `${apiBase}/api/submissions/women-social-inclusion`;

      const payload: Record<string, any> = {
        typeOfMisconduct: typeOfMisconduct || "",
        dateTime: dateTime || new Date().toISOString(),
        location: location || undefined,
        detailDescriptionOfIncident: comments,
        reportedBefore: wasReportedBefore,
        medicalHelpNeeded: needsMedicalHelp,
        fileUrl: uploadedImageUrl,
        // When victim is not anonymous and a user is selected, send victimId
        victimId: !isAnonymousVictim && victimUserId ? victimUserId : undefined,
        // Department and offender (perpetrator)
        departmentId: departmentId || undefined,
        userId: offenderUserId || undefined,
      };

      const res = await fetchWithAuth(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Failed to create submission");

      setSubmitMsg(" " + t("feedback.success"));
      setSubmitOk(true);
      setTypeOfMisconduct("");
      setDateTime("");
      setLocation("");
      setComments("");
      setWasReportedBefore(false);
      setNeedsMedicalHelp(false);
      setConsent(false);
      setFile(null);
      setDepartmentId("");
      setUsers([]);
      setOffenderUserId("");
      setVictimUserId("");
      setIsAnonymousVictim(true);

      // refresh history so the new request appears in the list
      loadHistory();
    } catch (e: any) {
      console.error(" Anonymous Sexual Assault submission error:", e);
      setSubmitMsg(e?.message || "Failed to submit report");
      setSubmitOk(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-teal-400 text-white">
            <h1 className="text-2xl font-bold">{t("feedback.anonymous_sa.title")}</h1>
            <p className="mt-1 text-sm opacity-90">
              {t("feedback.anonymous_sa.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-gray-800">{t("feedback.anonymous_sa.incident_section")}</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">{t("feedback.anonymous_sa.type_of_misconduct")}</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={t("feedback.anonymous_sa.type_of_misconduct_ph")}
                    value={typeOfMisconduct}
                    onChange={(e) => setTypeOfMisconduct(e.target.value)}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">{t("feedback.anonymous_sa.datetime")}</label>
                  <input
                    type="datetime-local"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1">{t("feedback.anonymous_sa.location")}</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={t("feedback.anonymous_sa.location_ph")}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("feedback.anonymous_sa.description_label")}</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 min-h-[140px] text-sm"
                  placeholder={t("feedback.anonymous_sa.description_ph")}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-800">{t("feedback.anonymous_sa.perp_section")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("feedback.anonymous_sa.perp_dept")}</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">{t("feedback.anonymous_sa.perp_dept_ph")}</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nameAm || d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("feedback.anonymous_sa.perp_user")}</label>
                  <select
                    value={offenderUserId}
                    onChange={(e) => setOffenderUserId(e.target.value)}
                    disabled={!departmentId}
                    className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    <option value="">{departmentId ? t("feedback.anonymous_sa.perp_user_ph") : t("feedback.anonymous_sa.perp_user_ph_no_dept")}</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isAnonymousVictim}
                  onChange={(e) => setIsAnonymousVictim(e.target.checked)}
                />
                <span>{t("feedback.anonymous_sa.anonymous_victim")}</span>
              </label>

              {!isAnonymousVictim && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">የአመልካች ስም</label>
                    <select
                      value={victimUserId}
                      onChange={(e) => setVictimUserId(e.target.value)}
                      disabled={victimUsers.length === 0}
                      className="w-full border rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <option value="">{victimUsers.length ? "የአመልካች ስም ይምረጡ" : "የተመዘገቡ ሰራተኞች አልተገኙም"}</option>
                      {victimUsers
                        .filter((u) => u.id !== offenderUserId)
                        .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ስልክ ቁጥር</label>
                    <input
                      type="text"
                      readOnly
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-700"
                      value={
                        (victimUsers.find((u) => u.id === victimUserId) as any)?.phone || ""
                      }
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3 border-t border-gray-100 pt-4">
              <h2 className="text-sm font-semibold text-gray-800">{t("feedback.anonymous_sa.evidence_section")}</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wasReportedBefore}
                    onChange={(e) => setWasReportedBefore(e.target.checked)}
                  />
                  <span>{t("feedback.anonymous_sa.reported_before")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={needsMedicalHelp}
                    onChange={(e) => setNeedsMedicalHelp(e.target.checked)}
                  />
                  <span>{t("feedback.anonymous_sa.medical_help")}</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    className="block text-sm"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                    }}
                  />
                  {file && (
                    <p className="text-xs text-gray-500">Selected file: {file.name}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {t("feedback.anonymous_sa.evidence_note")}
                </p>
              </div>
            </section>

            <section className="space-y-3 border-t border-gray-100 pt-4">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>{t("feedback.anonymous_sa.consent_text")}</span>
              </label>
            </section>

            {submitMsg && (
              <div
                className={`p-3 rounded text-sm border ${
                  submitOk
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {submitMsg}
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                {t("feedback.anonymous_sa.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {submitting ? t("feedback.anonymous_sa.submitting") : t("feedback.anonymous_sa.submit")}
              </button>
            </div>
          </form>
          <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
            <div className="pt-6 space-y-3">
              <h2 className="text-sm font-semibold text-gray-800">
                የቅርብ ጊዜ የተላኩ ሪፖርቶች (Recent anonymous submissions)
              </h2>
              {historyLoading ? (
                <p className="text-xs text-gray-500">Loading recent reports...</p>
              ) : historyError ? (
                <p className="text-xs text-red-600">{historyError}</p>
              ) : historyReports.length === 0 ? (
                <p className="text-xs text-gray-500">No recent reports found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-gray-200 bg-white">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-2 py-1 border border-gray-200 text-left">የጥቃቱ አይነት</th>
                        <th className="px-2 py-1 border border-gray-200 text-left">ቦታ</th>
                        <th className="px-2 py-1 border border-gray-200 text-left">ቀን</th>
                        <th className="px-2 py-1 border border-gray-200 text-left">ሌሎች</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyReports.map((r) => (
                        <tr key={r.id} className="odd:bg-white even:bg-gray-50">
                          <td className="px-2 py-1 border border-gray-200 align-top">
                            {r.typeOfMisconduct || "-"}
                          </td>
                          <td className="px-2 py-1 border border-gray-200 align-top whitespace-nowrap">
                            {r.location || "-"}
                          </td>
                          <td className="px-2 py-1 border border-gray-200 align-top whitespace-nowrap">
                            {new Date(r.dateTime || r.createdAt).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })}
                          </td>
                          <td className="px-2 py-1 border border-gray-200 align-top whitespace-nowrap">
                            {r.medicalHelpNeeded && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 mr-1">
                                የህክምና እርዳታ
                              </span>
                            )}
                            {r.reportedBefore && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                ቀድሞ የተመዘገበ
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-1 text-[10px] text-gray-400">Showing last {historyReports.length} submissions.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
