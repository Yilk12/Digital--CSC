export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || ""
export const API_BASE_URL = `/api`
const API_BASE = `${API_ORIGIN}${API_BASE_URL}`

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token =
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    ...init,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    // Try to surface backend error message if available
    let message = `POST ${path} failed: ${res.status}`
    try {
      const text = await res.text()
      if (text) {
        try {
          const data: any = JSON.parse(text)
          if (typeof data?.message === "string") message = data.message
          else if (Array.isArray(data?.message) && data.message.length > 0) message = String(data.message[0])
          else if (typeof data?.error === "string") message = data.error
          else message = text
        } catch {
          message = text
        }
      }
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export async function apiPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    ...init,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`PATCH ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    ...init,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`PUT ${path} failed: ${res.status}`)
  }
  return res.json()
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  const auth = getAuthHeader()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    ...init,
    credentials: "include",
    headers,
  })
  if (!res.ok) {
    throw new Error(`DELETE ${path} failed: ${res.status}`)
  }
  return res.json()
}

