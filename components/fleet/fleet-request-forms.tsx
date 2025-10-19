"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { listVehicles, createFleetRequest, type VehicleDTO } from "@/app/lib/fleet-api"
import { getCurrentUserPrimaryRole } from "@/app/lib/auth"

function VehicleSelect({ value, onChange, vehicles }: { value?: string; onChange: (v: string) => void; vehicles: VehicleDTO[] }) {
  return (
    <select className="w-full border rounded h-9 px-2" value={value || ""} onChange={e => onChange(e.target.value)}>
      <option value="">Select vehicle</option>
      {vehicles.map(v => (
        <option key={v.id} value={v.id}>{v.plate}{v.make ? ` - ${v.make}` : ''}{v.model ? ` ${v.model}` : ''}</option>
      ))}
    </select>
  )
}

export default function FleetRequestForms({ initialTab = 'issue' }: { initialTab?: 'issue' | 'fuel' | 'maintenance' }) {
  const [vehicles, setVehicles] = useState<VehicleDTO[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [submitState, setSubmitState] = useState<{ kind: string; status: 'idle' | 'submitting' | 'success' | 'error'; message?: string }>({ kind: 'ISSUE', status: 'idle' })
  const role = getCurrentUserPrimaryRole()
  const [tab, setTab] = useState<'issue' | 'fuel' | 'maintenance'>(initialTab)
  // Attachment state per form
  const [issueFiles, setIssueFiles] = useState<File[]>([])
  const [fuelFiles, setFuelFiles] = useState<File[]>([])
  const [maintFiles, setMaintFiles] = useState<File[]>([])
  const [issueFileError, setIssueFileError] = useState<string>('')
  const [fuelFileError, setFuelFileError] = useState<string>('')
  const [maintFileError, setMaintFileError] = useState<string>('')

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const allowMime = (mime: string) => mime?.startsWith('image/') || mime === 'application/pdf'
  function validateAndSet(kind: 'ISSUE' | 'FUEL' | 'MAINTENANCE', list: FileList | null) {
    const files = Array.from(list || [])
    const invalidType = files.filter(f => !allowMime(f.type)).map(f => f.name)
    const tooLarge = files.filter(f => f.size > MAX_SIZE).map(f => f.name)
    const valid = files.filter(f => allowMime(f.type) && f.size <= MAX_SIZE)
    const msgParts = [] as string[]
    if (invalidType.length) msgParts.push(`Invalid type: ${invalidType.join(', ')}`)
    if (tooLarge.length) msgParts.push(`Too large (>5MB): ${tooLarge.join(', ')}`)
    const msg = msgParts.join(' | ')
    if (kind === 'ISSUE') { setIssueFiles(valid); setIssueFileError(msg) }
    if (kind === 'FUEL') { setFuelFiles(valid); setFuelFileError(msg) }
    if (kind === 'MAINTENANCE') { setMaintFiles(valid); setMaintFileError(msg) }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingVehicles(true)
        const list = await listVehicles()
        setVehicles(list || [])
      } catch (e) {
        // ignore; keep empty
      } finally {
        setLoadingVehicles(false)
      }
    }
    load()
  }, [])

  // Issue form
  const issueForm = useForm<{ vehicleId?: string; date: string; description: string }>(
    { defaultValues: { vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '' } }
  )

  const fuelForm = useForm<{ vehicleId?: string; date: string; odometer?: number; amount?: number; cost?: number; description?: string; amountType?: 'LITER' | 'COUPON' | 'CASH' }>(
    { defaultValues: { vehicleId: '', date: new Date().toISOString().slice(0, 10), odometer: undefined, amount: undefined, cost: undefined, description: '', amountType: undefined } }
  )

  const maintForm = useForm<{ vehicleId?: string; date: string; description: string; cost?: number; severity?: 'HIGH' | 'MEDIUM' | 'LOW' }>(
    { defaultValues: { vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '', cost: undefined, severity: undefined } }
  )

  // Helper to upload files to server and return URLs
  async function uploadFiles(files: File[]): Promise<Array<{ name: string; url: string }>> {
    if (!files || files.length === 0) return []
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const res = await fetch('/api/uploads', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = data?.message || (data?.invalidType || data?.tooLarge ? JSON.stringify({ invalidType: data?.invalidType, tooLarge: data?.tooLarge }) : '')
      throw new Error(detail ? `Upload failed: ${detail}` : 'Failed to upload attachments')
    }
    const items = data?.items || []
    return items.map((it: any) => ({ name: it?.name || 'file', url: it?.url }))
  }

  async function handleSubmit(kind: 'ISSUE' | 'FUEL' | 'MAINTENANCE', values: any) {
    setSubmitState({ kind, status: 'submitting' })
    try {
      const filesToAttach = kind === 'ISSUE' ? issueFiles : kind === 'FUEL' ? fuelFiles : maintFiles
      const uploaded = filesToAttach && filesToAttach.length > 0 ? await uploadFiles(filesToAttach) : []
      const payload = {
        type: kind,
        date: new Date(values.date).toISOString(),
        vehicleId: values.vehicleId || undefined,
        description: values.description || undefined,
        odometer: values.odometer ? Number(values.odometer) : undefined,
        amount: values.amount ? Number(values.amount) : undefined,
        amountType: values.amountType ? String(values.amountType).toUpperCase() : undefined,
        cost: values.cost ? Number(values.cost) : undefined,
        severity: values.severity ? String(values.severity).toUpperCase() : undefined,
        attachments: uploaded.length ? uploaded : undefined,
      }
      await createFleetRequest(payload as any)
      setSubmitState({ kind, status: 'success', message: `${kind} request submitted` })
      // reset relevant form
      if (kind === 'ISSUE') issueForm.reset({ vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '' })
      if (kind === 'FUEL') fuelForm.reset({ vehicleId: '', date: new Date().toISOString().slice(0, 10), odometer: undefined, amount: undefined, cost: undefined, description: '', amountType: undefined })
      if (kind === 'MAINTENANCE') maintForm.reset({ vehicleId: '', date: new Date().toISOString().slice(0, 10), description: '', cost: undefined, severity: undefined })
      // clear attachments for that kind
      if (kind === 'ISSUE') setIssueFiles([])
      if (kind === 'FUEL') setFuelFiles([])
      if (kind === 'MAINTENANCE') setMaintFiles([])
    } catch (e: any) {
      setSubmitState({ kind, status: 'error', message: e?.message || 'Submit failed' })
    }
  }

  const roleHint = useMemo(() => {
    if (role === 'department_head') return 'You can submit on behalf of your department.'
    if (role === 'admin' || role === 'manager' || role === 'gm') return 'You have elevated permissions to manage requests.'
    return 'As a driver/employee, provide accurate details.'
  }, [role])

  // Derived UI labels for Fuel form based on amountType
  const fuelAmountType = fuelForm?.watch ? fuelForm.watch('amountType') : undefined
  const fuelAmountLabel = fuelAmountType === 'CASH'
    ? 'Amount (Cash)'
    : fuelAmountType === 'COUPON'
      ? 'Amount (Coupon)'
      : 'Fuel Amount (L)'
  const fuelAmountPlaceholder = fuelAmountType === 'CASH'
    ? 'e.g. 3000'
    : fuelAmountType === 'COUPON'
      ? 'e.g. 2'
      : 'e.g. 40'
  const fuelAmountHelp = fuelAmountType === 'CASH'
    ? 'Enter the cash amount requested.'
    : fuelAmountType === 'COUPON'
      ? 'Enter number of coupons or coupon value count.'
      : 'Enter liters requested.'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fleet Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{roleHint}</div>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onValueChange={(v: string) => {
          if (v === 'issue' || v === 'fuel' || v === 'maintenance') setTab(v)
        }}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="issue">Report Issue</TabsTrigger>
          <TabsTrigger value="fuel">Fuel Request</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Request</TabsTrigger>
        </TabsList>

        <TabsContent value="issue">
          <Card>
            <CardHeader><CardTitle>Report Vehicle Issue</CardTitle></CardHeader>
            <CardContent>
              <Form {...issueForm}>
                <form className="grid gap-4" onSubmit={issueForm.handleSubmit(v => handleSubmit('ISSUE', v))}>
                  <FormField control={issueForm.control} name="vehicleId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <VehicleSelect value={field.value} onChange={field.onChange} vehicles={vehicles} />
                      </FormControl>
                      <FormDescription>{loadingVehicles ? 'Loading vehicles…' : 'Select the vehicle (optional)'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={issueForm.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={issueForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Describe the issue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div>
                    <FormLabel>Attachments</FormLabel>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => validateAndSet('ISSUE', e.target.files)}
                    />
                    {issueFiles.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">{issueFiles.length} file(s) selected</div>
                    )}
                    {issueFileError && (
                      <div className="text-xs text-red-600 mt-1">{issueFileError}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitState.status === 'submitting' && submitState.kind === 'ISSUE'}>
                      {submitState.status === 'submitting' && submitState.kind === 'ISSUE' ? 'Submitting…' : 'Submit Issue'}
                    </Button>
                    {submitState.kind === 'ISSUE' && submitState.status === 'error' && (
                      <div className="text-sm text-red-600">{submitState.message}</div>
                    )}
                    {submitState.kind === 'ISSUE' && submitState.status === 'success' && (
                      <div className="text-sm text-green-700">{submitState.message}</div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fuel">
          <Card>
            <CardHeader><CardTitle>Fuel Request</CardTitle></CardHeader>
            <CardContent>
              <Form {...fuelForm}>
                <form className="grid gap-4" onSubmit={fuelForm.handleSubmit(v => handleSubmit('FUEL', v))}>
                  <FormField control={fuelForm.control} name="vehicleId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <VehicleSelect value={field.value} onChange={field.onChange} vehicles={vehicles} />
                      </FormControl>
                      <FormDescription>{loadingVehicles ? 'Loading vehicles…' : 'Select the vehicle (optional)'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={fuelForm.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <FormField control={fuelForm.control} name="odometer" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Odometer</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 45210" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={fuelForm.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{fuelAmountLabel}</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder={fuelAmountPlaceholder} {...field} />
                        </FormControl>
                        <FormDescription>{fuelAmountHelp}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={fuelForm.control} name="amountType" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Type</FormLabel>
                        <FormControl>
                          <select
                            className="w-full border rounded h-9 px-2"
                            value={field.value || ''}
                            onChange={(e) => field.onChange((e.target.value || undefined) as any)}
                          >
                            <option value="">Select type</option>
                            <option value="LITER">In Liter</option>
                            <option value="COUPON">Coupon</option>
                            <option value="CASH">Cash</option>
                          </select>
                        </FormControl>
                        <FormDescription>Choose how the fuel amount is measured.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={fuelForm.control} name="cost" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="e.g. 3000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>
                  <FormField control={fuelForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div>
                    <FormLabel>Attachments</FormLabel>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => validateAndSet('FUEL', e.target.files)}
                    />
                    {fuelFiles.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">{fuelFiles.length} file(s) selected</div>
                    )}
                    {fuelFileError && (
                      <div className="text-xs text-red-600 mt-1">{fuelFileError}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitState.status === 'submitting' && submitState.kind === 'FUEL'}>
                      {submitState.status === 'submitting' && submitState.kind === 'FUEL' ? 'Submitting…' : 'Submit Fuel Request'}
                    </Button>
                    {submitState.kind === 'FUEL' && submitState.status === 'error' && (
                      <div className="text-sm text-red-600">{submitState.message}</div>
                    )}
                    {submitState.kind === 'FUEL' && submitState.status === 'success' && (
                      <div className="text-sm text-green-700">{submitState.message}</div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader><CardTitle>Maintenance Request</CardTitle></CardHeader>
            <CardContent>
              <Form {...maintForm}>
                <form className="grid gap-4" onSubmit={maintForm.handleSubmit(v => handleSubmit('MAINTENANCE', v))}>
                  <FormField control={maintForm.control} name="vehicleId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle</FormLabel>
                      <FormControl>
                        <VehicleSelect value={field.value} onChange={field.onChange} vehicles={vehicles} />
                      </FormControl>
                      <FormDescription>{loadingVehicles ? 'Loading vehicles…' : 'Select the vehicle (optional)'}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Describe maintenance needed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="severity" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Accident</FormLabel>
                      <FormControl>
                        <select
                          className="w-full border rounded h-9 px-2"
                          value={field.value || ''}
                          onChange={(e) => field.onChange((e.target.value || undefined) as any)}
                        >
                          <option value="">Select severity</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </FormControl>
                      <FormDescription>Select the accident severity if applicable.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={maintForm.control} name="cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Cost</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <div>
                    <FormLabel>Attachments</FormLabel>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => validateAndSet('MAINTENANCE', e.target.files)}
                    />
                    {maintFiles.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">{maintFiles.length} file(s) selected</div>
                    )}
                    {maintFileError && (
                      <div className="text-xs text-red-600 mt-1">{maintFileError}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitState.status === 'submitting' && submitState.kind === 'MAINTENANCE'}>
                      {submitState.status === 'submitting' && submitState.kind === 'MAINTENANCE' ? 'Submitting…' : 'Submit Maintenance Request'}
                    </Button>
                    {submitState.kind === 'MAINTENANCE' && submitState.status === 'error' && (
                      <div className="text-sm text-red-600">{submitState.message}</div>
                    )}
                    {submitState.kind === 'MAINTENANCE' && submitState.status === 'success' && (
                      <div className="text-sm text-green-700">{submitState.message}</div>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
