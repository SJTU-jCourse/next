type BuildQueryOptions = {
  booleanAsNumber?: boolean
  trimKeys?: readonly string[]
}

function queryValueToString(
  value: unknown,
  { booleanAsNumber = false }: BuildQueryOptions = {}
): string | null {
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  if (typeof value === "boolean")
    return String(booleanAsNumber ? Number(value) : value)
  return null
}

export function buildQuery(
  filter: Record<string, unknown>,
  options: BuildQueryOptions = {}
): string {
  const params = new URLSearchParams()
  const trimKeys = new Set(options.trimKeys ?? [])

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null) continue

    const normalized =
      trimKeys.has(key) && typeof value === "string" ? value.trim() : value
    if (normalized === "") continue

    if (Array.isArray(normalized)) {
      for (const item of normalized) {
        const queryValue = queryValueToString(item, options)
        if (queryValue !== null) params.append(key, queryValue)
      }
      continue
    }

    const queryValue = queryValueToString(normalized, options)
    if (queryValue !== null) params.append(key, queryValue)
  }

  const query = params.toString()
  return query ? `?${query}` : ""
}
