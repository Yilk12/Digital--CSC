"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { UserManagement } from "@/components/user-management"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUserRoles } from "@/app/lib/auth"

export default function UsersPage() {
  const router = useRouter()
  const roles = getCurrentUserRoles().map(r=>r.toLowerCase())
  const isAdmin = roles.includes("admin")
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (isAdmin) setAllowed(true)
    else { setAllowed(false); router.replace("/") }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (allowed === null) return (<div className="p-4 text-sm text-gray-600">Loading...</div>)
  if (allowed === false) return null

  return (
    <DashboardLayout showHeading={false}>
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl">
          <UserManagement />
        </div>
      </div>
    </DashboardLayout>
  )
}
