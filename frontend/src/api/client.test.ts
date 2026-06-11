import { beforeEach, describe, expect, it, vi } from "vitest"

describe("apiClient CSRF handling", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("shares one CSRF token request across concurrent unsafe requests", async () => {
    const fetchMock = vi.fn(
      async (...[input]: [RequestInfo | URL, RequestInit?]) => {
        if (requestURL(input) === "/api/auth/csrf") {
          return new Response(null, {
            status: 204,
            headers: { "X-CSRF-Token": "token-1" },
          })
        }
        return jsonResponse({ ok: true })
      }
    )
    vi.stubGlobal("fetch", fetchMock)

    const { apiClient } = await import("./client")

    await Promise.all([
      apiClient("/api/one", { method: "POST", body: "{}" }),
      apiClient("/api/two", { method: "POST", body: "{}" }),
    ])

    expect(
      fetchMock.mock.calls.filter(
        ([input]) => requestURL(input) === "/api/auth/csrf"
      )
    ).toHaveLength(1)
    const unsafeCalls = fetchMock.mock.calls.filter(
      ([input]) => requestURL(input) !== "/api/auth/csrf"
    )
    expect(unsafeCalls).toHaveLength(2)
    expect(headerValue(unsafeCalls[0][1], "X-CSRF-Token")).toBe("token-1")
    expect(headerValue(unsafeCalls[1][1], "X-CSRF-Token")).toBe("token-1")
  })

  it("refreshes the token and retries once after a CSRF 403", async () => {
    let csrfRequests = 0
    let unsafeRequests = 0
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (requestURL(input) === "/api/auth/csrf") {
          csrfRequests += 1
          return new Response(null, {
            status: 204,
            headers: { "X-CSRF-Token": `token-${csrfRequests}` },
          })
        }

        unsafeRequests += 1
        if (unsafeRequests === 1) {
          expect(headerValue(init, "X-CSRF-Token")).toBe("token-1")
          return jsonResponse({ error: "csrf token mismatch" }, 403)
        }

        expect(headerValue(init, "X-CSRF-Token")).toBe("token-2")
        return jsonResponse({ ok: true })
      }
    )
    vi.stubGlobal("fetch", fetchMock)

    const { apiClient } = await import("./client")

    await expect(
      apiClient("/api/protected", { method: "POST", body: "{}" })
    ).resolves.toEqual({ ok: true })
    expect(csrfRequests).toBe(2)
    expect(unsafeRequests).toBe(2)
  })
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function headerValue(init: RequestInit | undefined, name: string) {
  return new Headers(init?.headers).get(name)
}

function requestURL(input: RequestInfo | URL) {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}
