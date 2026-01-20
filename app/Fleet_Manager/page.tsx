"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FleetManagerEntryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/fleet/manager");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-full w-full p-8">
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold">
          Redirecting to Fleet Manager Dashboard…
        </p>
      </div>
    </div>
  );
}
