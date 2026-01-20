"use client"
import React, { useEffect, useState } from 'react'

export default function TicketStatusBadge({ ticketId }: { ticketId: string }) {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setError(null)
      try {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
        const res = await fetch(`/api/helpdesk/tickets/${encodeURIComponent(ticketId)}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed')
        if (mounted) setStatus(data.item?.status || 'unknown')
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed')
      }
    }
    load()
    return () => { mounted = false }
  }, [ticketId])

  if (error) return <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-red-100 text-red-800">Error</span>
  if (!status) return <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800">Loading…</span>

  const color =
    status === 'new' ? 'bg-gray-100 text-gray-800' :
    status === 'open' ? 'bg-blue-100 text-blue-800' :
    status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
    status === 'on_hold' ? 'bg-purple-100 text-purple-800' :
    status === 'solved' ? 'bg-green-100 text-green-800' :
    status === 'closed' ? 'bg-green-200 text-green-900' :
    'bg-gray-100 text-gray-800'

  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${color}`}>{status}</span>
}
