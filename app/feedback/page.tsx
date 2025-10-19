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
  const [type, setType] = useState<FeedbackType>("TICKET")
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!departmentId) {
      setError("Please select a department")
      return
    }

    const payload: any = {
      type,
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
    if (effectiveBackendRole) payload.role = effectiveBackendRole

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
    } catch (e: any) {
      setError(e?.message || "Failed to submit feedback")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Submit Feedback</h1>
      <p className="text-gray-600 mb-6">Help us improve by sharing your experience. Your feedback is routed to the right department and visible only to department heads, general managers, and administrators.</p>

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
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="role" checked={role === "USER"} onChange={() => setRole("USER")} />
                <span>User</span>
              </label>
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="role" checked={role === "DEPARTMENT_HEAD"} onChange={() => setRole("DEPARTMENT_HEAD")} />
                <span>Department Head</span>
              </label>
              <label className="inline-flex items-center gap-2 p-2 border rounded">
                <input type="radio" name="role" checked={role === "GENERAL_MANAGER"} onChange={() => setRole("GENERAL_MANAGER")} />
                <span>General Manager</span>
              </label>
            </div>
          )}
        </section>

        {/* Department */}
        <section className="space-y-2">
          <h2 className="font-medium">Department</h2>
          <select
            className="w-full border rounded p-2 bg-white"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            <option value="" disabled>
              Select a department
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
            <h2 className="font-medium">Feedback Type</h2>
            <div className="flex flex-wrap gap-3 mt-2">
              {(["TICKET", "KB", "SERVICE"] as FeedbackType[]).map((t) => (
                <label key={t} className="inline-flex items-center gap-2 p-2 border rounded">
                  <input type="radio" name="type" checked={type === t} onChange={() => setType(t)} />
                  <span>{t === "KB" ? "Knowledge Base" : t === "SERVICE" ? "Service/Process" : "Ticket"}</span>
                </label>
              ))}
            </div>
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
            <div className="flex gap-3 mt-2">
              <label className="inline-flex items-center gap-2 p-2 border rounded">
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
            <h2 className="font-medium">Comments</h2>
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

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  )
}
