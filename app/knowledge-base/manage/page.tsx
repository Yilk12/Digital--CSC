"use client"

import React, { useEffect, useMemo, useState } from "react"
import { articlesApi, type ArticlesPage, type ArticleStatus } from "@/app/lib/articles-api"
import { API_BASE_URL } from "@/app/lib/api"

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token =
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export default function ManageKnowledgeBasePage() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [status, setStatus] = useState<"ALL" | ArticleStatus>("ALL")
  const [search, setSearch] = useState("")

  const [data, setData] = useState<ArticlesPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [newStatus, setNewStatus] = useState<ArticleStatus>("DRAFT")

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await articlesApi.list({ page, limit, status: status === "ALL" ? undefined : status, search })
      setData(res)
    } catch (e: any) {
      setError(e?.message || "Failed to load articles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  async function createSimpleArticle() {
    setCreating(true)
    setError(null)
    try {
      await articlesApi.createSimple({ title: newTitle, content: newContent, status: newStatus, language: "EN" })
      setNewTitle("")
      setNewContent("")
      setNewStatus("DRAFT")
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to create article")
    } finally {
      setCreating(false)
    }
  }

  async function updateStatus(id: string, status: ArticleStatus) {
    setError(null)
    try {
      await articlesApi.update(id, { status })
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to update status")
    }
  }

  async function deleteArticle(id: string) {
    setError(null)
    try {
      const headers: HeadersInit = { "Content-Type": "application/json", ...getAuthHeader() }
      const res = await fetch(`${API_BASE_URL}/knowledge-base/articles/${id}`, { method: "DELETE", headers, credentials: "include" })
      if (!res.ok) throw new Error(`DELETE failed: ${res.status}`)
      await load()
    } catch (e: any) {
      setError(e?.message || "Failed to delete article")
    }
  }

  function copyShareLink(id: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const url = `${origin}/knowledge-base/articles/${id}`
    if (navigator.clipboard) navigator.clipboard.writeText(url)
    alert(`Link copied: ${url}`)
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Base Management</h1>
        <p className="text-gray-600">Admins can create, manage, publish, and share knowledge articles.</p>
      </div>

      <section className="space-y-3 p-4 border rounded">
        <h2 className="font-medium">Create New Article</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded p-2" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <select className="border rounded p-2" value={newStatus} onChange={(e) => setNewStatus(e.target.value as ArticleStatus)}>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Review</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <button className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={creating || !newTitle.trim() || !newContent.trim()} onClick={createSimpleArticle}>
            {creating ? "Creating..." : "Create Article"}
          </button>
        </div>
        <textarea className="w-full border rounded p-2" rows={5} placeholder="Content" value={newContent} onChange={(e) => setNewContent(e.target.value)} />
      </section>

      <section className="flex items-center gap-2">
        <input className="border rounded p-2 flex-1" placeholder="Search title/content" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="border rounded p-2" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="ALL">All</option>
          <option value="DRAFT">Draft</option>
          <option value="REVIEW">Review</option>
          <option value="PUBLISHED">Published</option>
        </select>
        <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => { setPage(1); load(); }}>Filter</button>
      </section>

      {error && <div className="p-3 rounded bg-red-50 text-red-700 border border-red-200">{error}</div>}

      <section className="border rounded">
        <div className="grid grid-cols-12 gap-2 p-3 font-medium border-b bg-gray-50">
          <div className="col-span-4">Title</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Author</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2">Actions</div>
        </div>
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : !data || data.articles.length === 0 ? (
          <div className="p-4 text-gray-600">No articles found.</div>
        ) : (
          data.articles.map((a) => (
            <div key={a.id} className="grid grid-cols-12 gap-2 p-3 border-b items-center">
              <div className="col-span-4 truncate">{a.title}</div>
              <div className="col-span-2">
                <span className="inline-block px-2 py-1 rounded text-xs border">{a.status}</span>
              </div>
              <div className="col-span-2 truncate">{a.author.firstName} {a.author.lastName}</div>
              <div className="col-span-2 text-sm text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</div>
              <div className="col-span-2 flex gap-2">
                {a.status !== "PUBLISHED" ? (
                  <button className="px-2 py-1 text-xs bg-green-600 text-white rounded" onClick={() => updateStatus(a.id, "PUBLISHED")}>Publish</button>
                ) : (
                  <button className="px-2 py-1 text-xs bg-yellow-600 text-white rounded" onClick={() => updateStatus(a.id, "DRAFT")}>Unpublish</button>
                )}
                <button className="px-2 py-1 text-xs bg-gray-200 rounded" onClick={() => copyShareLink(a.id)}>Copy Link</button>
                <button className="px-2 py-1 text-xs bg-red-600 text-white rounded" onClick={() => deleteArticle(a.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-3">
            <button className="px-3 py-2 border rounded" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <div className="text-sm">Page {page} / {data.pagination.totalPages}</div>
            <button className="px-3 py-2 border rounded" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </section>
    </div>
  )
}
