"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalization } from "@/app/hooks/use-localization";

// Report interface matching your backend data
interface Report {
  id: string;
  typeOfMisconduct: string;
  dateTime: string;
  location: string;
  detailDescriptionOfIncident: string;
  reportedBefore: boolean;
  medicalHelpNeeded: boolean;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
  departmentOfPerpetrator?: string;
  perpetratorName?: string;
  applicantName?: string;
  applicantPhone?: string;
}

// Reports Display Page
export default function ReportsDisplayPage() {
  const { t } = useLocalization();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [activeView, setActiveView] = useState<"summary" | "list">("list");

  // Export format selection for table export
  const [exportFormat, setExportFormat] = useState<"word" | "excel" | "pdf">("word");

  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Misconduct types (chart list) pagination state
  const [typePage, setTypePage] = useState(1);
  const TYPES_PER_PAGE = 10;

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

  // Chart data calculations
  const chartData = {
    monthlyTrends: Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = date.toLocaleDateString('am-ET', { month: 'short' });
      const count = reports.filter(report => {
        const reportDate = new Date(report.createdAt);
        return reportDate.getMonth() === date.getMonth() && 
               reportDate.getFullYear() === date.getFullYear();
      }).length;
      return { month: monthKey, count };
    }),
    
    misconductTypes: reports.reduce((acc, report) => {
      const type = report.typeOfMisconduct || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    locationDistribution: reports.reduce((acc, report) => {
      const location = report.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Misconduct types pagination helpers (must be computed after chartData)
  const misconductEntries = Object.entries(chartData.misconductTypes).sort(([, a], [, b]) => b - a);
  const totalTypePages = Math.max(1, Math.ceil(misconductEntries.length / TYPES_PER_PAGE));
  const safeTypePage = Math.min(Math.max(typePage, 1), totalTypePages);
  const startTypeIndex = (safeTypePage - 1) * TYPES_PER_PAGE;
  const paginatedMisconductEntries = misconductEntries.slice(
    startTypeIndex,
    startTypeIndex + TYPES_PER_PAGE,
  );

  // Export helper for table/list view
  const exportReports = (format: "word" | "excel" | "pdf") => {
    if (!reports.length || typeof window === "undefined") return;

    const headers = [
      "№",
      "የጥቃቱ አይነት",
      "ጥቃት ያደረሰዉ አካል የስራ ክፍል",
      "ጥቃት ያደረሰዉ አካል ስም",
      "የጥቃቱ ዝርዝር",
      "የአመልካች ስም",
      "ስልክ ቁጥር",
      "ቀን",
    ];

    const rows = reports.map((r, idx) => [
      String(idx + 1),
      r.typeOfMisconduct || "",
      r.departmentOfPerpetrator || "",
      r.perpetratorName || "",
      r.detailDescriptionOfIncident || "",
      r.applicantName || "",
      r.applicantPhone || "",
      formatDate(r.dateTime),
    ]);

    const escapeHtml = (v: string) =>
      v
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const tableHtml = `<!DOCTYPE html><html><head><meta charset="utf-8" />
      <style>
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head><body>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${r
                  .map((cell) => `<td>${escapeHtml(String(cell ?? ""))}</td>`)
                  .join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </body></html>`;

    const now = new Date();
    const ts = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");

    if (format === "pdf") {
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.open();
      win.document.write(tableHtml);
      win.document.close();
      win.focus();
      win.print();
      return;
    }

    const mime =
      format === "word"
        ? "application/msword"
        : "application/vnd.ms-excel";
    const ext = format === "word" ? "doc" : "xls";
    const blob = new Blob([tableHtml], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `women-social-inclusion-reports-${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Pagination calculations
  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  // Pagination component
  const Pagination = () => (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-white">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-700">
          Showing {startIndex + 1} to {Math.min(endIndex, reports.length)} of {reports.length} results
        </span>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value={5}>5 በገፅ</option>
          <option value={10}>10 በገፅ</option>
          <option value={25}>25 በገፅ</option>
          <option value={50}>50 በገፅ</option>
        </select>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ወደ ቀድሞ
        </button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 border rounded-md text-sm ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ቀጣይ
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`${apiBase}/api/submissions/women-social-inclusion`);

        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError("Error loading reports");
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [apiBase]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats for cards
  const stats = {
    total: reports.length,
    needsMedical: reports.filter((report) => report.medicalHelpNeeded).length,
    reportedBefore: reports.filter((report) => report.reportedBefore).length,
    recent: reports.filter((report) => {
      const reportDate = new Date(report.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return reportDate > thirtyDaysAgo;
    }).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">ሪፖርት በማየት ላይ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-32">
      <div className="max-w-7xl mx-auto pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">የፆታዊ ጥቃት ሪፖርቶች</h1>
          <p className="mt-2 text-gray-600"></p>
        </div>

        {/* Tabs: Summary vs Detailed List */}
        <div className="mb-4 flex items-center gap-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveView("summary")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeView === "summary"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ጠቅላላ ሪፖርት
          </button>
          <button
            type="button"
            onClick={() => setActiveView("list")}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeView === "list"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ዝርዝር መረጃ
          </button>
        </div>

        {/* Stats Cards (summary view only) */}
        {activeView === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-50">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ጠቅላላ ሪፖርቶች</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-50">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">የህክምና እገዛ የሚፈልጉ</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.needsMedical}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-50">
                  <svg
                    className="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ከዚህ በፊት ሪፖርት የተደረገበት</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.reportedBefore}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ባለፉት 30 ቀናት</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section (summary view only) */}
        {activeView === "summary" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Monthly Trends Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ያለፉት 6 ወራት
              </h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.monthlyTrends.map((item, index) => (
                  <div key={item.month} className="flex flex-col items-center flex-1">
                    <div className="text-xs text-gray-500 mb-2">{item.month}</div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-400"
                      style={{ 
                        height: `${Math.max((item.count / Math.max(...chartData.monthlyTrends.map(d => d.count))) * 80, 10)}%`,
                        minHeight: '20px'
                      }}
                    >
                      <div className="text-xs text-white text-center mt-1 font-medium">
                        {item.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Misconduct Types Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">የጥቃት ስርጭት</h3>
              <div className="h-64 space-y-3 overflow-y-auto pr-1">
                {paginatedMisconductEntries.map(([type, count]) => {
                  const percentage = reports.length ? (count / reports.length) * 100 : 0;
                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 capitalize">{type.toLowerCase()}</span>
                        <span className="text-gray-500">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalTypePages > 1 && (
                <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                  <button
                    type="button"
                    onClick={() => setTypePage(p => Math.max(p - 1, 1))}
                    disabled={safeTypePage === 1}
                    className="px-3 py-1 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ወደ ቀድሞ
                  </button>
                  <span>
                    Page {safeTypePage} of {totalTypePages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTypePage(p => Math.min(p + 1, totalTypePages))}
                    disabled={safeTypePage === totalTypePages}
                    className="px-3 py-1 rounded-full border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ቀጣይ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visual separator between charts and table */}
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

        {/* Reports Table (list view only) */}
        {activeView === "list" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center justify-between md:justify-start gap-3 w-full md:w-auto">
                <h2 className="text-lg font-semibold text-gray-900">የተላኩ የጥቃት ሪፖርቶች</h2>
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 hidden sm:inline">Export:</span>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as "word" | "excel" | "pdf")}
                  disabled={!reports.length}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white disabled:bg-gray-100"
                >
                  <option value="word">Word</option>
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
                <button
                  type="button"
                  onClick={() => exportReports(exportFormat)}
                  className="px-3 py-1.5 rounded-full bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:bg-gray-300"
                  disabled={!reports.length}
                >
                  Export
                </button>
              </div>
            </div>

            {error ? (
              <div className="p-6 text-center">
                <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                  {error}
                </div>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="w-12 h-12 text-gray-400 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No reports found</h3>
                <p className="mt-2 text-gray-500">No incident reports have been submitted yet.</p>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 text-[13px]">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700 w-12">
                          №
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          የጥቃቱ አይነት
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          ጥቃት ያደረሰዉ አካል የስራ ክፍል
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          ጥቃት ያደረሰዉ አካል ስም
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          የጥቃቱ ዝርዝር
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          የአመልካች ስም
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          ስልክ ቁጥር
                        </th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                          ቀን
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReports.map((report, index) => (
                        <tr
                          key={report.id}
                          className={index % 2 === 0 ? "bg-white" : "bg-green-50"}
                        >
                          <td className="border border-gray-300 px-3 py-2 text-center align-top">
                            {startIndex + index + 1}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top">
                            {report.typeOfMisconduct}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top">
                            {report.departmentOfPerpetrator || "-"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top">
                            {report.perpetratorName || "-"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top max-w-xs">
                            <div className="text-gray-700 text-sm truncate">
                              {report.detailDescriptionOfIncident}
                            </div>
                            {report.detailDescriptionOfIncident && report.detailDescriptionOfIncident.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedReport(report)}
                                className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                More
                              </button>
                            )}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top whitespace-nowrap text-sm text-gray-900">
                            {report.applicantName || "-"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top whitespace-nowrap text-sm text-gray-900">
                            {report.applicantPhone || "-"}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 align-top whitespace-nowrap text-sm text-gray-900">
                            {formatDate(report.dateTime)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination />
              </div>
            )}
          </div>
        )}
        {/* Selected Report Detail */}
        {selectedReport && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">የጥቃት ዝርዝር</h2>
                <p className="text-sm text-gray-500 mt-1">
                  ሙሉ ዝርዝር.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                ዝጋ
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">የጥቃቱ አይነት</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedReport.typeOfMisconduct}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">ጥቃት ያደረሰዉ አካል የስራ ክፍል</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedReport.departmentOfPerpetrator || "-"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">ጥቃት ያደረሰዉ ስም</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedReport.perpetratorName || "-"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">ቦታ</h3>
                  <p className="text-sm text-gray-900 mt-1">{selectedReport.location || "-"}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">ቀን &amp; ሰዓት</h3>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(selectedReport.dateTime)}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedReport.medicalHelpNeeded && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      የህክምና እርዳታ የሚፈልግ
                    </span>
                  )}
                  {selectedReport.reportedBefore && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ከዚህ በፊት ሪፖርት የተደረገበት 
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">ዝርዝር መረጃ</h3>
                  <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">
                    {selectedReport.detailDescriptionOfIncident}
                  </p>
                </div>
                {selectedReport.fileUrl && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">ፋይል ያክሉ</h3>
                    <div className="border rounded-lg overflow-hidden max-w-sm">
                      <img
                        src={selectedReport.fileUrl}
                        alt="Incident attachement"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}