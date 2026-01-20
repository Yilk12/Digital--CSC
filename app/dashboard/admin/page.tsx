"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { usersApi } from "@/app/lib/users-api";
import { articlesApi } from "@/app/lib/articles-api";
import { listAdvertisements } from "@/app/lib/advertisements-api";
import { apiGet } from "@/app/lib/api";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({ users: 0, tickets: 0, kb: 0, announcements: 0 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Users total via pagination
        const u = await usersApi.list({ page: 1, limit: 1 });
        const usersTotal = (u as any)?.pagination?.total ?? (Array.isArray((u as any)?.users) ? (u as any).users.length : 0);

        // KB total via pagination
        const kbPage = await articlesApi.list({ page: 1, limit: 1 });
        const kbTotal = (kbPage as any)?.pagination?.total ?? (Array.isArray((kbPage as any)?.articles) ? (kbPage as any).articles.length : 0);

        // Announcements total via advertisements API
        const ads = await listAdvertisements({ page: 1, pageSize: 1 });
        const adsTotal = (ads as any)?.total ?? (Array.isArray((ads as any)?.items) ? (ads as any).items.length : 0);

        // Tickets total: try common shapes, fallback to 0 if unavailable
        let ticketsTotal = 0;
        try {
          const t = await apiGet<any>(`/tickets?page=1&limit=1`);
          ticketsTotal = t?.pagination?.total ?? t?.total ?? (Array.isArray(t?.items) ? t.items.length : 0) ?? 0;
        } catch {
          try {
            const t2 = await apiGet<any>(`/helpdesk/tickets?page=1&limit=1`);
            ticketsTotal = t2?.pagination?.total ?? t2?.total ?? (Array.isArray(t2?.items) ? t2.items.length : 0) ?? 0;
          } catch {
            ticketsTotal = 0;
          }
        }

        if (!cancelled) setCounts({ users: usersTotal, tickets: ticketsTotal, kb: kbTotal, announcements: adsTotal });
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load admin report");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Admin Reports</h2>
            <p className="text-gray-600">Overview of key modules: Users, Tickets, Knowledge Base, Announcements</p>
          </div>

          {error && (
            <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportCard
              title="User Management"
              value={counts.users}
              loading={loading}
              href="/users"
              subtitle="Total users"
            />
            <ReportCard
              title="Tickets"
              value={counts.tickets}
              loading={loading}
              href="/tickets"
              subtitle="Total tickets"
            />
            <ReportCard
              title="Knowledge Base"
              value={counts.kb}
              loading={loading}
              href="/knowledge-base"
              subtitle="Articles"
            />
            <ReportCard
              title="Announcements"
              value={counts.announcements}
              loading={loading}
              href="/advertisements"
              subtitle="Active + drafts"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Users vs Tickets">
              <VerticalBars
                items={[
                  { label: "Users", value: counts.users, color: "#3B82F6" },
                  { label: "Tickets", value: counts.tickets, color: "#EF4444" },
                ]}
              />
            </SectionCard>
            <SectionCard title="Knowledge Base">
              <VerticalBars
                items={[{ label: "Articles", value: counts.kb, color: "#10B981" }]}
              />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="Announcements">
              <VerticalBars
                items={[{ label: "Announcements", value: counts.announcements, color: "#F59E0B" }]}
              />
            </SectionCard>
            <div className="hidden lg:block" />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}

function ReportCard({ title, value, loading, href, subtitle }: { title: string; value: number; loading: boolean; href: string; subtitle?: string }) {
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

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}

function VerticalBars({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map(i => i.value || 0));
  const height = 220; // px
  const padding = { top: 20, right: 12, bottom: 40, left: 12 };
  const innerHeight = height - padding.top - padding.bottom;
  const gridLines = 4; // 25% steps like the screenshot
  const formatValue = (n: number) => new Intl.NumberFormat().format(n);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 600 ${height}`} className="w-full h-[240px]">
        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (innerHeight * i) / gridLines;
          return (
            <line key={i} x1={padding.left} x2={600 - padding.right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth={1} />
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
        <line x1={padding.left} x2={600 - padding.right} y1={padding.top + innerHeight} y2={padding.top + innerHeight} stroke="#9CA3AF" strokeWidth={1} />
      </svg>
    </div>
  );
}

function ComparisonBars({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map(i => i.value || 0));
  const tickFractions = [0, 0.25, 0.5, 0.75, 1];
  const ticks = tickFractions.map(f => ({ f, v: Math.round(max * f) }));
  return (
    <div className="space-y-4">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-center justify-between text-sm" style={{ color: "#374151" }}>
            <span>{it.label}</span>
            <span className="text-gray-500">{it.value}</span>
          </div>
          <div className="w-full h-3 rounded bg-gray-100 relative overflow-hidden" style={{ outline: "1px solid #E5E7EB" }}>
            <div
              className="h-3 rounded"
              style={{ width: `${Math.max(0, Math.min(100, (it.value / max) * 100))}%`, backgroundColor: it.color, transition: "width 300ms ease" }}
            />
            <div className="absolute inset-0" aria-hidden>
              <div className="h-full w-full grid grid-cols-10" style={{ opacity: 0.25 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="border-r" style={{ borderColor: "#E5E7EB" }} />
                ))}
              </div>
            </div>
          </div>
          {/* X-axis with ticks/labels */}
          <div className="relative h-6 mt-2 select-none">
            <div className="absolute left-0 right-0 top-3 h-px" style={{ backgroundColor: "#9CA3AF" }} />
            {ticks.map((t, i) => (
              <div key={i} className="absolute top-0" style={{ left: `${t.f * 100}%`, transform: "translateX(-50%)" }}>
                <div className="h-2 w-px" style={{ backgroundColor: "#9CA3AF" }} />
                <div className="text-[11px] mt-1" style={{ color: "#374151" }}>{t.v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="text-xs text-gray-500">Axis/Grid styled: labels #374151, axis #9CA3AF, grid #E5E7EB</div>
    </div>
  );
}
