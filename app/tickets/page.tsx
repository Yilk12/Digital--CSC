import { DashboardLayout } from "@/components/dashboard-layout"
import { TicketManagement } from "@/components/ticket-management"

export default function TicketsPage() {
  return (
    <DashboardLayout>
      <TicketManagement />
    </DashboardLayout>
  )
}
