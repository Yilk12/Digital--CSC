"use client"

import React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

const DriverMaintenanceRequestForm = dynamic(
  () => import("@/app/components/driver-maintenance-request-form"),
  { ssr: false },
)

export default function DriverMaintenanceRequestPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Maintenance Request</h1>
          <p className="text-gray-600 text-sm mt-1">
            Submit a maintenance request for your assigned vehicle. Provide clear details to help the maintenance team.
          </p>
        </div>
        <Link
          href="/fleet"
          className="text-sm px-3 py-2 rounded bg-gray-600 text-white hover:bg-gray-700"
        >
          Back to Fleet Hub
        </Link>
      </div>

      <DriverMaintenanceRequestForm />
    </main>
  )
}
