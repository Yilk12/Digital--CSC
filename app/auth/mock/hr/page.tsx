'use client'

import { useEffect } from 'react'

function base64url(input: string) {
  return btoa(input).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export default function MockHRLogin() {
  useEffect(() => {
    const header = { alg: 'none', typ: 'JWT' }
    const payload = {
      id: 'mock-hr-1',
      name: 'Mock HR Creator',
      email: 'hr.creator@csc.gov',
      roles: ['hr', 'communications', 'ads_editor', 'ads_admin'],
      role: 'hr',
      realm_access: { roles: ['hr'] },
    }
    const token = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}.`
    try {
      window.localStorage.setItem('accessToken', token)
      window.localStorage.setItem('jwt', token)
      window.localStorage.setItem('token', token)
    } catch {}
    window.location.href = '/advertisement/creator'
  }, [])

  return (
    <div className="p-6 text-sm text-gray-700">Setting mock HR session…</div>
  )
}
