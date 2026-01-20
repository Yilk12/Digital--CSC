"use client";

import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";

export default function EthicsAntiCorruptionDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getCurrentUserPrimaryRole();
    if (role !== "ethics_anti_corruption" && role !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">
            Ethics &amp; Anti-Corruption Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            View and manage complaints, suggestions, and compliments submitted
            through the system.
          </p>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
