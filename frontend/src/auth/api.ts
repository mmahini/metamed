const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body)
  return body as T
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>,
  ) {
    super((body?.detail as string) ?? `HTTP ${status}`)
  }
}

/* ── Auth endpoints ── */

export interface RequestOTPResponse {
  otp_id: string
  expires_at: string
  is_new_user: boolean
  dev_code?: string
}

export function requestOTP(email: string): Promise<RequestOTPResponse> {
  return request('auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export interface VerifyOTPResponse {
  access: string
  refresh: string
  user: {
    id: number
    email: string
    full_name: string
    role: string
  }
}

export function verifyOTP(otp_id: string, code: string): Promise<VerifyOTPResponse> {
  return request('auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ otp_id, code }),
  })
}

export function refreshToken(refresh: string): Promise<{ access: string }> {
  return request('auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  })
}

/* ── Authenticated API call ── */

export function authRequest<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<T> {
  return request<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })
}

/* Authenticated fetch using token from localStorage — use in page components */
export function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('mm_access') ?? ''
  return request<T>(path, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
}

/* Download an authenticated file (e.g. CSV export) and trigger a save dialog. */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const token = localStorage.getItem('mm_access') ?? ''
  const res = await fetch(`${BASE}/api/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError(res.status, {})
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
