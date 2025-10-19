"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X } from "lucide-react"

interface TicketFormProps {
  onClose: () => void
  onCreated?: () => void
}

export function TicketForm({ onClose, onCreated }: TicketFormProps) {
  const [language] = useState<"en" | "am">("en")
  const [authInfo, setAuthInfo] = useState<{ hasToken: boolean; tokenPreview: string }>()
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

  useEffect(() => {
    let cancelled = false
    async function loadDepts() {
      try {
        setLoadingDepts(true)
        const { API_BASE_URL } = await import("@/app/lib/api")
        const token = typeof window !== "undefined" ? (localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token")) : null
        const res = await fetch(`${API_BASE_URL}/departments?limit=100`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        })
        if (!res.ok) throw new Error(`Failed to load departments (${res.status})`)
        const data = await res.json()
        const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data?.departments) ? data.departments : data)
        if (!cancelled && Array.isArray(items)) {
          setDepartments(items.map((d: any) => ({ id: d.id, name: d.name })))
        }
      } catch (e) {
        console.error("Failed to load departments", e)
      } finally {
        if (!cancelled) setLoadingDepts(false)
      }
    }
    loadDepts()
    return () => { cancelled = true }
  }, [])

  const categories = [
    { value: "incident", label: language === "en" ? "Incident" : "ክስተት" },
    { value: "request", label: language === "en" ? "Request" : "ጥያቄ" },
    { value: "problem", label: language === "en" ? "Problem" : "ችግር" },
    { value: "change", label: language === "en" ? "Change" : "ለውጥ" },
  ]

  const priorities = [
    { value: "low", label: language === "en" ? "Low" : "ዝቅተኛ" },
    { value: "medium", label: language === "en" ? "Medium" : "መካከለኛ" },
    { value: "high", label: language === "en" ? "High" : "ከፍተኛ" },
    { value: "urgent", label: language === "en" ? "Urgent" : "አስቸኳይ" },
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token =
        window.localStorage.getItem("accessToken") ||
        window.localStorage.getItem("jwt") ||
        window.localStorage.getItem("token")
      setAuthInfo({ hasToken: !!token, tokenPreview: token ? `${token.slice(0, 12)}...` : "" })
    }
  }, [])

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Map UI values to backend enums
    const priorityMap: Record<string, string> = { low: "LOW", medium: "MEDIUM", high: "HIGH", urgent: "URGENT" }
    const categoryMap: Record<string, string> = { incident: "INCIDENT", request: "REQUEST", problem: "PROBLEM", change: "CHANGE" }

    const fd = new FormData()
    fd.append("title", formData.title)
    fd.append("description", formData.description)
    if (formData.priority) fd.append("priority", priorityMap[formData.priority] || "MEDIUM")
    if (formData.category) fd.append("category", categoryMap[formData.category] || "INCIDENT")
    if (formData.department) fd.append("departmentId", formData.department)
    for (const file of formData.attachments) fd.append("files", file)

    try {
      const { API_BASE_URL } = await import("@/app/lib/api")
      const headers: HeadersInit = {}
      if (typeof window !== "undefined") {
        const token =
          window.localStorage.getItem("accessToken") ||
          window.localStorage.getItem("jwt") ||
          window.localStorage.getItem("token")
        if (token) (headers as any)["Authorization"] = `Bearer ${token}`
        setAuthInfo({ hasToken: !!token, tokenPreview: token ? `${token.slice(0, 12)}...` : "" })
      }
      const res = await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        headers,
        body: fd,
        credentials: "include",
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Create failed: ${res.status}`)
      }
      onCreated?.()
      onClose()
    } catch (err) {
      console.error("Create ticket failed", err)
      alert((err as any)?.message || "Failed to create ticket")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {authInfo && (
        <div className={`text-xs rounded p-2 ${authInfo.hasToken ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <strong>Auth:</strong> {authInfo.hasToken ? `Bearer present (${authInfo.tokenPreview})` : "No token in localStorage. Please login."}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">{language === "en" ? "Ticket Subject" : "የቲኬት ርዕስ"} *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder={language === "en" ? "Brief description of the issue" : "የችግሩ አጭር መግለጫ"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">{language === "en" ? "Target Department" : "ዒላማ ክፍል"} *</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? (loadingDepts ? "Loading departments..." : "Select department") : (loadingDepts ? "ክፍሎች በመጫን ላይ..." : "ክፍል ይምረጡ")} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">{language === "en" ? "Category/Type" : "ምድብ/አይነት"}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "Select category" : "ምድብ ይምረጡ"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">{language === "en" ? "Priority" : "ቅድሚያ"}</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={language === "en" ? "Select priority" : "ቅድሚያ ይምረጡ"} />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority.value} value={priority.value}>
                  {priority.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{language === "en" ? "Description" : "መግለጫ"} *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder={language === "en" ? "Detailed description of the issue or request" : "የችግሩ ወይም ጥያቄው ዝርዝር መግለጫ"}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{language === "en" ? "Attachments (Optional)" : "አባሪዎች (አማራጭ)"}</Label>
        <Card className="border-dashed border-2 border-muted-foreground/25">
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:text-primary/80">
                    {language === "en" ? "Click to upload files" : "ፋይሎችን ለመስቀል ይጫኑ"}
                  </span>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === "en" ? "PNG, JPG, PDF up to 10MB" : "PNG, JPG, PDF እስከ 10MB"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {formData.attachments.length > 0 && (
          <div className="space-y-2">
            <Label>{language === "en" ? "Uploaded Files" : "የተሰቀሉ ፋይሎች"}</Label>
            {formData.attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{file.name}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          {language === "en" ? "Cancel" : "ይቅር"}
        </Button>
        <Button type="submit">{language === "en" ? "Create Ticket" : "ቲኬት ይፍጠሩ"}</Button>
      </div>
    </form>
  )
}
