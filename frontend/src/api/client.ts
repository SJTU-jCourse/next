import type { ApiError } from "./types"
import { BASE_URL } from "./constants"

const CSRF_HEADER = "X-CSRF-Token"
const CSRF_ERRORS = new Set(["csrf token missing", "csrf token mismatch"])

let csrfToken: string | null = null
let csrfTokenRequest: Promise<string> | null = null

class HttpError extends Error {
  status: number
  body?: ApiError

  constructor(message: string, status: number, body?: ApiError) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.body = body
  }
}

export async function apiClient<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const method = requestMethod(input, init)
  const requiresCsrf = requiresCsrfToken(method)
  const hasCallerCsrfToken = new Headers(init?.headers).has(CSRF_HEADER)

  let res = await fetchWithDefaults(
    input,
    init,
    requiresCsrf && !hasCallerCsrfToken ? await fetchCsrfToken() : undefined
  )

  if (requiresCsrf && !hasCallerCsrfToken && (await isCsrfFailure(res))) {
    clearCsrfToken()
    res = await fetchWithDefaults(input, init, await fetchCsrfToken())
  }

  return parseResponse<T>(res)
}

async function fetchWithDefaults(
  input: RequestInfo,
  init?: RequestInit,
  csrf?: string
) {
  const headers = new Headers(init?.headers)
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json")
  if (csrf && !headers.has(CSRF_HEADER)) headers.set(CSRF_HEADER, csrf)

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  })
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorBody: ApiError | undefined
    try {
      errorBody = await res.json()
    } catch {
      // ignore parse error
    }
    throw new HttpError(
      errorBody?.error ?? `Request failed: ${res.status}`,
      res.status,
      errorBody
    )
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

async function isCsrfFailure(res: Response) {
  if (res.status !== 403) return false
  try {
    const body = (await res.clone().json()) as ApiError
    return CSRF_ERRORS.has(body.error)
  } catch {
    return false
  }
}

function requestMethod(input: RequestInfo, init?: RequestInit) {
  return (
    init?.method ?? (input instanceof Request ? input.method : "GET")
  ).toUpperCase()
}

function requiresCsrfToken(method: string) {
  return method !== "GET" && method !== "HEAD" && method !== "OPTIONS"
}

async function fetchCsrfToken() {
  if (csrfToken) return csrfToken
  if (!csrfTokenRequest) {
    csrfTokenRequest = fetch(`${BASE_URL}/auth/csrf`, {
      credentials: "include",
    })
      .then((res) => {
        const token = res.headers.get(CSRF_HEADER)
        if (!res.ok || !token) throw new Error("页面已过期，请刷新后重试")
        csrfToken = token
        return token
      })
      .finally(() => {
        csrfTokenRequest = null
      })
  }
  return csrfTokenRequest
}

function clearCsrfToken() {
  csrfToken = null
}

export { HttpError }
