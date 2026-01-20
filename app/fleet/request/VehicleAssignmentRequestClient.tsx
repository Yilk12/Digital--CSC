"use client"

import React from "react"
import Link from "next/link"
import { getCurrentUserId } from "@/app/lib/auth"
import { useLocalization } from "@/app/hooks/use-localization"
import { useToast } from "@/app/components/toast-provider"
import FleetRequestForms from "@/app/components/fleet/fleet-request-forms"

export default function VehicleAssignmentRequestClient() {
  const { t } = useLocalization()
  const [isClient, setIsClient] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const [successId, setSuccessId] = React.useState<string>("")
  const [token, setToken] = React.useState<string>("")

  const [history, setHistory] = React.useState<any[]>([])
  const [historyLoading, setHistoryLoading] = React.useState(false)
  const [seenStatusKeys, setSeenStatusKeys] = React.useState<Record<string, boolean>>({})
  const [historyPage, setHistoryPage] = React.useState(1)
  const { show: toast } = useToast()

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const [form, setForm] = React.useState({
    purpose: "",
    tripType: "",
    destination: "",
    date: new Date().toISOString().slice(0, 10),
    fromDate: "",
    toDate: "",
    startTime: "",
    endTime: "",
    durationType: "",
    notes: "",
  })

  React.useEffect(() => {
    const storedToken =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("token") ||
      ""
    setToken(storedToken)
  }, [])

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const formatTime12h = (time?: string | null) => {
    if (!time) return "-"
    try {
      const [hStr, mStr = "00"] = String(time).split(":")
      const h = parseInt(hStr, 10)
      if (Number.isNaN(h)) return String(time)
      const suffix = h >= 12 ? "PM" : "AM"
      const hour12 = ((h + 11) % 12) + 1
      const hh = hour12.toString().padStart(2, "0")
      const mm = mStr.padStart(2, "0")
      return `${hh}:${mm} ${suffix}`
    } catch {
      return String(time)
    }
  }

  const getTotalHours = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-"
    try {
      const [sh, sm = "0"] = String(start).split(":")
      const [eh, em = "0"] = String(end).split(":")
      const startMin = parseInt(sh, 10) * 60 + parseInt(sm, 10)
      const endMin = parseInt(eh, 10) * 60 + parseInt(em, 10)
      if ([startMin, endMin].some((v) => Number.isNaN(v))) return "-"
      let diff = endMin - startMin
      if (diff < 0) diff += 24 * 60
      const hours = diff / 60
      return hours.toFixed(2)
    } catch {
      return "-"
    }
  }

  const getRequesterName = (item: any) => {
    const r = item?.requestor || item?.requester
    if (!r) return "-"
    const parts = [r.firstName, r.middleName, r.lastName].filter(Boolean)
    const full = parts.join(" ").trim()
    return full || "-"
  }

  const loadHistory = React.useCallback(async () => {
    if (!token) return
    try {
      setHistoryLoading(true)
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/requests/my-requests`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Failed to load request history: ${res.status}`)
      const data = await res.json()
      const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
      setHistory(items)
      setSeenStatusKeys((prev) => {
        const next: Record<string, boolean> = { ...prev }
        for (const it of items) {
          const key = `${it.id || ""}:${it.status || ""}`
          if (key) next[key] = true
        }
        return next
      })
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [token])

  React.useEffect(() => {
    if (!token) return
    const id = setInterval(async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/requests/my-requests`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json().catch(() => ({}))
        const items = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : []
        const changes: any[] = []
        const nextSeen: Record<string, boolean> = { ...seenStatusKeys }
        for (const it of items) {
          const key = `${it.id || ""}:${it.status || ""}`
          if (!key) continue
          if (!nextSeen[key]) {
            nextSeen[key] = true
            const status = String(it.status || "").toUpperCase()
            if (status && status !== "PENDING") {
              changes.push(it)
            }
          }
        }
        if (changes.length > 0) {
          setSeenStatusKeys(nextSeen)
          for (const item of changes) {
            const statusLabel = String(item.status || "").toUpperCase() || "UPDATED"
            toast({
              title: "Fleet request updated",
              description: `Your request "${item.purpose || item.destination || ""}" is now ${statusLabel}.`,
              variant: "default",
            })
          }
          try {
            await loadHistory()
          } catch {}
        }
      } catch {}
    }, 15000)
    return () => clearInterval(id)
  }, [token, seenStatusKeys, loadHistory, toast])

  React.useEffect(() => {
    if (token) {
      loadHistory()
    }
  }, [loadHistory, token])

  React.useEffect(() => {
    // Reset to first page whenever history changes
    setHistoryPage(1)
  }, [history.length])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccessId("")
    try {
      const requestorId = getCurrentUserId()
      if (!requestorId) throw new Error("User not authenticated")
      if (!token) throw new Error("No authentication token found")
      const requiredFields = ["purpose", "destination", "date"]
      const missingFields = requiredFields.filter((field) => !form[field as keyof typeof form])
      if (missingFields.length > 0) {
        throw new Error(`Please fill all required fields: ${missingFields.join(", ")}`)
      }
      const payload = {
        requestorId,
        purpose: form.purpose?.trim() || "",
        tripType: form.tripType || "",
        destination: form.destination?.trim() || "",
        durationType: form.durationType || undefined,
        fromDate: form.fromDate || form.date,
        toDate: form.toDate || form.date,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
      }
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/fleet/fleet-requests`
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      const responseText = await res.text()
      let responseData: any
      try {
        responseData = JSON.parse(responseText)
      } catch {
        responseData = { message: responseText }
      }
      if (!res.ok) {
        let errorMessage = "Failed to submit request"
        if (responseData?.message) errorMessage = responseData.message
        else if (responseData?.error) errorMessage = responseData.error
        else if (res.status === 401) errorMessage = "Authentication failed. Please log in again."
        else if (res.status === 400) errorMessage = "Invalid request data. Please check your input."
        throw new Error(errorMessage)
      }
      const createdId = responseData?.id || ""
      setSuccessId(createdId)
      await loadHistory()
      setForm((f) => ({
        ...f,
        purpose: "",
        tripType: "",
        destination: "",
        fromDate: "",
        toDate: "",
        startTime: "",
        endTime: "",
        durationType: "",
        notes: "",
      }))
    } catch (err: any) {
      setError(err?.message || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const [tab, setTab] = React.useState<string | null>(null)
  const historyPageSize = 10

  const historyTotalPages = React.useMemo(() => {
    if (!history.length) return 1
    return Math.max(1, Math.ceil(history.length / historyPageSize))
  }, [history.length])

  const paginatedHistory = React.useMemo(() => {
    if (!history.length) return []
    const safePage = Math.min(Math.max(historyPage, 1), historyTotalPages)
    const start = (safePage - 1) * historyPageSize
    return history.slice(start, start + historyPageSize)
  }, [history, historyPage, historyTotalPages])

  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const sp = new URLSearchParams(window.location.search)
      setTab(sp.get("tab"))
    } catch {}
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      {tab === "fuel" || tab === "maintenance" ? (
        <FleetRequestForms initialTab={tab as "fuel" | "maintenance"} driverId={null} />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-center">
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold">የተሽከርካሪ መጠየቂያ ቅፅ</h1>
              <p className="text-sm text-gray-600"></p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>
          )}
          {successId && (
            <div className="mb-4 p-3 border border-green-200 bg-green-50 text-green-700 rounded">
              Request submitted successfully. Reference ID: <span className="font-mono">{successId}</span>
            </div>
          )}

          <div className="bg-white rounded-lg shadow border mb-8">
            <form onSubmit={onSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fleet.request.trip_purpose")}
                  </label>
                  <input
                    type="text"
                    value={form.purpose}
                    onChange={(e) => update("purpose", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fleet.request.trip_type")}
                  </label>
                  <input
                    type="text"
                    value={form.tripType}
                    onChange={(e) => update("tripType", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fleet.request.destination")}
                  </label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => update("destination", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t("fleet.request.destination_ph")}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("fleet.request.date")}
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time (optional)</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => update("startTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time (optional)</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => update("endTime", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("fleet.request.notes")}
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t("fleet.request.notes_ph")}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Link
                  href="/fleet"
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {t("fleet.request.cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !token}
                  className={`px-4 py-2 rounded-lg text-white ${
                    submitting || !token ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitting ? t("fleet.common.loading") : t("fleet.request.submit")}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-medium">My Fleet Request History</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {}}
                  disabled={history.length === 0}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Export to PDF
                </button>
              </div>
            </div>
            <div className="p-6">
              {historyLoading && (
                <p className="text-sm text-gray-500 mb-2">Loading your requests...</p>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full border text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-left">Purpose</th>
                      <th className="border px-3 py-2 text-left">Trip Type</th>
                      <th className="border px-3 py-2 text-left">Destination</th>
                      <th className="border px-3 py-2 text-left">Requester Name</th>
                      <th className="border px-3 py-2 text-left">Start Time</th>
                      <th className="border px-3 py-2 text-left">End Time</th>
                      <th className="border px-3 py-2 text-left">Total Hours</th>
                      <th className="border px-3 py-2 text-left">Status</th>
                      <th className="border px-3 py-2 text-left">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td className="border px-3 py-4 text-center text-gray-500" colSpan={8}>
                          {historyLoading ? "Loading..." : "No fleet requests found."}
                        </td>
                      </tr>
                    ) : (
                      paginatedHistory.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-gray-50">
                          <td className="border px-3 py-2 align-top">{item.purpose || "-"}</td>
                          <td className="border px-3 py-2 align-top">{item.tripType || "-"}</td>
                          <td className="border px-3 py-2 align-top">{item.destination || "-"}</td>
                          <td className="border px-3 py-2 align-top">{getRequesterName(item)}</td>
                          <td className="border px-3 py-2 align-top">{formatTime12h(item.startTime)}</td>
                          <td className="border px-3 py-2 align-top">{formatTime12h(item.endTime)}</td>
                          <td className="border px-3 py-2 align-top">{getTotalHours(item.startTime, item.endTime)}</td>
                          <td className="border px-3 py-2 align-top">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.status === "APPROVED"
                                  ? "bg-green-100 text-green-800"
                                  : item.status === "REJECTED"
                                  ? "bg-red-100 text-red-800"
                                  : item.status === "PENDING"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.status || "PENDING"}
                            </span>
                          </td>
                          <td className="border px-3 py-2 align-top">
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {history.length > 0 && (
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
                    <div>
                      {(() => {
                        const from = (historyPage - 1) * historyPageSize + 1
                        const to = Math.min(historyPage * historyPageSize, history.length)
                        return `Showing ${from}-${to} of ${history.length}`
                      })()}
                    </div>
                    <div className="inline-flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                        disabled={historyPage <= 1}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <span>
                        Page {historyPage} of {historyTotalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                        disabled={historyPage >= historyTotalPages}
                        className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
