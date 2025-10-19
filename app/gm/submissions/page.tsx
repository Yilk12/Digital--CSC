"use client"

import React, { useEffect, useState } from "react"
import { useLocalization } from "@/hooks/use-localization"

type Submission = {
  id: string
  createdAt: string
  updatedAt: string
  userId?: string | null
  submitterName?: string | null
  submitterDepartment?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  anonymous: boolean
  type: "COMPLAINT" | "SUGGESTION"
  subject: string
  description: string
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "ESCALATED" | "MORE_INFO_REQUESTED" | "CLOSED"
}

type Filter = {
  type?: Submission["type"] | ""
  status?: Submission["status"] | ""
}

export default function GMSubmissionsPage() {
  const { t } = useLocalization()
  const [filters, setFilters] = useState<Filter>({ type: "", status: "" })
  const [items, setItems] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string>("")

  const load = async () => {
    setLoading(true)
    setMsg("")
    try {
      const qs = new URLSearchParams()
      if (filters.type) qs.set("type", filters.type)
      if (filters.status) qs.set("status", filters.status)
      const res = await fetch(`/api/submissions${qs.toString() ? `?${qs}` : ""}`, { cache: "no-store" })
      if (!res.ok) throw new Error(`Load failed: ${res.status}`)
      const data = await res.json()
      setItems(data)
    } catch (e: any) {
      setMsg(e?.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((f) => ({ ...f, [name]: value }))
  }

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    load()
  }

  const act = async (id: string, action: "ACCEPT"|"REJECT"|"ESCALATE"|"MORE_INFO_REQUEST"|"CLOSE") => {
    setLoading(true)
    setMsg("")
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error(`Action failed: ${res.status}`)
      await load()
    } catch (e: any) {
      setMsg(e?.message || "Failed to act")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{t("gm_submissions.title")}</h1>

        <form onSubmit={applyFilters} className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("gm_submissions.filters.type")}</label>
            <select name="type" value={filters.type} onChange={onFilterChange} className="border border-gray-300 rounded-md p-2 bg-white">
              <option value="">{t("common.all")}</option>
              <option value="COMPLAINT">{t("submissions.type.complaint")}</option>
              <option value="SUGGESTION">{t("submissions.type.suggestion")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t("gm_submissions.filters.status")}</label>
            <select name="status" value={filters.status} onChange={onFilterChange} className="border border-gray-300 rounded-md p-2 bg-white">
              <option value="">{t("common.all")}</option>
              <option value="SUBMITTED">{t("submissions.status.SUBMITTED")}</option>
              <option value="ACCEPTED">{t("submissions.status.ACCEPTED")}</option>
              <option value="REJECTED">{t("submissions.status.REJECTED")}</option>
              <option value="ESCALATED">{t("submissions.status.ESCALATED")}</option>
              <option value="MORE_INFO_REQUESTED">{t("submissions.status.MORE_INFO_REQUESTED")}</option>
              <option value="CLOSED">{t("submissions.status.CLOSED")}</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 border rounded-md bg-white">{t("common.apply")}</button>
        </form>

        {loading && <p className="text-sm">...</p>}
        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <div className="grid grid-cols-1 gap-4">
          {items.map((s) => (
            <div key={s.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="text-xs text-gray-500">{s.type} • {new Date(s.createdAt).toLocaleString()} • {t(`submissions.status.${s.status}`)}</div>
                  <div className="font-semibold">{s.subject}</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{s.description}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {s.anonymous ? t("common.anonymous") : (s.submitterName || s.userId || "")}{s.submitterDepartment ? ` • ${s.submitterDepartment}` : ""}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button className="px-3 py-1 border rounded" onClick={() => act(s.id, "ACCEPT")}>{t("gm_submissions.actions.accept")}</button>
                  <button className="px-3 py-1 border rounded" onClick={() => act(s.id, "REJECT")}>{t("gm_submissions.actions.reject")}</button>
                  <button className="px-3 py-1 border rounded" onClick={() => act(s.id, "ESCALATE")}>{t("gm_submissions.actions.escalate")}</button>
                  <button className="px-3 py-1 border rounded" onClick={() => act(s.id, "MORE_INFO_REQUEST")}>{t("gm_submissions.actions.more_info")}</button>
                  <button className="px-3 py-1 border rounded" onClick={() => act(s.id, "CLOSE")}>{t("gm_submissions.actions.close")}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
