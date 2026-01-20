"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";
import { listFleetRequests } from "@/app/lib/fleet-api";
import { getCurrentUserPrimaryRole, getCurrentUserId } from "@/app/lib/auth";
import { getDepartmentInfo } from "@/app/lib/session";

export default function DepartmentHeadDashboardPage() {
  const router = useRouter();

  const [fleetPendingCount, setFleetPendingCount] = useState<number | null>(null);
  const [fleetIncomingCount, setFleetIncomingCount] = useState<number | null>(null);
  const [ticketsIncomingCount, setTicketsIncomingCount] = useState<number | null>(null);
  const [ideasBoxCount, setIdeasBoxCount] = useState<number | null>(null);
  const deptInfo = getDepartmentInfo();

  // Simple helper reused from other pages
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

  async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit) {
    const token = getToken();
    const headers = new Headers(init?.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    return fetch(input, { ...init, headers });
  }

  useEffect(() => {
    async function loadCounts() {
      try {
        // 1) Fleet requests PENDING approval for this department
        //    - Increments when users submit new requests (status = PENDING)
        //    - Decrements automatically after Department Head approves (status changes to APPROVED)
        // Use the same source as the department-head approvals page so we only count
        // team members' pending requests assigned to this department head.
        const token = getToken();

        // --- Fleet requests pending approval ---
        const res = await fetch(`${API_BASE}/api/fleet/requests/department-requests`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json().catch(() => ({}));
        const items = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        const currentUserId = getCurrentUserId();
        const teamRequests = items.filter((req: any) => {
          const requesterId = req?.requestor?.id;
          const status = (req as any).status || (req as any).requestStatus || (req as any).currentStatus;
          const isPending = typeof status === "string" && status.toLowerCase() === "pending";
          return requesterId && requesterId !== currentUserId && isPending;
        });

        // For now, incoming count is the same as pending team requests for this card
        setFleetIncomingCount(teamRequests.length);
        setFleetPendingCount(teamRequests.length);

        // --- Tickets created by other users/departments ---
        const ticketsRes = await fetch(`${API_BASE}/api/tickets`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (ticketsRes.ok) {
          const ticketsJson = await ticketsRes.json().catch(() => ({}));
          const ticketItems: any[] = Array.isArray(ticketsJson?.tickets)
            ? ticketsJson.tickets
            : Array.isArray(ticketsJson)
            ? ticketsJson
            : [];

          const pendingTickets = ticketItems.filter((t: any) => {
            const rawStatus = (t as any).status;
            const status = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "";
            return status === "pending";
          });

          setTicketsIncomingCount(pendingTickets.length);
        } else {
          setTicketsIncomingCount(0);
        }

        // --- Feedback submissions for my department (ideas & complaints box) ---
        try {
          const ideasTypes = new Set(["COMPLAINT", "SUGGESTION", "COMPLIMENT", "FEEDBACK"]);

          // 1) Submissions sent directly to me
          const receivedRes = await fetch(`${API_BASE}/api/submissions/mine/received`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          let countReceived = 0;
          if (receivedRes.ok) {
            const subsJson = await receivedRes.json().catch(() => ({}));
            const subsItems: any[] = Array.isArray(subsJson?.items)
              ? subsJson.items
              : Array.isArray(subsJson)
              ? subsJson
              : [];

            const relevantReceived = subsItems.filter((s: any) => {
              const rawType = (s as any).type;
              const type = typeof rawType === "string" ? rawType.toUpperCase() : "";
              return ideasTypes.has(type);
            });

            countReceived = relevantReceived.length;
          }

          // 2) Submissions for my department with no explicit recipient
          const deptRes = await fetch(`${API_BASE}/api/submissions/mine/department-unassigned`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });

          let countDept = 0;
          if (deptRes.ok) {
            const deptJson = await deptRes.json().catch(() => ({}));
            const deptItems: any[] = Array.isArray(deptJson?.items)
              ? deptJson.items
              : Array.isArray(deptJson)
              ? deptJson
              : [];

            const relevantDept = deptItems.filter((s: any) => {
              const rawType = (s as any).type;
              const type = typeof rawType === "string" ? rawType.toUpperCase() : "";
              return ideasTypes.has(type);
            });

            countDept = relevantDept.length;
          }

          setIdeasBoxCount(countReceived + countDept);
        } catch {
          setIdeasBoxCount(0);
        }
      } catch {
        setFleetPendingCount(0);
        setTicketsIncomingCount(0);
        setIdeasBoxCount(0);
      }
    }

    // Only load counts for department heads; others will be redirected below
    loadCounts();
  }, []);

  // If user is not a department head, send them to the main dashboard router
  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    if (role !== "department_head" && role !== "women_social_inclusion") {
      router.replace("/dashboard");
    }
  }, [router]);

  const formatCount = (value: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return "0";
    }
    return String(value);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-1 text-center">
            {deptInfo?.name && (
              <h2 className="text-2xl font-bold text-gray-900">
                {deptInfo.name}
              </h2>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pending Approvals card */}
            <button
              type="button"
              onClick={() => router.push("/fleet/department-head?tab=approvals")}
              className="bg-white rounded-2xl shadow-md border flex items-center justify-between px-10 py-8 relative overflow-hidden text-left hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {/* Left accent border */}
              <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />

              <div className="relative flex flex-col">
                <span className="text-base font-semibold text-amber-500 mb-2">
                  የመጣ የመኪና ጥያቄ
                </span>
                <span className="text-5xl font-extrabold text-gray-800 leading-tight">
                  {formatCount(fleetPendingCount)}
                </span>
              </div>

              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-500">
                <ClipboardList className="w-7 h-7" />
              </div>
            </button>

            {/* Tickets from other users/departments */}
            <button
              type="button"
              onClick={() => router.push("/tickets?tab=other")}
              className="bg-white rounded-2xl shadow-md border flex items-center justify-between px-10 py-8 relative overflow-hidden text-left hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              {/* Left accent border */}
              <div className="absolute inset-y-0 left-0 w-1 bg-sky-500" />

              <div className="relative flex flex-col">
                <span className="text-base font-semibold text-amber-500 mb-2">
                  Tickets
                </span>
                <span className="text-5xl font-extrabold text-gray-800 leading-tight">
                  {formatCount(ticketsIncomingCount)}
                </span>
              </div>

              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-sky-50 text-sky-500">
                <ClipboardList className="w-7 h-7" />
              </div>
            </button>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
