const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Thin wrapper around fetch that:
 * - Prepends the API base URL
 * - Attaches the stored auth token if present
 * - Parses JSON and throws on non-2xx responses
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('cpt_token')

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Something went wrong')
  }

  return data
}
