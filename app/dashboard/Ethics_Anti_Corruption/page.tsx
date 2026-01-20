"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { ClipboardList } from "lucide-react";

export default function EthicsAntiCorruptionDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [totalSubmissions, setTotalSubmissions] = useState<number | null>(null);
  const [complaintsCount, setComplaintsCount] = useState<number | null>(null);
  const [suggestionsCount, setSuggestionsCount] = useState<number | null>(null);
  const [complimentsCount, setComplimentsCount] = useState<number | null>(null);

  // Feedback stats from /feedback endpoint
  const [totalFeedback, setTotalFeedback] = useState<number | null>(null);
  const [feedbackComplaintsCount, setFeedbackComplaintsCount] = useState<number | null>(null);
  const [feedbackSuggestionsCount, setFeedbackSuggestionsCount] = useState<number | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const pageSize = 10;
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);

  function getToken() {
    try {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("jwt") ||
        localStorage.getItem("token") ||
        ""
      );
    } catch {
      return "";
    }
  }

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    if (role !== "ethics_anti_corruption" && role !== "admin" && role !== "commissioner") {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    async function loadCounts() {
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(`${API_BASE}/api/submissions`, { headers });
        const data = await res.json().catch(() => []);
        const items: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any).items)
          ? (data as any).items
          : [];

        const normalized = items.map((s: any) =>
          typeof s?.type === "string" ? s.type.toUpperCase() : ""
        );

        const total = items.length;
        const complaints = normalized.filter((t) => t === "COMPLAINT").length;
        const suggestions = normalized.filter((t) => t === "SUGGESTION").length;
        const compliments = normalized.filter((t) => t === "COMPLIMENT").length;

        setTotalSubmissions(total);
        setComplaintsCount(complaints);
        setSuggestionsCount(suggestions);
        setComplimentsCount(compliments);
      } catch {
        setTotalSubmissions(0);
        setComplaintsCount(0);
        setSuggestionsCount(0);
        setComplimentsCount(0);
      }
    }

    loadCounts();
  }, []);

  // Load feedback-like stats from submissions (complaints/suggestions)
  useEffect(() => {
    async function loadFeedbackStats() {
      try {
        const token = getToken();
        const headers: HeadersInit = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const res = await fetch(`${API_BASE}/api/submissions`, { headers });
        if (!res.ok) return;

        const data = await res.json().catch(() => []);
        const items: any[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any).items)
          ? (data as any).items
          : [];

        const normalized = items.map((s: any) =>
          typeof s?.type === "string" ? s.type.toUpperCase() : ""
        );

        const total = items.length;
        const complaints = normalized.filter((t) => t === "COMPLAINT").length;
        const suggestions = normalized.filter((t) => t === "SUGGESTION").length;

        setTotalFeedback(total);
        setFeedbackComplaintsCount(complaints);
        setFeedbackSuggestionsCount(suggestions);
        setFeedbackItems(items);
      } catch {
        // Ignore errors; dashboard still works without feedback stats
      }
    }

    loadFeedbackStats();
  }, []);

  const formatCount = (value: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "0";
    }
    return String(value);
  };

  // Export helpers (use all feedback items, not just current page)
  const sanitizeCell = (value: unknown) => {
    if (value == null) return "";
    return String(value).replace(/\s+/g, " ").trim();
  };

  const buildExportRows = () => {
    return feedbackItems.map((f, idx) => {
      const no = idx + 1;
      const date = f.createdAt ? new Date(f.createdAt).toLocaleString() : "-";
      const type = typeof f.type === "string" ? f.type : "";
      const message = String(f.message || "");
      return { no, date, type, message };
    });
  };

  const downloadFile = (content: string | Blob, filename: string, type: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!feedbackItems.length) return;
    const rows = buildExportRows();
    const header = ["No", "Date", "Type", "Message"];
    const csvLines = [header.join(",")];
    for (const r of rows) {
      const line = [r.no, sanitizeCell(r.date), sanitizeCell(r.type), '"' + sanitizeCell(r.message).replace(/"/g, '""') + '"'];
      csvLines.push(line.join(","));
    }
    const csv = csvLines.join("\n");
    downloadFile(csv, "ethics-feedback.csv", "text/csv;charset=utf-8;");
  };

  const handleExportWord = () => {
    if (!feedbackItems.length) return;
    const rows = buildExportRows();
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr><td>${r.no}</td><td>${sanitizeCell(r.date)}</td><td>${sanitizeCell(
            r.type,
          )}</td><td>${sanitizeCell(r.message)}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ethics Feedback</title></head><body><h2>All Feedback</h2><table border="1" cellpadding="4" cellspacing="0"><thead><tr><th>No</th><th>Date</th><th>Type</th><th>Message</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;
    downloadFile(html, "ethics-feedback.doc", "application/msword");
  };

  const handleExportPdf = () => {
    if (typeof window === "undefined" || !feedbackItems.length) return;

    const rows = buildExportRows();
    const rowsHtml = rows
      .map(
        (r) =>
          `<tr><td>${r.no}</td><td>${sanitizeCell(r.date)}</td><td>${sanitizeCell(
            r.type,
          )}</td><td>${sanitizeCell(r.message)}</td></tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ethics Feedback</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 16px; }
        h2 { margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head><body><h2>All Feedback</h2><table><thead><tr><th>No</th><th>Date</th><th>Type</th><th>Message</th></tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  // Paginated slice of feedback items
  const paginatedFeedbackItems = useMemo(() => {
    if (!Array.isArray(feedbackItems) || feedbackItems.length === 0) return [];
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return feedbackItems.slice(start, end);
  }, [feedbackItems, currentPage]);

  const totalPages = useMemo(() => {
    if (!Array.isArray(feedbackItems) || feedbackItems.length === 0) return 1;
    return Math.max(1, Math.ceil(feedbackItems.length / pageSize));
  }, [feedbackItems]);

  // Ensure currentPage stays in range when data changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // When a card is clicked, treat its items as "seen" for this session
  const clearAllCountsAndGo = () => {
    setTotalSubmissions(0);
    setComplaintsCount(0);
    setSuggestionsCount(0);
    setComplimentsCount(0);
    router.push("/voicebox");
  };

  const clearComplaintsAndGo = () => {
    setTotalSubmissions((prev) => {
      const p = typeof prev === "number" && !Number.isNaN(prev) ? prev : 0;
      const c = typeof complaintsCount === "number" && !Number.isNaN(complaintsCount) ? complaintsCount : 0;
      return Math.max(0, p - c);
    });
    setComplaintsCount(0);
    router.push("/voicebox?type=complaint");
  };

  const clearSuggestionsAndGo = () => {
    setTotalSubmissions((prev) => {
      const p = typeof prev === "number" && !Number.isNaN(prev) ? prev : 0;
      const c = typeof suggestionsCount === "number" && !Number.isNaN(suggestionsCount) ? suggestionsCount : 0;
      return Math.max(0, p - c);
    });
    setSuggestionsCount(0);
    router.push("/voicebox?type=suggestion");
  };

  const clearComplimentsAndGo = () => {
    setTotalSubmissions((prev) => {
      const p = typeof prev === "number" && !Number.isNaN(prev) ? prev : 0;
      const c = typeof complimentsCount === "number" && !Number.isNaN(complimentsCount) ? complimentsCount : 0;
      return Math.max(0, p - c);
    });
    setComplimentsCount(0);
    router.push("/voicebox?type=compliment");
  };

  const handlePrintSelectedFeedback = () => {
    if (typeof window === "undefined" || !selectedFeedback) return;

    const dateStr = selectedFeedback.createdAt
      ? new Date(selectedFeedback.createdAt).toLocaleString()
      : "-";
    const typeStr =
      typeof selectedFeedback.type === "string"
        ? selectedFeedback.type.toLowerCase()
        : "-";
    const messageStr = String(selectedFeedback.message || "");

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Feedback Details</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 14px; padding: 24px; }
        h2 { margin-bottom: 16px; }
        .label { font-weight: 600; }
        .value { margin-bottom: 8px; }
        .message { white-space: pre-wrap; margin-top: 8px; }
      </style>
    </head><body>
      <h2>Feedback Details</h2>
      <div class="value"><span class="label">Date: </span><span>${escapeHtml(dateStr)}</span></div>
      <div class="value"><span class="label">Type: </span><span>${escapeHtml(typeStr)}</span></div>
      <div class="value"><span class="label">Message:</span>
        <div class="message">${escapeHtml(messageStr)}</div>
      </div>
      <script>
        window.onload = function() { window.print(); };
      <\/script>
    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sent complaints/suggestions card - የተላኩ ጥቆማዎች (scrolls to All Feedback on this page) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  const el = document.getElementById("ethics-feedback-list");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="bg-white rounded-xl shadow-sm border flex items-center justify-between px-6 py-4 relative overflow-hidden text-left hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <div className="absolute inset-y-0 left-0 w-1 bg-indigo-500" />
              <div className="relative flex flex-col">
                <span className="text-sm font-semibold text-amber-500 mb-1">
                  የተላኩ  ጥቆማዎች
                </span>
                <span className="text-2xl font-bold text-gray-800">
                  {typeof totalFeedback === "number" && !Number.isNaN(totalFeedback)
                    ? totalFeedback
                    : 0}
                </span>
                <span className="text-sm text-gray-600 mt-1">
                  የመጡ ግብረ መልሶች ድምር
                </span>
              </div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-500">
                <ClipboardList className="w-5 h-5" />
              </div>
            </button>

            {/* Fleet total report card - ጠቅላላ የመኪና ሪፖርት
                Only show on Commissioner dashboard route, not on base Ethics dashboard. */}
            {pathname?.toLowerCase().startsWith("/dashboard/commissioner") && (
              <button
                type="button"
                onClick={() => router.push("/commissioner/fleet")}
                className="bg-white rounded-xl shadow-sm border flex items-center justify-between px-6 py-4 relative overflow-hidden text-left hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
                <div className="relative flex flex-col">
                  <span className="text-sm font-semibold text-amber-500 mb-1">
                    ጠቅላላ የመኪና ሪፖርት
                  </span>
                  <span className="text-sm text-gray-600 mt-1">
                    የመኪናዎች ጠቅላላ ሪፖርት ሰንጠረዥን ለማየት ይጫኑ
                  </span>
                </div>
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-500">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </button>
            )}
          </div>

          {/* Full feedback list */}
          <div
            id="ethics-feedback-list"
            className="bg-white rounded-xl shadow-sm border px-6 py-4"
          >
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-800">All Feedback</h2>
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-gray-500">
                  {typeof totalFeedback === "number" ? totalFeedback : feedbackItems.length} items
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsExportOpen((prev) => !prev)}
                    className="px-3 py-1 rounded border border-gray-300 text-xs text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-1"
                  >
                    Export
                    <span className="text-[10px]">▼</span>
                  </button>
                  {isExportOpen && (
                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded shadow-md z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportOpen(false);
                          handleExportWord();
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Word
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportOpen(false);
                          handleExportExcel();
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Excel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportOpen(false);
                          handleExportPdf();
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {feedbackItems.length === 0 ? (
              <p className="text-sm text-gray-500">No feedback records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 w-12">No</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Date</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Message</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedFeedbackItems.map((f, idx) => {
                      const displayIndex = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr key={f.id ?? idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-700">{displayIndex}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {f.createdAt
                              ? new Date(f.createdAt).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-700 capitalize">
                            {typeof f.type === "string" ? f.type.toLowerCase() : "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {String(f.message || "").length > 120
                              ? String(f.message).slice(0, 117) + "..."
                              : String(f.message || "")}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedFeedback(f)}
                              className="inline-flex items-center px-3 py-1 rounded border border-indigo-500 text-indigo-600 text-xs font-medium hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
// ...
                <div className="flex items-center justify-between mt-4 text-sm text-gray-700">
                  <span>
                    Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                  </span>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className={`px-3 py-1 rounded border text-sm ${
                        currentPage <= 1
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className={`px-3 py-1 rounded border text-sm ${
                        currentPage >= totalPages
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Details modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg max-w-xl w-full mx-4">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="text-base font-semibold text-gray-800">Feedback Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  ✕
                </button>
              </div>
              <div className="px-4 py-3 space-y-2 text-sm text-gray-700 max-h-[70vh] overflow-y-auto">
                <div>
                  <span className="font-semibold">Date: </span>
                  <span>
                    {selectedFeedback.createdAt
                      ? new Date(selectedFeedback.createdAt).toLocaleString()
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Type: </span>
                  <span>
                    {typeof selectedFeedback.type === "string"
                      ? selectedFeedback.type.toLowerCase()
                      : "-"}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Message:</span>
                  <p className="mt-1 whitespace-pre-line break-words">
                    {String(selectedFeedback.message || "")}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handlePrintSelectedFeedback}
                  className="px-4 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="px-4 py-1.5 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedFeedback?.id) {
                      return;
                    }
                    const id = String(selectedFeedback.id);
                    setSelectedFeedback(null);
                    router.push(`/voicebox?tab=received&respondToId=${encodeURIComponent(id)}`);
                  }}
                  className="px-4 py-1.5 rounded border border-green-500 text-sm text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                >
                  Respond
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
