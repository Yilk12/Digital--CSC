"use client"
import React, { useEffect, useState } from 'react'

export default function RelatedArticlesPanel({ query, tags = [] }: { query: string; tags?: string[] }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
        const params = new URLSearchParams({ q: query, ...(tags.length ? {} : {}) })
        for (const t of tags) params.append('tag', t)
        const res = await fetch(`/api/kb/search?${params.toString()}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed')
        if (mounted) setItems(data?.items || [])
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (query) load()
    return () => { mounted = false }
  }, [query, JSON.stringify(tags)])

  if (!query) return null

  return (
    <div className="w-full border rounded-md p-3 bg-white shadow-sm">
      <div className="font-semibold text-sm mb-2">Related Articles</div>
      {loading ? <div className="text-sm text-gray-500">Searching…</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {!loading && !error && items.length === 0 ? (
        <div className="text-sm text-gray-500">No related articles</div>
      ) : null}
      <ul className="space-y-2">
        {items.map((a) => (
          <li key={a.id} className="text-sm">
            <a
              href={a.url || `#/kb/${a.id}`}
              className="text-blue-600 hover:underline"
              target={a.url ? '_blank' : undefined}
              rel="noreferrer"
              title={a.title}
            >
              {a.title}
            </a>
            {a.tags?.length ? (
              <span className="ml-2 text-xs text-gray-500">{a.tags.join(', ')}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
