import { useCallback } from "react"
import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { DebouncedSearchInput } from "@/components/common/debounced-search-input"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { ReviewList } from "@/components/review/review-list"
import { PaginationComponent } from "@/components/common/pagination"
import { useReviews } from "@/hooks/use-review"

const REVIEW_PAGE_SIZE = 20
const REVIEW_SEARCH_DEBOUNCE_MS = 250
const routeApi = getRouteApi("/app/review")

export function ReviewsPage() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/review" })
  const page = Math.max(1, search.page ?? 1)
  const q = (search.q ?? "").trim()
  const { data, isLoading, error, refetch } = useReviews({
    q: q || undefined,
    page,
    page_size: REVIEW_PAGE_SIZE,
  })

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

  function handlePageChange(page: number) {
    void navigate({
      search: (prev) => ({ ...prev, page }),
      resetScroll: true,
    })
  }

  return (
    <>
      <PageTitle>点评</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">点评</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              浏览和搜索所有课程点评
            </p>
          </div>

          <DebouncedSearchInput
            placeholder="搜索点评内容"
            value={q}
            debounceMs={REVIEW_SEARCH_DEBOUNCE_MS}
            onDebouncedChange={handleSearchChange}
          />

          {data && (
            <p className="text-sm text-muted-foreground">
              共 {data.total} 条点评
            </p>
          )}

          <ReviewList
            reviews={data?.items ?? []}
            isLoading={isLoading}
            showCourse
            error={data ? undefined : error}
            onRetry={() => void refetch()}
            emptyText={q ? "没有找到相关点评" : "暂无点评"}
            emptyDescription={q ? "试试换个关键词" : undefined}
          />

          {data && data.total > 0 && (
            <div className="flex justify-center pt-4">
              <PaginationComponent
                page={data.page}
                pageSize={data.page_size}
                total={data.total}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </PageShell>
    </>
  )
}
