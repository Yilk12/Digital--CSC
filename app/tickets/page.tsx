import { Suspense } from "react"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { TicketManagement } from "@/app/components/ticket-management"

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading tickets...</div>}>
      <DashboardLayout>
        <TicketManagement />
      </DashboardLayout>
    </Suspense>
  )
}
