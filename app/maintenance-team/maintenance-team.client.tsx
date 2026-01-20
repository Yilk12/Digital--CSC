"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/app/components/dashboard-layout";

export default function MaintenanceTeamDashboardClient() {
  const [driverRequestCount, setDriverRequestCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fleet/maintenance/request", { credentials: "include" }).catch(
          () => null as any,
        );
        if (!res) return;
        const data: any = await res.json().catch(() => ({}));

        if (cancelled) return;

        let items: any[] = [];
        if (Array.isArray(data?.items)) items = data.items;
        else if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.data)) items = data.data;

        let total = 0;
        if (items.length) {
          const driverItems = items.filter(
            (it) => typeof it?.driverId === "string" && it.driverId.trim().length > 0,
          );
          total = driverItems.length || items.length;
        } else if (typeof data?.total === "number") {
          total = data.total;
        }

        setDriverRequestCount(total);
      } catch {
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">የጥገና ቡድን ዳሽቦርድ</h1>
            <p className="mt-2 text-sm text-gray-600">
              የመኪና ጥገና ጥያቄዎችን ለማየትና ለመቆጣጠር ይጠቀሙ።
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/fleet/maintenance/request"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {driverRequestCount !== null
                ? `የጥገና ጥያቄ (${driverRequestCount})`
                : "የጥገና ጥያቄ"}
            </Link>
            <Link
              href="/fleet/maintenance"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              የጥገና ቀን ፕሮግራም ማሳወቂያ
            </Link>
          </div>
        </header>

        <section className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">የጥገና ዳሽቦርድ</h2>
          <p className="text-sm text-gray-600 mb-4">
            ከላይ ያለውን "የጥገና ጥያቄ" ቁልፍ በመጫን አዲስ የመኪና ጥገና ጥያቄ መመዝገብ
            ትችላላችሁ። እንዲሁም ወደ የ"Maintenance Team Dashboard" ገፅ በመሄድ ያሉ ጥገናዎችን ማስተዳደር
            ይችላሉ።
          </p>
          <Link
            href="/fleet/maintenance"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ወደ ፕሮግራም መሳወቂያ ገፅ ይሂዱ
          </Link>
        </section>
      </div>
    </DashboardLayout>
  );
}
