import { DashboardLayout } from "@/components/dashboard-layout"
import { DepartmentManagement } from "@/components/department-management"

export default function DepartmentsPage() {
  return (
    <DashboardLayout showHeading={false}>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl">
          <DepartmentManagement />
        </div>
      </div>
    </DashboardLayout>
  )
}
