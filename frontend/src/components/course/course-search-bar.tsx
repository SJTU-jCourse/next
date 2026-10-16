import { useCallback } from "react"
import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { DebouncedSearchInput } from "@/components/common/debounced-search-input"

const SEARCH_DEBOUNCE_MS = 250
const routeApi = getRouteApi("/app/course")

export function CourseSearchBar() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/course" })
  const q = (search.q ?? "").trim()

  const handleSearchChange = useCallback(
    (value: string) => {
      const nextQ = value.trim()
      if (nextQ === q) return

      void navigate({
        search: (prev) => ({
          ...prev,
          q: nextQ || undefined,
          page: 1,
        }),
        replace: true,
        resetScroll: false,
      })
    },
    [navigate, q]
  )

  return (
    <DebouncedSearchInput
      placeholder="搜索课程名、课程号或教师姓名"
      value={q}
      debounceMs={SEARCH_DEBOUNCE_MS}
      onDebouncedChange={handleSearchChange}
    />
  )
}
