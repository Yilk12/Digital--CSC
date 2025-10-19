"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Building2, Info } from "lucide-react"

interface DepartmentFormProps {
  onClose: () => void
  department?: any
  onSubmit?: (data: any) => Promise<void> | void
}

export function DepartmentForm({ onClose, department, onSubmit }: DepartmentFormProps) {
  const [language] = useState<"en" | "am">("en")
  const [formData, setFormData] = useState({
    name: department?.name || "",
    nameAm: department?.nameAm || "",
    description: department?.description || "",
    isActive: department?.isActive ?? true,
  })

  const statuses = [
    { value: "true", label: language === "en" ? "Active" : "ንቁ" },
    { value: "false", label: language === "en" ? "Inactive" : "ንቁ ያልሆነ" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        nameAm: formData.nameAm || undefined,
        description: formData.description || undefined,
        isActive: Boolean(formData.isActive),
      }
      if (onSubmit) {
        await onSubmit(payload)
      } else {
        console.log("Department data:", payload)
      }
      onClose()
    } catch (err) {
      console.error("Failed to submit department:", err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {language === "en" ? "Department Information" : "የክፍል መረጃ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === "en" ? "Department Name" : "የክፍል ስም"} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={language === "en" ? "Enter department name" : "የክፍል ስም ያስገቡ"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameAm">{language === "en" ? "Department Name (Amharic)" : "የክፍል ስም (አማርኛ)"}</Label>
              <Input
                id="nameAm"
                value={formData.nameAm}
                onChange={(e) => setFormData((prev) => ({ ...prev, nameAm: e.target.value }))}
                placeholder={language === "en" ? "Optional" : "አማራጭ"}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{language === "en" ? "Description" : "መግለጫ"}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={language === "en" ? "Short description of the department" : "የክፍሉ አጭር መግለጫ"}
              className="min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            {language === "en" ? "Status" : "ሁኔታ"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">{language === "en" ? "Department Status" : "የክፍል ሁኔታ"}</Label>
            <Select value={String(formData.isActive)} onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value === "true" }))}>
              <SelectTrigger>
                <SelectValue placeholder={language === "en" ? "Select status" : "ሁኔታ ይምረጡ"} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          {language === "en" ? "Cancel" : "ይቅር"}
        </Button>
        <Button type="submit">
          {department ? (language === "en" ? "Update Department" : "ክፍል ያዘምኑ") : language === "en" ? "Create Department" : "ክፍል ይፍጠሩ"}
        </Button>
      </div>
    </form>
  )
}
