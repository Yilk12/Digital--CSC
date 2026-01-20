import React from "react"
import Link from "next/link"
import FleetRequestForms from "@/app/components/fleet/fleet-request-forms"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"

export default function FleetRequestsPage() {
  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ጥያቄዎች</h1>
        <Link href="/fleet/manager?tab=requests">
          <Button className="shadow">ሹፌር መድብ</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>የመኪና ጥያቄዎች</CardTitle>
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
