import React from "react"
import Link from "next/link"
import FleetRequestForms from "@/components/fleet/fleet-request-forms"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function FleetRequestsPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Requests</h1>
        <Link href="/fleet/manager?tab=requests">
          <Button className="shadow">Assign Driver</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Fleet Management - Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Submit and track fleet-related requests: issues, fuel, and maintenance.
          </p>
        </CardContent>
      </Card>
      <FleetRequestForms />
    </div>
  )
}
