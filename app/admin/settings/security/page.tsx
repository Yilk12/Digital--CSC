"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

type Setting = { settingKey: string; settingValue: string }

export default function SecuritySettingsPage() {
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
      <h2>Security & Access</h2>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
          <legend style={{ padding: '0 6px' }}>Password Policy</legend>
          <label>
            <div>Minimum Length</div>
            <input
              type="number"
              min={8}
              value={settings.password_min_length || "12"}
              onChange={(e) => handleChange("password_min_length", e.target.value)}
            />
          </label>
          <label>
            <div>Require Uppercase</div>
            <select
              value={settings.password_require_uppercase || "true"}
              onChange={(e) => handleChange("password_require_uppercase", e.target.value)}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <div>Require Lowercase</div>
            <select
              value={settings.password_require_lowercase || "true"}
              onChange={(e) => handleChange("password_require_lowercase", e.target.value)}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <div>Require Number</div>
            <select
              value={settings.password_require_digit || "true"}
              onChange={(e) => handleChange("password_require_digit", e.target.value)}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <label>
            <div>Require '@' Symbol</div>
            <select
              value={settings.password_require_at || "true"}
              onChange={(e) => handleChange("password_require_at", e.target.value)}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </label>
          <div style={{ fontSize: 12, color: '#666' }}>
            Policy applies to admin-created accounts and custom password fields. Server will reject weak passwords.
          </div>
        </fieldset>
        <label>
          <div>Session Timeout (minutes)</div>
          <input
            type="number"
            value={settings.session_timeout_minutes || "30"}
            onChange={(e) => handleChange("session_timeout_minutes", e.target.value)}
          />
        </label>

        <label>
          <div>IP Whitelist (comma-separated)</div>
          <input
            value={settings.ip_whitelist || ""}
            onChange={(e) => handleChange("ip_whitelist", e.target.value)}
          />
        </label>

        <label>
          <div>IP Blacklist (comma-separated)</div>
          <input
            value={settings.ip_blacklist || ""}
            onChange={(e) => handleChange("ip_blacklist", e.target.value)}
          />
        </label>

        <label>
          <div>Audit Logs Enabled</div>
          <select
            value={settings.audit_logs_enabled || "true"}
            onChange={(e) => handleChange("audit_logs_enabled", e.target.value)}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </label>

        <label>
          <div>Audit Log Retention (days)</div>
          <input
            type="number"
            value={settings.audit_log_retention_days || "180"}
            onChange={(e) => handleChange("audit_log_retention_days", e.target.value)}
          />
        </label>

        <label>
          <div>Data Encryption Enabled</div>
          <select
            value={settings.data_encryption_enabled || "true"}
            onChange={(e) => handleChange("data_encryption_enabled", e.target.value)}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
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


