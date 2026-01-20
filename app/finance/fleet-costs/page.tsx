"use client";

import { useState, useEffect, useRef, FormEvent } from 'react'
import Link from 'next/link'
import { apiGet } from '@/app/lib/api'
import { listVehicles } from '@/app/lib/fleet-api'

interface FleetCostForm {
  date: string
  vehicleId: string
  category: string
  amount: string
  currency: string
  reference: string
  description: string
}

interface VehicleOption {
  id: string
  plate: string
  make?: string | null
  model?: string | null
}

interface FleetCostRow {
  id: string
  date: string
  amount: number
  currency: string
  category: string | null
  reference: string | null
  vehicle: {
    plate: string
    make?: string | null
    model?: string | null
  } | null
}

const COST_CATEGORIES = [
  'Fuel & Energy',
  'Maintenance & Repairs',
  'Tires',
  'Tolls & Parking',
  'Driver Wages',
  'Driver Training',
  'Fines & Penalties',
]

export default function FleetCostsPage() {
  const [form, setForm] = useState<FleetCostForm>({
    date: new Date().toISOString().slice(0, 10),
    vehicleId: '',
    category: '',
    amount: '',
    currency: 'ETB',
    reference: '',
    description: '',
  })
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [costs, setCosts] = useState<FleetCostRow[]>([])
  const [loadingCosts, setLoadingCosts] = useState(false)
  const [costsError, setCostsError] = useState<string | null>(null)
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    vehicle: '',
    category: '',
  })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = (field: keyof FleetCostForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleAttachmentChange = async (file: File | null) => {
    if (!file) return

    setAttachmentError(null)

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    const isImage = allowedImageTypes.includes(file.type)

    if (!isPdf && !isImage) {
      setAttachmentError('Only PDF or image files (JPG, PNG, WEBP) are allowed.')
      return
    }

    try {
      setAttachmentUploading(true)

      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            localStorage.getItem('token')
          : null

      const formData = new FormData()
      formData.append('file', file)

      // API is mounted under /api on the frontend
      const endpoint = isPdf ? '/api/upload/pdf' : '/api/upload/image'

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData?.message || 'Failed to upload attachment.')
      }

      const data = await res.json()
      const url = data?.url as string | undefined
      if (!url) {
        throw new Error('No URL returned from upload service.')
      }

      setForm(prev => ({
        ...prev,
        reference: url,
      }))
    } catch (err: any) {
      console.error('Failed to upload attachment', err)
      setAttachmentError(err?.message || 'Failed to upload attachment. Please try again.')
    } finally {
      setAttachmentUploading(false)
    }
  }

  // Reset to first page when filters change or data reloads
  useEffect(() => {
    setPage(1)
  }, [filters.fromDate, filters.toDate, filters.vehicle, filters.category, costs.length])

  useEffect(() => {
    let active = true
    async function loadVehicles() {
      try {
        setLoadingVehicles(true)
        const data = await listVehicles()
        if (!active) return
        const mapped: VehicleOption[] = (Array.isArray(data) ? data : []).map(v => ({
          id: v.id,
          plate: v.plate,
          make: v.make ?? null,
          model: v.model ?? null,
        }))
        setVehicles(mapped)
      } catch (err: any) {
        console.error('Failed to load vehicles for cost form', err)
      } finally {
        if (active) setLoadingVehicles(false)
      }
    }

    loadVehicles()
    return () => {
      active = false
    }
  }, [])

  const loadCosts = async () => {
    try {
      setLoadingCosts(true)
      setCostsError(null)
      const data = await apiGet<FleetCostRow[]>('/fleet/costs')
      setCosts(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Failed to load fleet costs', err)
      setCostsError('Failed to load recent cost entries.')
    } finally {
      setLoadingCosts(false)
    }
  }

  useEffect(() => {
    loadCosts()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError(null);
  setSubmitted(false);

  if (!form.date || !form.category || !form.amount || !form.currency) {
    setError('Please fill in all required fields (date, category, amount, currency).');
    return;
  }

  if (!form.vehicleId) {
    setError('Please select a vehicle.');
    return;
  }

  if (Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
    setError('Amount must be a positive number.');
    return;
  }

  try {
    setSubmitting(true);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null;

    // -----------------------------
    //  LOG EXACT BODY SENT TO API
    // -----------------------------
    const body = {
      date: form.date,
      vehicleId: form.vehicleId,
      category: form.category || null,
      amount: Number(form.amount),
      currency: form.currency || "ETB",
      reference: form.reference || null,
      description: form.description || null,
    };

    console.log("📤 Sending to backend:", body);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/fleet/costs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData?.message || "Failed to register cost.");
    }

    setSubmitted(true);
    setForm(prev => ({
      ...prev,
      vehicleId: "",
      category: "",
      amount: "",
      reference: "",
      description: "",
    }));

    // Clear selected file name from the input after successful submit
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Refresh recent cost entries so finance sees the new record immediately
    loadCosts();
  } catch (err: any) {
    console.error("Failed to register fleet cost", err);
    setError(err?.message || "Failed to register cost. Please try again.");
  } finally {
    setSubmitting(false);
  }
};

  const formatDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-GB')
  }

  const formatAmount = (amount: number, currency: string) => {
    const value = Number(amount || 0)
    const formatted = value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    return `${currency || 'ETB'} ${formatted}`
  }

  const uniqueVehiclesForFilter = Array.from(
    new Set(
      costs
        .map(c => c.vehicle?.plate || '')
        .filter(Boolean),
    ),
  )

  const uniqueCategoriesForFilter = Array.from(
    new Set(
      costs
        .map(c => c.category || '')
        .filter(Boolean),
    ),
  )

  const filteredCosts = costs.filter(cost => {
    const costDate = cost.date ? new Date(cost.date) : null

    if (filters.fromDate) {
      const from = new Date(filters.fromDate)
      if (costDate && costDate < from) return false
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate)
      if (costDate && costDate > to) return false
    }

    if (filters.vehicle) {
      if (!cost.vehicle || cost.vehicle.plate !== filters.vehicle) return false
    }

    if (filters.category) {
      if (!cost.category || cost.category !== filters.category) return false
    }

    return true
  })

  const totalRecords = filteredCosts.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE))

  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedCosts = filteredCosts.slice(startIndex, endIndex)

  const totalAmount = filteredCosts.reduce((sum, c) => sum + Number(c.amount || 0), 0)

  const totalByCategory = filteredCosts.reduce<Record<string, number>>((acc, c) => {
    const key = c.category || 'Unspecified'
    acc[key] = (acc[key] || 0) + Number(c.amount || 0)
    return acc
  }, {})

  type ReportRange = 'weekly' | 'monthly' | 'yearly'

  const handleReport = (range: ReportRange) => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let startDate: Date

    if (range === 'weekly') {
      startDate = new Date(startOfToday)
      startDate.setDate(startDate.getDate() - 6)
    } else if (range === 'monthly') {
      startDate = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1)
    } else {
      startDate = new Date(startOfToday.getFullYear(), 0, 1)
    }

    const endDate = new Date(startOfToday)
    endDate.setDate(endDate.getDate() + 1)

    let relevant: FleetCostRow[]

    if (selectedVehiclePlate) {
      // Per-vehicle report
      relevant = costs.filter(c => {
        // Match the selected vehicle by plate
        if (!c.vehicle || c.vehicle.plate !== selectedVehiclePlate) return false

        // If a category filter is active, only include that category
        if (filters.category && c.category !== filters.category) return false

        if (!c.date) return false
        const d = new Date(c.date)
        if (Number.isNaN(d.getTime())) return false
        return d >= startDate && d < endDate
      })

      // If nothing is found in the strict period, fall back to all records
      // for this vehicle (and category, if selected) so finance still sees a total.
      if (!relevant.length) {
        relevant = costs.filter(c => {
          if (!c.vehicle || c.vehicle.plate !== selectedVehiclePlate) return false
          if (filters.category && c.category !== filters.category) return false
          return true
        })
      }
    } else {
      // No vehicle selected: use the same logic as the table filters
      relevant = filteredCosts.filter(c => {
        if (!c.date) return false
        const d = new Date(c.date)
        if (Number.isNaN(d.getTime())) return false
        return d >= startDate && d < endDate
      })
    }

    if (!relevant.length) {
      alert('No records found for this period.')
      return
    }

    const currency = relevant[0]?.currency || 'ETB'

    // If a specific category filter is active, show a single total for that category
    if (filters.category) {
      const totalForCategory = relevant.reduce((sum, c) => sum + Number(c.amount || 0), 0)
      const totalFormatted = Number(totalForCategory).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })

      const title =
        range === 'weekly'
          ? 'Weekly total'
          : range === 'monthly'
          ? 'Monthly total'
          : 'Yearly total'

      const getMonthlyAmharicTitle = (category: string | undefined | null) => {
        switch (category) {
          case 'Fuel & Energy':
            return 'የነዳጅ ወጪ በወር'
          case 'Maintenance & Repairs':
            return 'ጠቅላላ የጥገና ወጪ በውር vehicles:'
          case 'Tires':
            return 'የጎማ ወጪ በወር'
          case 'Tolls & Parking':
            return 'የክፍያ እና የመኪና ማቆሚያ  ወጪ በወር'
          case 'Driver Training':
            return 'የአሽከርካሪዉ የስልጠና ወጪ በወር'
          case 'Fines & Penalties':
            return 'የሹፌር የቅጣት ወጪ በወር'
          // Driver Wages or any other category: fall back to English
          default:
            return `Monthly total for ${category ?? ''}`.trim()
        }
      }

      const firstLine =
        range === 'monthly'
          ? getMonthlyAmharicTitle(filters.category)
          : `${title} for ${filters.category}`

      const vehicleLine = selectedVehiclePlate ? `Vehicle: ${selectedVehiclePlate}\n\n` : ''

      alert(`${firstLine}\n${vehicleLine}${currency} ${totalFormatted}`)
      return
    }

    // Otherwise, show totals grouped by category for that vehicle
    const byCategory = relevant.reduce<Record<string, number>>((acc, c) => {
      const key = c.category || 'Unspecified'
      acc[key] = (acc[key] || 0) + Number(c.amount || 0)
      return acc
    }, {})

    const lines = Object.entries(byCategory).map(([cat, amount]) => {
      return `${cat}: ${currency} ${Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`
    })

    const title =
      range === 'weekly'
        ? 'Weekly report (last 7 days)'
        : range === 'monthly'
        ? 'Monthly report (this month)'
        : 'Yearly report (this year)'

    alert(`${title}\nVehicle: ${selectedVehiclePlate}\n\n${lines.join('\n')}`)
  }

  const handleExportCsv = () => {
    if (!filteredCosts.length) return

    const headers = ['Date', 'Vehicle', 'Category', 'Reference', 'Amount', 'Currency']
    const rows = filteredCosts.map(c => [
      formatDate(c.date),
      c.vehicle
        ? `${c.vehicle.plate}${
            c.vehicle.make || c.vehicle.model
              ? ` - ${[c.vehicle.make, c.vehicle.model].filter(Boolean).join(' ')}`
              : ''
          }`
        : '',
      c.category || '',
      c.reference || '',
      String(c.amount ?? ''),
      c.currency || 'ETB',
    ])

    const csv = [headers, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fleet_costs_report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Fleet Cost Registration</h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            Finance can use this form to register all fleet-related operating costs: fuel, maintenance, tires, tolls,
            driver wages, training, and fines.
          </p>
        </div>
        <Link
          href="/fleet"
          className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Fleet Hub
        </Link>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl shadow border p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}
          {submitted && !error && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded">
              Cost registered successfully.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Plate *</label>
              <select
                value={form.vehicleId}
                onChange={e => handleChange('vehicleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">
                  {loadingVehicles ? 'Loading vehicles…' : 'Select vehicle…'}
                </option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.plate}
                    {v.make ? ` - ${v.make}` : ''}
                    {v.model ? ` ${v.model}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select category…</option>
                {COST_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency *</label>
              <select
                value={form.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="ETB">ETB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Invoice / Ticket / Receipt)</label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  id="fleet-reference-file"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,image/jpg"
                  onChange={e => {
                    const file = e.target.files?.[0] || null
                    void handleAttachmentChange(file)
                  }}
                  className="hidden"
                />

                <label
                  htmlFor="fleet-reference-file"
                  className="inline-flex flex-col items-center justify-center cursor-pointer select-none rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center justify-center mb-1">
                    <span className="inline-block w-10 h-6 bg-sky-500 rounded-full relative">
                      <span className="absolute inset-x-3 -top-2 h-4 bg-sky-500 rounded-full" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-l-4 border-b-4 border-white rotate-45" />
                    </span>
                  </div>
                  <span className="text-xs font-medium text-blue-700">Upload invoice / ticket / receipt</span>
                  <span className="text-[10px] text-blue-500 mt-0.5">PDF, JPG, PNG, WEBP</span>
                </label>

                {attachmentUploading && (
                  <p className="text-xs text-gray-500">Uploading attachment…</p>
                )}

                {attachmentError && (
                  <p className="text-xs text-red-600">{attachmentError}</p>
                )}

                {form.reference && (
                  <a
                    href={form.reference}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:underline"
                  >
                    View uploaded document
                  </a>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Short description of the cost, route, driver, or other context."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setForm(prev => ({
                  ...prev,
                  vehicleId: '',
                  category: '',
                  amount: '',
                  reference: '',
                  description: '',
                }))
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
                setError(null)
                setSubmitted(false)
              }}
              disabled={submitting}
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              disabled={submitting}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
            >
              {submitting ? 'Saving…' : 'Register Cost'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow border p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900">Recent Cost Entries</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700" htmlFor="recent-costs-category-filter">
                  Category
                </label>
                <select
                  id="recent-costs-category-filter"
                  value={filters.category}
                  onChange={e =>
                    setFilters(prev => {
                      const value = e.target.value
                      // If the same category is selected again, clear the filter (show all)
                      if (value === prev.category) {
                        return {
                          ...prev,
                          category: '',
                        }
                      }

                      return {
                        ...prev,
                        category: value,
                      }
                    })
                  }
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All categories</option>
                  {COST_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                {loadingCosts && (
                  <span className="text-xs text-gray-500">Loading…</span>
                )}
                <label
                  htmlFor="recent-costs-report-range"
                  className="text-xs font-medium text-gray-700"
                >
                  Report
                </label>
                <select
                  id="recent-costs-report-range"
                  className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!filteredCosts.length}
                  onChange={e => {
                    const value = e.target.value as 'weekly' | 'monthly' | 'yearly' | ''
                    if (!value) return
                    handleReport(value)
                    e.target.value = ''
                  }}
                  defaultValue=""
                >
                  <option value="">Select period…</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!filteredCosts.length) return
                    const sampleCurrency = filteredCosts[0]?.currency || 'ETB'
                    alert(`${sampleCurrency} ${totalAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}`)
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                  disabled={!filteredCosts.length}
                >
                  ጠቅላላ ወጪ
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={!filteredCosts.length}
                >
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {costsError && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {costsError}
          </div>
        )}

        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                  <th className="px-3 py-2 w-10">
                    {/* selection column (single select) */}
                  </th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Vehicle</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCosts.map(cost => {
                  const plate = cost.vehicle?.plate || null
                  const vehicleLabel = cost.vehicle
                    ? `${cost.vehicle.plate}${
                        cost.vehicle.make || cost.vehicle.model
                          ? ` - ${[cost.vehicle.make, cost.vehicle.model].filter(Boolean).join(' ')}`
                          : ''
                      }`
                    : '-'

                  return (
                    <tr key={cost.id} className="border-b last:border-0">
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="radio"
                          name="selected-cost"
                          className="h-4 w-4"
                          checked={!!plate && selectedVehiclePlate === plate}
                          onChange={() => plate && setSelectedVehiclePlate(plate)}
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {formatDate(cost.date)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {vehicleLabel}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {cost.category ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-medium text-indigo-700">
                            {cost.category}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700">
                        {cost.reference ? (
                          (() => {
                            const ref = cost.reference as string
                            const isUrl = /^https?:\/\//i.test(ref) || ref.startsWith('/')
                            if (!isUrl) return <span>{ref}</span>

                            let downloadName = 'attachment'
                            try {
                              const url = new URL(ref, typeof window !== 'undefined' ? window.location.origin : undefined)
                              const lastSegment = url.pathname.split('/').filter(Boolean).pop()
                              if (lastSegment) downloadName = lastSegment
                            } catch {
                              // ignore URL parse errors and keep default name
                            }

                            const lowerRef = ref.toLowerCase()
                            const hasKnownExt = /\.(pdf|jpg|jpeg|png|webp)$/i.test(downloadName)
                            if (!hasKnownExt) {
                              if (lowerRef.includes('pdf_uploads')) downloadName += '.pdf'
                              else if (lowerRef.includes('image_uploads')) downloadName += '.jpg'
                            }

                            const isPdf = /\.pdf$/i.test(downloadName) || lowerRef.includes('pdf_uploads')
                            const isImage = !isPdf

                            if (isPdf) {
                              return (
                                <a
                                  href={ref}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={downloadName}
                                  className="inline-flex items-center justify-center rounded bg-teal-700 text-white px-1.5 py-0.5 text-[10px] font-medium hover:bg-teal-800"
                                >
                                  <span className="mr-1 inline-flex flex-col items-center justify-center">
                                    <span className="w-4 h-5 border border-white rounded-sm flex items-center justify-center">
                                      <span className="w-2 h-2 border-t border-l border-white rotate-45 -translate-y-0.5" />
                                    </span>
                                  </span>
                                  <span>PDF</span>
                                </a>
                              )
                            }

                            // Image (JPG/PNG/WEBP) style tile
                            const label = /\.png$/i.test(downloadName) ? 'PNG' : 'JPG'
                            return (
                              <a
                                href={ref}
                                target="_blank"
                                rel="noreferrer"
                                download={downloadName}
                                className="inline-flex flex-col items-center justify-center rounded border border-cyan-500 bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 hover:bg-cyan-100"
                              >
                                <span className="w-5 h-4 border border-cyan-500 rounded flex items-center justify-center mb-0.5">
                                  <span className="w-2 h-2 bg-cyan-500 rounded-sm" />
                                </span>
                                <span>{label}</span>
                              </a>
                            )
                          })()
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right font-semibold text-emerald-600">
                        {formatAmount(cost.amount, cost.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredCosts.length > PAGE_SIZE && (
              <div className="flex items-center justify-between mt-4 text-xs md:text-sm text-gray-700">
                <div>
                  Showing <span className="font-semibold">{startIndex + 1}</span>–
                  <span className="font-semibold">{Math.min(endIndex, totalRecords)}</span> of
                  <span className="font-semibold"> {totalRecords}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span>
                    Page <span className="font-semibold">{currentPage}</span> of
                    <span className="font-semibold"> {totalPages}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
