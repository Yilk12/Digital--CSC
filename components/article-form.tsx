"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X, Plus, Globe, FileText, Settings } from "lucide-react"
import { format } from "date-fns"

interface ArticleFormProps {
  onClose: () => void
  article?: any // For editing existing articles
}

export function ArticleForm({ onClose, article }: ArticleFormProps) {
  const [language] = useState<"en" | "am">("en")
  const [formData, setFormData] = useState({
    title: article?.title || "",
    titleAm: article?.titleAm || "",
    content: article?.content || "",
    contentAm: article?.contentAm || "",
    excerpt: article?.excerpt || "",
    category: article?.category || "",
    tags: article?.tags || [],
    status: article?.status || "Draft",
    language: article?.language || "en",
    isBilingual: article?.language === "both" || false,
    publishDate: article?.publishedAt ? new Date(article.publishedAt) : undefined,
    expiryDate: article?.expiryDate ? new Date(article.expiryDate) : undefined,
    isPublic: true,
    allowComments: true,
    sendNotification: false,
    // Category-specific fields
    info_source: "",
    info_summary: "",
    advice_audience: "",
    advice_recommendations: "",
    improvement_issue: "",
    improvement_proposal: "",
    improvement_benefit: "",
    practice_prerequisites: "",
    practice_steps: "",
    people_department: "",
    people_contact: "",
    tech_system: "",
    tech_version: "",
    tech_platform: "",
  })
  const [newTag, setNewTag] = useState("")
  const [activeTab, setActiveTab] = useState("content")
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState<string>("")

  const categories = [
    { value: "Authentication", label: language === "en" ? "Authentication" : "ማረጋገጫ" },
    { value: "Technical Support", label: language === "en" ? "Technical Support" : "ቴክኒካል ድጋፍ" },
    { value: "User Guide", label: language === "en" ? "User Guide" : "የተጠቃሚ መመሪያ" },
    { value: "Policies", label: language === "en" ? "Policies" : "ፖሊሲዎች" },
    { value: "Procedures", label: language === "en" ? "Procedures" : "ሂደቶች" },
    { value: "FAQ", label: language === "en" ? "FAQ" : "ተደጋጋሚ ጥያቄዎች" },
    { value: "Information", label: language === "en" ? "Information" : "መረጃ" },
    { value: "Advice", label: language === "en" ? "Advice" : "ምክር" },
    { value: "Improvement", label: language === "en" ? "Improvement" : "ማሻሻያ" },
    { value: "Practice", label: language === "en" ? "Practice" : "ልምድ" },
    { value: "People", label: language === "en" ? "People" : "ሰዎች" },
    { value: "Technology", label: language === "en" ? "Technology" : "ቴክኖሎጂ" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMsg("")

    try {
      // Build multipart form data
      const fd = new FormData()
      // Required fields (align with backend CreateArticleDto)
      fd.append("title", formData.title)
      fd.append("content", formData.content)
      fd.append("status", String(formData.status || "Draft"))
      const langVal = (formData.language || language).toUpperCase()
      fd.append("language", langVal)

      // Optional fields
      if (formData.titleAm) fd.append("titleAm", formData.titleAm)
      if (formData.contentAm) fd.append("contentAm", formData.contentAm)
      if (formData.excerpt) fd.append("excerpt", formData.excerpt)
      if (formData.category) fd.append("categoryId", formData.category) // NOTE: expects categoryId; ensure mapping in real use
      if (Array.isArray(formData.tags)) {
        for (const t of formData.tags) fd.append("tags[]", t)
      }
      if (formData.expiryDate) fd.append("expiresAt", formData.expiryDate.toISOString())

      // Attach files
      for (const f of files) fd.append("files", f)

      // Auth header from localStorage (mirrors app/lib/api.ts behavior)
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken") ||
            window.localStorage.getItem("jwt") ||
            window.localStorage.getItem("token")
          : null

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"}/api/v1/knowledge-base/articles`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Failed to create article: ${res.status}`)
      }

      setSubmitMsg("Article created successfully")
      // Optionally clear form/files
      setFiles([])
      onClose()
    } catch (err: any) {
      setSubmitMsg(err?.message || "Failed to submit article")
    } finally {
      setSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" className="gap-2">
            <FileText className="w-4 h-4" />
            {language === "en" ? "Content" : "ይዘት"}
          </TabsTrigger>
          <TabsTrigger value="translation" className="gap-2">
            <Globe className="w-4 h-4" />
            {language === "en" ? "Translation" : "ትርጉም"}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            {language === "en" ? "Settings" : "ቅንብሮች"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Article Information" : "የጽሁፍ መረጃ"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{language === "en" ? "Title" : "ርዕስ"} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={language === "en" ? "Enter article title" : "የጽሁፍ ርዕስ ያስገቡ"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">{language === "en" ? "Excerpt (optional)" : "አጭር ማጠቃለያ (አማራጭ)"}</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  placeholder={language === "en" ? "Short summary shown in lists" : "በዝርዝሮች ውስጥ የሚታይ አጭር ማጠቃለያ"}
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>{language === "en" ? "Attachments (optional)" : "አባሪዎች (አማራጭ)"}</Label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.gif,.mp4,.mov,.avi,.mkv"
                />
                {files.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {language === "en" ? "Selected files:" : "የተመረጡ ፋይሎች:"}
                    <ul className="list-disc ml-5 mt-1">
                      {files.map((f, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span>{f.name}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}>
                            <X className="w-3 h-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {language === "en"
                    ? "Allowed: Word, Image, PDF, Excel, PowerPoint, Text, and Video files."
                    : "የሚፈቀዱ: ዎርድ፣ ምስል፣ PDF፣ ኤክሴል፣ ፓወርፖይንት፣ ጽሑፍ እና ቪዲዮ ፋይሎች።"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{language === "en" ? "Content" : "ይዘት"} *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={language === "en" ? "Write your article content here..." : "የጽሁፍዎን ይዘት እዚህ ይጻፉ..."}
                  rows={12}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{language === "en" ? "Category" : "ምድብ"} *</Label>
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
                  <Label htmlFor="status">{language === "en" ? "Status" : "ሁኔታ"}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">{language === "en" ? "Draft" : "ረቂቅ"}</SelectItem>
                      <SelectItem value="Review">{language === "en" ? "Review" : "ግምገማ"}</SelectItem>
                      <SelectItem value="Published">{language === "en" ? "Published" : "የታተመ"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category-specific inputs */}
              {formData.category === "Information" && (
                <div className="space-y-2">
                  <Label>{language === "en" ? "Source" : "ምንጭ"}</Label>
                  <Input
                    value={formData.info_source}
                    onChange={(e) => setFormData((p) => ({ ...p, info_source: e.target.value }))}
                    placeholder={language === "en" ? "e.g. Policy document, URL" : "ለ.ም ፖሊሲ ሰነድ፣ ዩአርኤል"}
                  />
                  <Label>{language === "en" ? "Summary" : "ማጠቃለያ"}</Label>
                  <Textarea
                    value={formData.info_summary}
                    onChange={(e) => setFormData((p) => ({ ...p, info_summary: e.target.value }))}
                    rows={6}
                  />
                </div>
              )}

              {formData.category === "Advice" && (
                <div className="space-y-2">
                  <Label>{language === "en" ? "Audience" : "ተመራቂ"}</Label>
                  <Input
                    value={formData.advice_audience}
                    onChange={(e) => setFormData((p) => ({ ...p, advice_audience: e.target.value }))}
                    placeholder={language === "en" ? "Who is this for?" : "ለማን ነው?"}
                  />
                  <Label>{language === "en" ? "Recommendations" : "ምክሮች"}</Label>
                  <Textarea
                    value={formData.advice_recommendations}
                    onChange={(e) => setFormData((p) => ({ ...p, advice_recommendations: e.target.value }))}
                    rows={6}
                  />
                </div>
              )}

              {formData.category === "Improvement" && (
                <div className="space-y-2">
                  <Label>{language === "en" ? "Current Issue" : "ያለው ችግኝ"}</Label>
                  <Textarea
                    value={formData.improvement_issue}
                    onChange={(e) => setFormData((p) => ({ ...p, improvement_issue: e.target.value }))}
                    rows={4}
                  />
                  <Label>{language === "en" ? "Proposed Change" : "የቀረበ ለውጥ"}</Label>
                  <Textarea
                    value={formData.improvement_proposal}
                    onChange={(e) => setFormData((p) => ({ ...p, improvement_proposal: e.target.value }))}
                    rows={4}
                  />
                  <Label>{language === "en" ? "Expected Benefit" : "የሚጠበቀው ጥቅም"}</Label>
                  <Textarea
                    value={formData.improvement_benefit}
                    onChange={(e) => setFormData((p) => ({ ...p, improvement_benefit: e.target.value }))}
                    rows={3}
                  />
                </div>
              )}

              {formData.category === "Practice" && (
                <div className="space-y-2">
                  <Label>{language === "en" ? "Prerequisites" : "ቅድመ ሁኔታዎች"}</Label>
                  <Input
                    value={formData.practice_prerequisites}
                    onChange={(e) => setFormData((p) => ({ ...p, practice_prerequisites: e.target.value }))}
                  />
                  <Label>{language === "en" ? "Step-by-step Instructions" : "እርምጃ-በእርምጃ መመሪያ"}</Label>
                  <Textarea
                    value={formData.practice_steps}
                    onChange={(e) => setFormData((p) => ({ ...p, practice_steps: e.target.value }))}
                    rows={8}
                  />
                </div>
              )}

              {formData.category === "People" && (
                <div className="space-y-2">
                  <Label>{language === "en" ? "Department/Team" : "ክፍል/ቡድን"}</Label>
                  <Input
                    value={formData.people_department}
                    onChange={(e) => setFormData((p) => ({ ...p, people_department: e.target.value }))}
                  />
                  <Label>{language === "en" ? "Contact Person" : "የእውቂያ ሰው"}</Label>
                  <Input
                    value={formData.people_contact}
                    onChange={(e) => setFormData((p) => ({ ...p, people_contact: e.target.value }))}
                  />
                </div>
              )}

              {formData.category === "Technology" && (
                <div className="space-y-2">
                  <Label>{language === "en" ? "System/Tool" : "ስርዓት/መሣሪያ"}</Label>
                  <Input
                    value={formData.tech_system}
                    onChange={(e) => setFormData((p) => ({ ...p, tech_system: e.target.value }))}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Version" : "ስሪት"}</Label>
                      <Input
                        value={formData.tech_version}
                        onChange={(e) => setFormData((p) => ({ ...p, tech_version: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{language === "en" ? "Platform" : "መድረክ"}</Label>
                      <Input
                        value={formData.tech_platform}
                        onChange={(e) => setFormData((p) => ({ ...p, tech_platform: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label>{language === "en" ? "Tags" : "መለያዎች"}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder={language === "en" ? "Add a tag" : "መለያ ጨምር"}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="translation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {language === "en" ? "Amharic Translation" : "የአማርኛ ትርጉም"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="bilingual"
                  checked={formData.isBilingual}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isBilingual: checked,
                      language: checked ? "both" : "en",
                    }))
                  }
                />
                <Label htmlFor="bilingual">{language === "en" ? "Enable Amharic translation" : "የአማርኛ ትርጉም አንቃ"}</Label>
              </div>

              {formData.isBilingual && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="titleAm">{language === "en" ? "Title (Amharic)" : "ርዕስ (አማርኛ)"}</Label>
                    <Input
                      id="titleAm"
                      value={formData.titleAm}
                      onChange={(e) => setFormData((prev) => ({ ...prev, titleAm: e.target.value }))}
                      placeholder={language === "en" ? "Enter Amharic title" : "የአማርኛ ርዕስ ያስገቡ"}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contentAm">{language === "en" ? "Content (Amharic)" : "ይዘት (አማርኛ)"}</Label>
                    <Textarea
                      id="contentAm"
                      value={formData.contentAm}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contentAm: e.target.value }))}
                      placeholder={language === "en" ? "Write Amharic content here..." : "የአማርኛ ይዘት እዚህ ይጻፉ..."}
                      rows={12}
                      dir="rtl"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{language === "en" ? "Publishing Settings" : "የማተሚያ ቅንብሮች"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Publish Date" : "የማተሚያ ቀን"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.publishDate
                          ? format(formData.publishDate, "PPP")
                          : language === "en"
                            ? "Pick a date"
                            : "ቀን ይምረጡ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.publishDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, publishDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>{language === "en" ? "Expiry Date (Optional)" : "የማብቂያ ቀን (አማራጭ)"}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expiryDate
                          ? format(formData.expiryDate, "PPP")
                          : language === "en"
                            ? "Pick a date"
                            : "ቀን ይምረጡ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expiryDate}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, expiryDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "en" ? "Public Article" : "ይፋዊ ጽሁፍ"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Make this article visible to all users" : "ይህን ጽሁፍ ለሁሉም ተጠቃሚዎች ይፋ አድርግ"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublic: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "en" ? "Allow Comments" : "አስተያየቶችን ፍቀድ"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Allow users to comment on this article" : "ተጠቃሚዎች በዚህ ጽሁፍ ላይ እንዲያስተያይቱ ፍቀድ"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.allowComments}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allowComments: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>{language === "en" ? "Send Notification" : "ማሳወቂያ ላክ"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {language === "en" ? "Notify users when this article is published" : "ይህ ጽሁፍ ሲታተም ተጠቃሚዎችን አሳውቅ"}
                    </p>
                  </div>
                  <Switch
                    checked={formData.sendNotification}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, sendNotification: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose}>
          {language === "en" ? "Cancel" : "ይቅር"}
        </Button>
        <Button type="submit">
          {article
            ? language === "en"
              ? "Update Article"
              : "ጽሁፍ ያዘምኑ"
            : language === "en"
              ? "Create Article"
              : "ጽሁፍ ይፍጠሩ"}
        </Button>
      </div>
    </form>
  )
}
