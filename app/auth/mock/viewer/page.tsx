'use client'

import { useEffect } from 'react'

function b64url(input: string) {
  if (typeof window === 'undefined') return ''
  const s = btoa(unescape(encodeURIComponent(input)))
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export default function MockViewerLogin() {
  useEffect(() => {
    try {
      // Create an unsigned mock JWT with user/employee role
      const header = b64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
      const payload = b64url(
        JSON.stringify({
          sub: 'user@csc.gov',
          email: 'user@csc.gov',
          name: 'Mock User',
          role: ['EMPLOYEE'],
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
        }),
      )
      const token = `${header}.${payload}.mock`

      // Store for apiFetch()
      localStorage.setItem('token', token)
      localStorage.setItem('accessToken', token)
      localStorage.setItem('jwt', token)

      // Cookies for middleware and some APIs
      document.cookie = `auth_token=${token}; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`
      document.cookie = `accessToken=${token}; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax`

      const next = new URLSearchParams(window.location.search).get('next') || '/'
      window.location.replace(next)
    } catch {
      window.location.replace('/login')
    }
  }, [])

  return (
    <div className="p-6 text-sm text-gray-700">Signing in as mock user…</div>
  )
}
