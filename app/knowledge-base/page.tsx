import { Suspense } from "react"
import { DashboardLayout } from "@/app/components/dashboard-layout"
import { KnowledgeBase } from "@/app/components/knowledge-base"

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-600">Loading knowledge base...</div>}>
      <DashboardLayout>
        <KnowledgeBase />
      </DashboardLayout>
    </Suspense>
  )
}
