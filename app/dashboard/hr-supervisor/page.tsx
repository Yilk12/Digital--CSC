"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/app/components/auth-guard";

// This page used to be an HR Supervisor dashboard for field/overtime workflows.
// For this installation we disable it entirely and send users to the main dashboard
// so that no workflow/overtime APIs are called from here.

export default function HrSupervisorDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <AuthGuard>
      <div className="p-6 text-sm text-gray-600">
        Redirecting to main dashboard…
      </div>
    </AuthGuard>
  );
}
