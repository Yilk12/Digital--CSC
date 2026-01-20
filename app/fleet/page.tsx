"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUserRoles, decodeJwt } from "@/app/lib/auth"
import { useEffect, useState } from "react"
import { useLocalization } from "@/app/hooks/use-localization"

interface UserRoles {
  canDeptHead: boolean;
  canManager: boolean;
  isDriver: boolean;
  isFinance: boolean;
  isManager: boolean;
  canSeeFleetCost: boolean;
  isMaintenance: boolean;
  isLoading: boolean;
}

export default function FleetHubPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useLocalization()
  const [userRoles, setUserRoles] = useState<UserRoles>({
    canDeptHead: false,
    canManager: false,
    isDriver: false,
    isFinance: false,
    isManager: false,
    canSeeFleetCost: false,
    isMaintenance: false,
    isLoading: true
  })

  useEffect(() => {
    // This code runs only on the client side
    const roles = getCurrentUserRoles().map(r => r.toLowerCase())
    const canDeptHead = roles.includes("department_head")
    const canManager = roles.includes("fleet_manager") || roles.includes("manager")
    const isDriver = roles.includes("driver")
    const isFinance = roles.includes("finance")
    const isManager = roles.includes("manager")
    const canSeeFleetCost = isFinance || canManager
    const isMaintenance = roles.includes("maintenance_team")

    setUserRoles({
      canDeptHead,
      canManager,
      isDriver,
      isFinance,
      isManager,
      canSeeFleetCost,
      isMaintenance,
      isLoading: false
    })
  }, [])



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("fleet.header")}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!userRoles.canDeptHead && (
          <Link
            href="/fleet/request"
            className="border rounded p-4 bg-gradient-to-r from-green-100 to-pink-100 hover:from-green-200 hover:to-pink-200 transition-colors"
          >
            <div className="font-semibold">{t("fleet.request.header")}</div>
            <div className="text-sm text-muted-foreground">{t("fleet.request.subtitle")}</div>
          </Link>
        )}

        {(userRoles.canManager || userRoles.isManager) && pathname !== "/hr-supervisor/fleet" && (
          <Link
            href="/fleet/manager"
            className="border rounded p-4 bg-gradient-to-r from-green-100 to-pink-100 hover:from-green-200 hover:to-pink-200 transition-colors"
          >
            <div className="font-semibold">{t("fleet.manager.header")}</div>
            <div className="text-sm text-muted-foreground">{t("fleet.manager.subtitle")}</div>
          </Link>
        )}
      </div>
    </div>
  )
}
