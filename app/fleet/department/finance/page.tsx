"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function FinanceDepartmentRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/fleet/department?dept=Finance")
  }, [router])
  return null
}
