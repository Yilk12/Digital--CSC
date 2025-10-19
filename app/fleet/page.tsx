"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentUserRoles } from "@/app/lib/auth"

export default function FleetHubPage() {
  const router = useRouter()
  const roles = getCurrentUserRoles().map(r => r.toLowerCase())
  const canDeptHead = roles.includes("department_head") || roles.includes("manager") || roles.includes("admin")
  const canManager = roles.includes("fleet_manager") || roles.includes("manager") || roles.includes("admin")
  const isDriver = roles.includes("driver")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fleet Management</h1>
        <p className="text-sm text-muted-foreground">Role-based tools for requests, approvals, assignments, trips, and reporting.</p>
      </div>

      {/* Role selector */}
      <div className="border rounded p-4">
        <label className="block text-sm font-medium mb-2">Quick navigate by role</label>
        <select
          className="border rounded w-full p-2"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value
            if (!v) return
            router.push(v)
          }}
        >
          <option value="" disabled>Select a role</option>
          <option value="/fleet/register">Vehicle Assignment Registration</option>
          <option value="/fleet/manager">Fleet Manager</option>
          <option value="/fleet/department-head">Department Head</option>
          <option value="/fleet/driver">Drivers</option>
          <option value="/fleet/user">Users (Employees/Departments)</option>
          <option value="/fleet/maintenance">Maintenance Team</option>
          <option value="/fleet/finance">Finance Department</option>
          <option value="/fleet/commissioner">Commissioner</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/fleet/register" className="border rounded p-4 hover:bg-muted">
          <div className="font-semibold">Vehicle Assignment Registration</div>
          <div className="text-sm text-muted-foreground">Register new vehicle assignments and departmental vehicles</div>
        </Link>

        <Link href="/fleet/request" className="border rounded p-4 hover:bg-muted">
          <div className="font-semibold">Request Vehicle Assignment</div>
          <div className="text-sm text-muted-foreground">Submit a request to the Fleet Manager for a vehicle</div>
        </Link>

        <Link href="/fleet/user" className="border rounded p-4 hover:bg-muted">
          <div className="font-semibold">Employees</div>
          <div className="text-sm text-muted-foreground">Request vehicles and track your requests</div>
        </Link>

        {canDeptHead && (
          <Link href="/fleet/department-head" className="border rounded p-4 hover:bg-muted">
            <div className="font-semibold">Department Head</div>
            <div className="text-sm text-muted-foreground">Approve/Reject requests, view department usage</div>
          </Link>
        )}

        {canManager && (
          <Link href="/fleet/manager" className="border rounded p-4 hover:bg-muted">
            <div className="font-semibold">Fleet Manager</div>
            <div className="text-sm text-muted-foreground">Assign vehicles/drivers, manage fleet and drivers, reports</div>
          </Link>
        )}

        {isDriver && (
          <Link href="/fleet/driver" className="border rounded p-4 hover:bg-muted">
            <div className="font-semibold">Driver</div>
            <div className="text-sm text-muted-foreground">View trips, acknowledge, log odometer, incidents, expenses</div>
          </Link>
        )}
      </div>
    </div>
  )
}
