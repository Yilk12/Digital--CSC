"use client"
import React, { useState } from 'react'

export default function CreateTicketButton({
  subject,
  description,
  tags = [],
  variant = 'primary',
  onCreated,
}: {
  subject: string
  description?: string
  tags?: string[]
  variant?: 'primary' | 'secondary'
  onCreated?: (ticket: any) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create() {
    setLoading(true)
    setError(null)
    try {
      const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null
      const res = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ subject, description: description || '', tags }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to create ticket')
      onCreated?.(data.item)
    } catch (e: any) {
      setError(e?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={create}
        disabled={loading}
        className={`px-3 py-1.5 rounded text-sm font-medium shadow ${variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} disabled:opacity-50`}
        title="Create help desk ticket"
      >
        {loading ? 'Creating…' : 'Create Ticket'}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  )
}
