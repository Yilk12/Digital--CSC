"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/app/components/auth-guard";
import { getCurrentUserPrimaryRole } from "@/app/lib/auth";

export default function DashboardRouterPage() {
  const router = useRouter();

  useEffect(() => {
    const primary = getCurrentUserPrimaryRole();
    let target = "/dashboard/end-user";
    if (primary === "admin") target = "/dashboard/admin";
    else if (primary === "commissioner") target = "/dashboard/Commissioner/Ethics_Anti_Corruption";
    else if (primary === "manager") target = "/Fleet_Manager";
    else if (primary === "department_head" || primary === "hr") target = "/dashboard/department-head";
    else if (primary === "maintenance_team") target = "/maintenance-team/";
    router.replace(target);
  }, [router]);

  // Render minimal protected shell while redirecting
  return (
    <AuthGuard>
      <div className="p-6 text-gray-600">Redirecting to your dashboard…</div>
    </AuthGuard>
  );
}