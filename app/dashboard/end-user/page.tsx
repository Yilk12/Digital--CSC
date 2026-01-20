"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { getCurrentUserId, getCurrentUserPrimaryRole } from "@/app/lib/auth";
import { listAdvertisements } from "@/app/lib/advertisements-api";
import { apiGet } from "@/app/lib/api";
import { listFleetRequests } from "@/app/lib/fleet-api";
import { articlesApi } from "@/app/lib/articles-api";

export default function EndUserDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    myOpenTickets: 0,
    announcements: 0,
    fleetRequests: 0,
    myArticles: 0,
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<
    Array<{ id: string; title: string; createdAt?: string | null }>
  >([]);

  // If the logged-in user is a Department Head, send them to the Department Head dashboard instead
  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    if (role === "department_head") {
      router.replace("/dashboard/department-head");
    }
  }, [router]);

  // Load basic system reports available to end-users
  const loadCounts = useCallback(async () => {
    setError(null);
    try {
      // 1) My open tickets (IN_PROGRESS or PENDING status, scoped to current user)
      let myOpenTickets = 0;
      try {
        const me = getCurrentUserId();
        if (me) {
          // Get tickets with IN_PROGRESS or PENDING status (these are "open" tickets)
          // The backend TicketsController is mounted at /tickets, so call that path.
          // Use pageSize=1 to minimize data transfer, we only need the total count.
          const [inProgressRes, pendingRes] = await Promise.all([
            apiGet<any>(`/tickets?status=IN_PROGRESS&page=1&pageSize=1`).catch((err) => {
              console.warn('Failed to fetch IN_PROGRESS tickets:', err);
              return { tickets: [], pagination: { total: 0 } };
            }),
            apiGet<any>(`/tickets?status=PENDING&page=1&pageSize=1`).catch((err) => {
              console.warn('Failed to fetch PENDING tickets:', err);
              return { tickets: [], pagination: { total: 0 } };
            })
          ]);
          
          // Backend returns { tickets: [], pagination: { total: number } }
          // For END_USER role, backend already filters by createdById, so we can use pagination.total
          const inProgressCount = inProgressRes?.pagination?.total ?? 0;
          const pendingCount = pendingRes?.pagination?.total ?? 0;
          
          myOpenTickets = inProgressCount + pendingCount;
        }
      } catch (e) {
        console.error('Error loading open tickets:', e);
        myOpenTickets = 0;
      }

      // 2) Fleet management requests (pending for current user)
      let fleetRequests = 0;
      try {
        const me = getCurrentUserId();
        if (me) {
          const fleet = await listFleetRequests({ status: "PENDING" });
          const fleetArray = Array.isArray(fleet) ? fleet : [];
          // Filter to only current user's requests
          fleetRequests = fleetArray.filter((req: any) => req.requestorId === me).length;
        }
      } catch {
        fleetRequests = 0;
      }

      // 3) Articles created by current user
      let myArticles = 0;
      try {
        const me = getCurrentUserId();
        if (me) {
          const page = await articlesApi.list({ page: 1, limit: 1, authorId: me });
          myArticles =
            (page as any)?.pagination?.total ??
            (Array.isArray((page as any)?.articles) ? (page as any).articles.length : 0);
        }
      } catch {
        myArticles = 0;
      }

      // 4) Recent announcements (public list, newest first)
      const ads = await listAdvertisements({ sort: "newest", page: 1, pageSize: 5 });
      const adsItems: any[] = Array.isArray((ads as any)?.items) ? (ads as any).items : [];
      const announcementsCount =
        (ads as any)?.total ?? (Array.isArray((ads as any)?.items) ? (ads as any).items.length : 0);

      const newCounts = { myOpenTickets, announcements: announcementsCount, fleetRequests, myArticles };
      console.log('Dashboard counts updated:', newCounts);
      setCounts(newCounts);
      setRecentAnnouncements(
        adsItems.map((a) => ({ id: String(a.id), title: String(a.title || ""), createdAt: a.createdAt }))
      );
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard report");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Auto-refresh every 30 seconds to update counts when items are created
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadCounts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [loadCounts]);

  // Refresh when window regains focus (user comes back to tab)
  useEffect(() => {
    const handleFocus = () => {
      loadCounts();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadCounts]);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            <SectionCard 
              title=""
              onRefresh={loadCounts}
              loading={loading}
            >
              <VerticalBars
                items={[
                  { label: "My Open Tickets", value: counts.myOpenTickets, color: "#3B82F6" },
                  { label: "Fleet (Pending)", value: counts.fleetRequests, color: "#6366F1" },
                  { label: "total article", value: counts.myArticles, color: "#EC4899" },
                ]}
              />
            </SectionCard>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function ReportCard({
  title,
  value,
  loading,
  href,
  subtitle,
}: {
  title: string;
  value: number;
  loading: boolean;
  href: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="group block rounded-lg border p-4 hover:border-blue-300 hover:shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-3xl font-bold">{loading ? "…" : value}</div>
        <div className="text-xs text-gray-400">{subtitle}</div>
      </div>
    </Link>
  );
}

function SectionCard({ 
  title, 
  children, 
  onRefresh,
  loading 
}: { 
  title: string; 
  children: React.ReactNode;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">{title}</div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            title="Refresh counts"
          >
            <svg 
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? '' : ''}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function VerticalBars({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map((i) => i.value || 0));
  const height = 220; // px
  const padding = { top: 20, right: 12, bottom: 40, left: 12 };
  const innerHeight = height - padding.top - padding.bottom;
  const gridLines = 4; // 25% steps
  const formatValue = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 600 ${height}`} className="w-full h-[240px]">
        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (innerHeight * i) / gridLines;
          return (
            <line
              key={i}
              x1={padding.left}
              x2={600 - padding.right}
              y1={y}
              y2={y}
              stroke="#E5E7EB"
              strokeWidth={1}
            />
          );
        })}

        {/* Bars */}
        {items.map((it, idx) => {
          const barAreaWidth = (600 - padding.left - padding.right) / items.length;
          const barWidth = Math.min(60, barAreaWidth * 0.5);
          const cx = padding.left + barAreaWidth * idx + barAreaWidth / 2;
          const h = max === 0 ? 0 : (it.value / max) * innerHeight;
          const x = cx - barWidth / 2;
          const y = padding.top + innerHeight - h;
          return (
            <g key={it.label}>
              {/* value label above bar */}
              <text x={cx} y={y - 6} textAnchor="middle" fontSize={12} fill="#374151">
                {formatValue(it.value)}
              </text>
              <rect x={x} y={y} width={barWidth} height={h} fill={it.color} rx={2} />
              {/* x label */}
              <text x={cx} y={height - 12} textAnchor="middle" fontSize={12} fill="#374151">
                {it.label}
              </text>
            </g>
          );
        })}

        {/* Axis baseline */}
        <line
          x1={padding.left}
          x2={600 - padding.right}
          y1={padding.top + innerHeight}
          y2={padding.top + innerHeight}
          stroke="#9CA3AF"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
}

