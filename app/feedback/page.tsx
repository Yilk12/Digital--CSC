"use client"

import React, { useEffect, useMemo, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

// Map UI roles to backend enum values
const RoleMap = {
  USER: "END_USER",
  DEPARTMENT_HEAD: "STAFF_MANAGER",
  GENERAL_MANAGER: "GENERAL_DIRECTOR",
} as const

type UiRole = keyof typeof RoleMap

type Department = { id: string; name: string; nameAm?: string | null }

type FeedbackType = "TICKET" | "KB" | "SERVICE"

type EscalationPriority = "LOW" | "MEDIUM" | "HIGH"

type DeptOption = { id: string; label: string }

export default function FeedbackPage() {
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<DeptOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [roleAuto, setRoleAuto] = useState(true)
  const [role, setRole] = useState<UiRole | "">("")
  const [departmentId, setDepartmentId] = useState("")
  const [category, setCategory] = useState<string>("Complaint")
  const [reportType, setReportType] = useState<"ANONYMOUS" | "IDENTIFIED" | "THIRD_PARTY" | "">("")
  const [rating, setRating] = useState<number | "">("")
  const [helpful, setHelpful] = useState<boolean | "">("")
  const [comments, setComments] = useState("")
  const [anonymous, setAnonymous] = useState(false)
  const [attachmentPath, setAttachmentPath] = useState("") // placeholder

  // Role-specific fields
  const [experienceClarity, setExperienceClarity] = useState<boolean | "">("")
  const [resolutionOutcome, setResolutionOutcome] = useState<boolean | "">("")

  const [departmentImpact, setDepartmentImpact] = useState("")
  const [processTrainingImprovements, setProcessTrainingImprovements] = useState("")

  const [strategicImpact, setStrategicImpact] = useState("")
  const [escalationPriority, setEscalationPriority] = useState<EscalationPriority | "">("")

  // Simple feedback stats for commissioner/authorized users
  const [totalFeedback, setTotalFeedback] = useState<number | null>(null)
  const [complaintsCount, setComplaintsCount] = useState<number | null>(null)
  const [suggestionsCount, setSuggestionsCount] = useState<number | null>(null)

  const effectiveBackendRole = useMemo(() => {
    if (roleAuto) return undefined // backend will use req.user.role if authenticated
    if (!role) return undefined
    return RoleMap[role]
  }, [roleAuto, role])

  useEffect(() => {
    let cancelled = false
    async function loadDepartments() {
      try {
        const list = (await apiGet<Department[]>("/feedback/departments")).map((d) => ({
          id: d.id,
          label: d.name,
        }))
        if (!cancelled) setDepartments(list)
      } catch (e) {
        if (!cancelled) setError("Failed to load departments")
      }
    }
    loadDepartments()
    return () => {
      cancelled = true
    }
  }, [])

  // Load basic feedback stats (if user is authorized, e.g. Commissioner/Admin)
  useEffect(() => {
    let cancelled = false

    async function loadFeedbackStats() {
      try {
        const items = await apiGet<any[]>("/feedback")
        if (cancelled || !Array.isArray(items)) return

        const total = items.length
        const complaints = items.filter((f) => f?.category === "Complaint").length
        const suggestions = items.filter((f) => f?.category === "Suggestion").length

        setTotalFeedback(total)
        setComplaintsCount(complaints)
        setSuggestionsCount(suggestions)
      } catch {
        // Silently ignore if unauthorized; page still works as a submission form
      }
    }

    loadFeedbackStats()
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!departmentId) {
      setError("Please select a department")
      return
    }

    const payload: any = {
      type: "GENERAL",
      departmentId,
      comments: comments || undefined,
      anonymous,
    }

    // rating/helpful
    if (rating !== "") payload.rating = Number(rating)
    if (helpful !== "") payload.helpful = Boolean(helpful)

    // optional attachment path placeholder
    if (attachmentPath.trim()) payload.attachmentPath = attachmentPath.trim()

    // role override (if not auto)
    if (effectiveBackendRole) {
      payload.role = effectiveBackendRole
    } else if (roleAuto) {
      // When using auto-detect, the backend createFeedback endpoint still
      // requires a role in the DTO because it does not use JWT auth.
      // Default to END_USER, which matches the backend UserRole enum.
      payload.role = "END_USER"
    }

    // role-specific fields
    if (!roleAuto && role === "USER") {
      if (experienceClarity !== "") payload.experienceClarity = Boolean(experienceClarity)
      if (resolutionOutcome !== "") payload.resolutionOutcome = Boolean(resolutionOutcome)
    }
    if (!roleAuto && role === "DEPARTMENT_HEAD") {
      if (departmentImpact.trim()) payload.departmentImpact = departmentImpact.trim()
      if (processTrainingImprovements.trim()) payload.processTrainingImprovements = processTrainingImprovements.trim()
    }
    if (!roleAuto && role === "GENERAL_MANAGER") {
      if (strategicImpact.trim()) payload.strategicImpact = strategicImpact.trim()
      if (escalationPriority !== "") payload.escalationPriority = escalationPriority
    }

    // NOTE: For now, category/reportType are used only in the UI and not sent
    // to the backend, because CreateFeedbackDto does not define these fields
    // and the validation pipeline rejects unknown properties.

    // Entity linkage (optional via comments or future UI)
    // payload.articleId or payload.ticketId can be added if you wire selections

    setLoading(true)
    try {
      await apiPost("/feedback", payload)
      setSuccess("Feedback submitted. Thank you!")
      // reset minimal fields
      setComments("")
      setRating("")
      setHelpful("")
      setAttachmentPath("")
      setExperienceClarity("")
      setResolutionOutcome("")
      setDepartmentImpact("")
      setProcessTrainingImprovements("")
      setStrategicImpact("")
      setEscalationPriority("")
      setReportType("")
    } catch (e: any) {
      setError(e?.message || "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">ግብረ መልስ ይላኩ</h1>
      <p className="text-gray-600 mb-6">Help us improve by sharing your experience. Your feedback is routed to the right department and visible only to department heads, general managers, and administrators.</p>

      {/* Summary cards (shown when stats are available) */}
      {(typeof totalFeedback === "number" || typeof complaintsCount === "number" || typeof suggestionsCount === "number") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {typeof totalFeedback === "number" && totalFeedback > 0 && (
            <div className="bg-white rounded-xl shadow-sm border flex items-center justify-between px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-purple-500" />
              <div className="relative flex flex-col">
                <span className="text-sm font-semibold text-amber-500 mb-1">ጠቅላላ የተመዘገቡ ግብረ መልሶች</span>
                <span className="text-3xl font-bold text-gray-800">{totalFeedback}</span>
              </div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 text-purple-500">
                <span className="text-lg">📋</span>
              </div>
            </div>
          )}

          {typeof complaintsCount === "number" && complaintsCount > 0 && (
            <div className="bg-white rounded-xl shadow-sm border flex items-center justify-between px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-red-500" />
              <div className="relative flex flex-col">
                <span className="text-sm font-semibold text-amber-500 mb-1">የቅሬታ ግብረ መልሶች</span>
                <span className="text-3xl font-bold text-gray-800">{complaintsCount}</span>
              </div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-500">
                <span className="text-lg">📋</span>
              </div>
            </div>
          )}

          {typeof suggestionsCount === "number" && suggestionsCount > 0 && (
            <div className="bg-white rounded-xl shadow-sm border flex items-center justify-between px-6 py-4 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1 bg-blue-500" />
              <div className="relative flex flex-col">
                <span className="text-sm font-semibold text-amber-500 mb-1">የሃሳብ አስተያየቶች</span>
                <span className="text-3xl font-bold text-gray-800">{suggestionsCount}</span>
              </div>
              <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-500">
                <span className="text-lg">📋</span>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Role selection */}
        <section className="space-y-2">
          <h2 className="font-medium">Role</h2>
          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={roleAuto} onChange={(e) => setRoleAuto(e.target.checked)} />
              <span>Auto-detect (use my logged-in role)</span>
            </label>
          </div>
          {!roleAuto && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <label className="inline-flex items-center gap-2 p-2 border rounded w-full sm:w-auto">
                <input type="radio" name="role" checked={role === "USER"} onChange={() => setRole("USER")} />
                <span>User</span>
              </label>
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="role" checked={role === "DEPARTMENT_HEAD"} onChange={() => setRole("DEPARTMENT_HEAD")} />
                <span>ዋና የስራ ክፍል</span>
              </label>
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="role" checked={role === "GENERAL_MANAGER"} onChange={() => setRole("GENERAL_MANAGER")} />
                <span>ኮሚሽነር</span>
              </label>
            </div>
          )}
        </section>

        {/* Department */}
        <section className="space-y-2">
          <h2 className="font-medium">ዋና የስራ ክፍል</h2>
          <select
            className="w-full border rounded p-2 bg-white"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            <option value="" disabled>
              ዋና የስራ ክፍል ይምረጡ
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </section>

        {/* Feedback details */}
        <section className="space-y-4">
          <div>
            <h2 className="font-medium">አይነት</h2>
            <select
              className="w-full border rounded p-2 bg-white mt-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Suggestion">አስተያየት</option>
              <option value="Complaint">ሌሎች ጥቆማዎች</option>
              <option value="Sexual Assault">የፆታዊ ጥቃት ጥቆማ መስጫ</option>
            </select>
            {category === "Sexual Assault" && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-teal-400 text-white">
                <h3 className="text-lg font-semibold mb-3">የፆታዊ ጥቃት ጥቆማዎን ይፃፉ</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setReportType("ANONYMOUS")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      reportType === "ANONYMOUS"
                        ? "bg-white text-blue-600 border-white"
                        : "bg-blue-600/70 hover:bg-blue-600 border-blue-100/60"
                    }`}
                  >
                    አመልካች
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("IDENTIFIED")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      reportType === "IDENTIFIED"
                        ? "bg-white text-blue-600 border-white"
                        : "bg-white/10 hover:bg-white/20 border-white/40"
                    }`}
                  >
                    የተመዘገቡ ሪፖርቶች
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType("THIRD_PARTY")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                      reportType === "THIRD_PARTY"
                        ? "bg-white text-blue-600 border-white"
                        : "bg-white/10 hover:bg-white/20 border-white/40"
                    }`}
                  >
                    የሶስተኛ ወገን ሪፖርት 
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-medium">Rating (1–5)</h2>
            <select className="w-full border rounded p-2 bg-white" value={rating} onChange={(e) => setRating(e.target.value ? Number(e.target.value) : "")}> 
              <option value="">No rating</option>
              {[1,2,3,4,5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div>
            <h2 className="font-medium">Helpful?</h2>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <label className="inline-flex items-center gap-2 p-2 border rounded w-full sm:w-auto">
                <input type="radio" name="helpful" checked={helpful === true} onChange={() => setHelpful(true)} />
                <span>Yes</span>
              </label>
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="helpful" checked={helpful === false} onChange={() => setHelpful(false)} />
                <span>No</span>
              </label>
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="helpful" checked={helpful === ""} onChange={() => setHelpful("")} />
                <span>Not specified</span>
              </label>
            </div>
          </div>

          <div>
            <h2 className="font-medium">ኮሜንትስ</h2>
            <textarea
              className="w-full border rounded p-2"
              placeholder="Share any details to help us improve"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>

          <div>
            <h2 className="font-medium">Attachment</h2>
            <input
              className="w-full border rounded p-2"
              type="text"
              placeholder="Attachment path or link (optional)"
              value={attachmentPath}
              onChange={(e) => setAttachmentPath(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">File upload endpoint can be added next. For now, paste a path or link if needed.</p>
          </div>

          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span>Submit without showing my name</span>
          </label>
        </section>

        {/* Role-specific sections */}
        {!roleAuto && role === "USER" && (
          <section className="space-y-3">
            <h2 className="font-medium">User Experience</h2>
            <label className="inline-flex items-center gap-2 p-2 border rounded">
              <input type="checkbox" checked={experienceClarity === true} onChange={(e) => setExperienceClarity(e.target.checked ? true : "")} />
              <span>Was the solution clear?</span>
            </label>
            <label className="inline-flex items-center gap-2 p-2 border rounded">
              <input type="checkbox" checked={resolutionOutcome === true} onChange={(e) => setResolutionOutcome(e.target.checked ? true : "")} />
              <span>Was your issue solved?</span>
            </label>
          </section>
        )}

        {!roleAuto && role === "DEPARTMENT_HEAD" && (
          <section className="space-y-3">
            <h2 className="font-medium">Department Head Insights</h2>
            <div>
              <label className="block mb-1">Impact on team performance</label>
              <textarea className="w-full border rounded p-2" rows={3} value={departmentImpact} onChange={(e) => setDepartmentImpact(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Suggest process/training improvements</label>
              <textarea className="w-full border rounded p-2" rows={3} value={processTrainingImprovements} onChange={(e) => setProcessTrainingImprovements(e.target.value)} />
            </div>
          </section>
        )}

        {!roleAuto && role === "GENERAL_MANAGER" && (
          <section className="space-y-3">
            <h2 className="font-medium">General Manager Review</h2>
            <div>
              <label className="block mb-1">Business impact</label>
              <textarea className="w-full border rounded p-2" rows={3} value={strategicImpact} onChange={(e) => setStrategicImpact(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1">Escalation priority</label>
              <select className="w-full border rounded p-2 bg-white" value={escalationPriority} onChange={(e) => setEscalationPriority(e.target.value as EscalationPriority | "")}> 
                <option value="">Select priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </section>
        )}

        {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}
        {success && <div className="p-3 rounded bg-green-50 text-green-700 border border-green-200">{success}</div>}

        <div className="flex justify-end gap-3 mt-4">
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  )
}
