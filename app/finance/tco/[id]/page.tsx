"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TCODetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState<any>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/finance/tco/${encodeURIComponent(id)}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Not found')
        setItem(data?.item)
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const printPage = () => window.print()

  if (loading) return <div className="container mx-auto px-4 py-6">Loading…</div>
  if (error) return <div className="container mx-auto px-4 py-6 text-red-600">{error}</div>
  if (!item) return <div className="container mx-auto px-4 py-6">No data.</div>

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <h1 className="text-2xl font-bold">TCO Detail - {item.id}</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => router.back()}>Back</Button>
          <Button onClick={printPage}>Print</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>TCO Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">ID</div>
              <div className="font-medium">{item.id}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="font-medium">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Linked Request</div>
              <div className="font-medium">{item.requestId || '-'}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { k: 'purchase', label: 'Purchase / Lease Cost' },
              { k: 'fuel', label: 'Fuel Costs' },
              { k: 'maintenance', label: 'Maintenance & Repairs' },
              { k: 'insurance', label: 'Insurance' },
              { k: 'depreciation', label: 'Depreciation' },
              { k: 'taxes', label: 'Taxes & Fees' },
              { k: 'financing', label: 'Financing Costs' },
              { k: 'resale', label: 'Disposal / Resale Value' },
            ].map((row) => (
              <div key={row.k} className="flex items-center justify-between border rounded p-3">
                <div className="text-sm text-muted-foreground">{row.label}</div>
                <div className="font-semibold">{(item?.[row.k] ?? 0).toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded bg-gray-50">
              <div className="font-medium">Total Costs</div>
              <div className="font-bold">{Number(item.totalCosts || 0).toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-gray-50">
              <div className="font-medium">Net TCO</div>
              <div className="font-bold">{Number(item.netTCO || 0).toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 text-sm text-muted-foreground print:hidden">
        Tip: Use the Print button for a clean export. For CSV export, go to the TCO list page.
      </div>
    </div>
  )
}
