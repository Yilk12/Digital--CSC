"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Textarea } from "@/app/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Card, CardContent } from "@/app/components/ui/card"
import { Upload, X } from "lucide-react"
import { useToast } from "@/app/components/toast-provider"
import { useLocalization } from "@/app/hooks/use-localization"

interface TicketFormProps {
  onClose: () => void
  onCreated?: () => void
}

export function TicketForm({ onClose, onCreated }: TicketFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    category: "",
    priority: "",
    attachments: [] as File[],
  })

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)
  const { currentLanguage, t } = useLocalization()
  const language: "en" | "am" = currentLanguage === "am" ? "am" : "en"
  const { show: toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ✅ Load departments from your backend
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoadingDepts(true)
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") ||
              localStorage.getItem("jwt") ||
              localStorage.getItem("token")
            : null

       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments?page=1&limit=1000`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error(`Failed to load departments (${res.status})`)
        const data = await res.json()

        // Normalize structure
        const list = Array.isArray(data)
          ? data
          : data.items || data.departments || []

        setDepartments(list.map((d: any) => ({ id: d.id, name: d.name })))
      } catch (err) {
        console.error("Failed to fetch departments:", err)
      } finally {
        setLoadingDepts(false)
      }
    }

    loadDepartments()
  }, [])

  const categories = [
    { value: "incident", label: "Incident" },
    { value: "request", label: "Request" },
    { value: "problem", label: "Problem" },
    { value: "change", label: "Change" },
  ]

  const priorities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
  ]

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, ...files] }))
  }

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  const priorityMap: Record<string, string> = {
    low: "LOW",
    medium: "MEDIUM",
    high: "HIGH",
    urgent: "URGENT",
  }

  const categoryMap: Record<string, string> = {
    incident: "INCIDENT",
    request: "REQUEST",
    problem: "PROBLEM",
    change: "CHANGE",
  }

  const payload = {
    title: formData.title,
    description: formData.description,
    priority: priorityMap[formData.priority] || "MEDIUM",
    category: categoryMap[formData.category] || "REQUEST",
    departmentName: formData.department, // must be correct spelling
  }

  try {
    console.log("this is your payload", payload)
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      throw new Error(errorData?.message || `Create failed: ${res.status}`)
    }

    toast({
      title: language === "en" ? "Success" : "ተሳክቷል",
      description:
        language === "en"
          ? "Ticket created successfully"
          : "ትኬት በተሳካ ሁኔታ ተፈጥሯል",
    })

    onCreated?.()
    onClose()
  } catch (err: any) {
    console.error("Ticket creation failed:", err)
    toast({
      title: language === "en" ? "Error" : "አስተካክል አልተሳካም",
      description: err?.message || (language === "en" ? "Failed to create ticket" : "ትኬት መፍጠር አልተሳካም"),
    })
  }
}


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t("tickets.form.subject_label")}</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t("tickets.form.subject_placeholder")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">{t("tickets.form.department_label")}</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData({ ...formData, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingDepts ? t("tickets.form.loading") : t("tickets.form.department_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">{t("tickets.form.category_label")}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("tickets.form.category_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {t(`tickets.category.${c.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">{t("tickets.form.priority_label")}</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("tickets.form.priority_placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {t(`tickets.priority.${p.value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 w-full">
        <Label htmlFor="description">{t("tickets.form.description_label")}</Label>
        <Textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full"
          placeholder={t("tickets.form.description_placeholder")}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("tickets.form.cancel")}
        </Button>
        <Button type="submit">{t("tickets.form.create")}</Button>
      </div>
    </form>
  )
}
