"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { API_BASE_URL } from "@/app/lib/api"

type Article = {
  id: string
  title: string
  titleAm?: string | null
  content: string
  contentAm?: string | null
  excerpt?: string | null
  language: string
  status: string
  viewCount: number
  likeCount: number
  createdAt: string
  updatedAt: string
  author: { firstName: string; lastName: string }
}

export default function ArticleReadPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE_URL}/knowledge-base/articles/${id}?incrementView=true`, { cache: "no-store" })
        if (!res.ok) throw new Error(`Failed to load article: ${res.status}`)
        const data = await res.json()
        // Only allow published articles for public view
        if (String(data?.status).toUpperCase() !== "PUBLISHED") {
          setError("This article is not publicly available.")
          setArticle(null)
        } else {
          setArticle(data)
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load article")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="max-w-3xl mx-auto p-4">Loading...</div>
  if (error) return <div className="max-w-3xl mx-auto p-4 text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>
  if (!article) return <div className="max-w-3xl mx-auto p-4">Article not found.</div>

  return (
    <article className="max-w-3xl mx-auto p-4 space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">{article.title}</h1>
        {article.excerpt && <p className="text-gray-600">{article.excerpt}</p>}
        <div className="text-sm text-gray-500">By {article.author.firstName} {article.author.lastName} • {new Date(article.createdAt).toLocaleString()}</div>
      </header>
      <section className="prose max-w-none whitespace-pre-wrap">{article.content}</section>
    </article>
  )
}
