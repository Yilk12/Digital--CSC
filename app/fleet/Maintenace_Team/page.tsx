"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserRoles } from "@/app/lib/auth";

export default function MaintenanceTeamEntryPage() {
  const router = useRouter();

  useEffect(() => {
    const roles = getCurrentUserRoles().map((r) => String(r).toLowerCase());
    const isMaintenance = roles.includes("maintenance_team");
    const isFleetManager = roles.includes("fleet_manager");

    if (!roles.length) {
      router.replace("/fleet");
      return;
    }

    if (isFleetManager) {
      router.replace("/fleet/manager/maintenance");
      return;
    }

    if (isMaintenance) {
      router.replace("/fleet/maintenance");
      return;
    }

    router.replace("/fleet");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">Checking maintenance team accesseee</p>
        <p className="text-sm text-gray-500">Please wait while we redirect youe</p>
      </div>
    </div>
  );
}
