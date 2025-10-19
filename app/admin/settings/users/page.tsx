"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

type Setting = { settingKey: string; settingValue: string }

export default function UsersRolesSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await apiGet<Setting[]>("/settings")
        const map: Record<string, string> = {}
        list.forEach((s) => (map[s.settingKey] = s.settingValue))
        setSettings(map)
      } catch (e: any) {
        setError(e?.message || "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await apiPost("/settings/bulk", settings)
      alert("Saved")
    } catch (e: any) {
      setError(e?.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h2>Users & Roles</h2>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <label>
          <div>Enable User Registration</div>
          <select
            value={settings.enable_registration || "true"}
            onChange={(e) => handleChange("enable_registration", e.target.value)}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <label>
          <div>Password min length</div>
          <input
            type="number"
            value={settings.password_min_length || "8"}
            onChange={(e) => handleChange("password_min_length", e.target.value)}
          />
        </label>

        <label>
          <div>Password requires complexity</div>
          <select
            value={settings.password_require_complexity || "true"}
            onChange={(e) => handleChange("password_require_complexity", e.target.value)}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label>
          <div>Password expiration (days)</div>
          <input
            type="number"
            value={settings.password_expiration_days || "90"}
            onChange={(e) => handleChange("password_expiration_days", e.target.value)}
          />
        </label>

        <label>
          <div>MFA Enabled</div>
          <select
            value={settings.mfa_enabled || "false"}
            onChange={(e) => handleChange("mfa_enabled", e.target.value)}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <label>
          <div>Email verification required</div>
          <select
            value={settings.email_verification_required || "true"}
            onChange={(e) => handleChange("email_verification_required", e.target.value)}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}


