"use client"
import React, { useState, useRef, useEffect } from "react"
import { useLocalization } from "@/app/hooks/use-localization"

interface Props {
  onClose: () => void
  onSuccess: () => Promise<void> | void
  announcement?: {
    id: string
    title: string
    description?: string | null
    date: string
    imageUrl?: string | null
    status?: string
    category?: string
  }
  mode?: "create" | "edit"
}

export default function AddAnouncmetPage({ onClose, onSuccess, announcement, mode = "create" }: Props) {
  const { t } = useLocalization()
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    imageUrl: "",
    status: "published",
    category: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const extraFileInputRef = useRef<HTMLInputElement>(null)
  const [extraImages, setExtraImages] = useState<string[]>([])
  const [uploadingExtra, setUploadingExtra] = useState(false)

  useEffect(() => {
    if (announcement) {
      setForm({
        title: announcement.title || "",
        description: announcement.description || "",
        date: announcement.date || "",
        imageUrl: announcement.imageUrl || "",
        status: announcement.status || "published",
        category: announcement.category || "",
      })
    }
  }, [announcement])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddExtraImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const validFiles = Array.from(files).filter((file) => {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
      if (!allowedTypes.includes(file.type)) {
        alert("Only JPG, JPEG, PNG, or WEBP images are allowed")
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Each image should be less than 5MB")
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setUploadingExtra(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of validFiles) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("http://localhost:4000/api/upload/image", { method: "POST", body: formData })
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
        const uploadData = await uploadRes.json()
        uploadedUrls.push(uploadData.url)
      }

      if (uploadedUrls.length > 0) {
        setExtraImages((prev) => [...prev, ...uploadedUrls])
      }
    } catch (err) {
      console.error("Failed to upload extra image:", err)
      alert("Failed to upload image. Please try again.")
    } finally {
      if (extraFileInputRef.current) extraFileInputRef.current.value = ""
      setUploadingExtra(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return

    // Validate required fields
    if (!form.title.trim() || !form.date) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      const descriptionWithGallery = [form.description?.trim() || '', ...extraImages].filter(Boolean).join('\n')
      // Normalize date to ISO if only YYYY-MM-DD is provided
      const dateValue = form.date && /^\d{4}-\d{2}-\d{2}$/.test(form.date)
        ? new Date(form.date + 'T00:00:00Z').toISOString()
        : form.date

      const isEdit = mode === 'edit' && announcement?.id
      const url = isEdit
        ? `http://localhost:4000/api/announcements/${announcement!.id}`
        : "http://localhost:4000/api/announcements"
      const method = isEdit ? "PATCH" : "POST"
      // Use explicit imageUrl if provided, otherwise fall back to first extra image
      const mainImageUrl = form.imageUrl || extraImages[0] || undefined
      const payload = {
        title: form.title,
        description: descriptionWithGallery || undefined,
        date: dateValue,
        imageUrl: mainImageUrl,
        status: form.status || undefined,
        category: form.category || undefined,
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        console.error(`${isEdit ? 'Update' : 'Create'} failed`, res.status, text)
        alert(isEdit
          ? `Failed to update announcement. (${res.status})\n${text || 'Please try again.'}`
          : `Failed to create announcement. (${res.status})\n${text || 'Please try again.'}`)
        return
      }
      await onSuccess()
    } catch (err) {
      console.error(mode === 'edit' ? "Failed to update announcement:" : "Failed to create announcement:", err)
      alert(mode === 'edit' ? "Failed to update announcement. Please try again." : "Failed to create announcement. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const triggerExtraFileInput = () => {
    extraFileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">{mode === 'edit' ? (t("announcement.form.edit_title") || 'Edit Announcement') : t("announcement.form.create_title")}</h3>
              <p className="text-blue-100 mt-1">{mode === 'edit' ? (t("announcement.form.edit_sub") || '') : t("announcement.form.create_sub")}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group"
              aria-label="Close"
            >
              <svg 
                className="w-6 h-6 text-white group-hover:scale-110 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Title Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 md:flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("announcement.form.title")}
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white shadow-sm"
              placeholder={t("announcement.form.title_ph")}
            />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 md:flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              {t("announcement.form.description")}
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white shadow-sm resize-none"
              placeholder="📝 We will be performing scheduled maintenance on Sunday to improve system performance..."
            />
          </div>

          {/* Date Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 md:flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-6H3v6a2 2 0 002 2z" />
              </svg>
              {t ? t("announcement.form.date") : "Date"}
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white shadow-sm"
            />
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 md:flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t ? t("announcement.form.status") : "Status"}
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white shadow-sm"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Files (Gallery) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 md:flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4-4 4 4 4-4 4 4" />
              </svg>
              Files
            </label>
            <input
              type="file"
              ref={extraFileInputRef}
              onChange={handleAddExtraImage}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              className="hidden"
            />
            <div className="flex flex-wrap gap-3">
              {extraImages.map((url, idx) => (
                <div key={idx} className="relative w-24 h-20 rounded-lg overflow-hidden group border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`extra-${idx}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  <button
                    type="button"
                    onClick={() => setExtraImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={triggerExtraFileInput}
                disabled={uploadingExtra}
                className="w-24 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600"
                title="Add more images"
              >
                {uploadingExtra ? 'Uploading…' : '+ Add'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Extra image URLs will be appended to the description so they render in the details gallery.</p>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? t("announcement.form.uploading")
                : (mode === 'edit' ? (t("announcement.form.update_btn") || 'Update Announcement') : t("announcement.form.create_btn"))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}