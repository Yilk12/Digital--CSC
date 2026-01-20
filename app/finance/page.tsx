"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"

export default function FinanceDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Fixed top-right TCO button */}
      <div className="fixed top-4 right-4 z-50">
        <Link href="/finance/tco">
          <Button className="shadow-md">Total Cost of Ownership</Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Finance Dashboard</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/finance/tco">
            <Button>Total Cost of Ownership</Button>
          </Link>
          <Link href="/finance/maintenance">
            <Button variant="secondary">Maintenance Batches</Button>
          </Link>
          <Link href="/finance/fleet-costs">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Fleet Cost</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href="/finance/tco">
                <Button>Open TCO Calculator</Button>
              </Link>
              <Link href="/finance/maintenance">
                <Button className="bg-emerald-600 hover:bg-emerald-700">View Maintenance</Button>
              </Link>
              <Link href="/finance/fleet-costs">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Register Fleet Cost</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Use the buttons above to access finance tools. We can extend this dashboard with KPIs and charts later.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
