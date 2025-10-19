"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function CommissionerFleetPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Commissioner</h1>
          <p className="text-sm text-muted-foreground">High-level overview and quick access to fleet reporting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/fleet/manager" className="border rounded p-4 hover:bg-muted">
            <div className="font-semibold">Fleet Manager</div>
            <div className="text-sm text-muted-foreground">Assignments, drivers, vehicles, and reports</div>
          </Link>
          <Link href="/reporting" className="border rounded p-4 hover:bg-muted">
            <div className="font-semibold">Reporting</div>
            <div className="text-sm text-muted-foreground">System-wide reports and analytics</div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
