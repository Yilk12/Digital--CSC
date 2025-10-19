"use client"
import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/app/lib/api"

type Setting = { settingKey: string; settingValue: string }

export default function BackupDataSettingsPage() {
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
      <h2>Backup & Data</h2>
      {loading ? <p>Loading...</p> : null}
      {error ? <p style={{ color: "red" }}>{error}</p> : null}

      <div style={{ display: "grid", gap: 12, maxWidth: 640 }}>
        <label>
          <div>Backup Schedule</div>
          <select value={settings.backup_schedule || "manual"} onChange={(e) => handleChange("backup_schedule", e.target.value)}>
            <option value="manual">Manual</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <label>
          <div>Export Formats</div>
          <input value={settings.export_formats || "CSV,JSON,Excel"} onChange={(e) => handleChange("export_formats", e.target.value)} />
        </label>

        <label>
          <div>Data Retention (days)</div>
          <input type="number" value={settings.data_retention_days || "365"} onChange={(e) => handleChange("data_retention_days", e.target.value)} />
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


