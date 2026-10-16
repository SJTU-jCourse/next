import { PageShell } from "@/components/layout/page-shell"
import { PageHeader } from "@/components/common/page-header"
import { PageTitle } from "@/components/common/page-title"
import { ReviewList } from "@/components/review/review-list"
import { PaginationComponent } from "@/components/common/pagination"
import { useFollowedReviews } from "@/hooks/use-review"
import { getRouteApi, useNavigate } from "@tanstack/react-router"

const routeApi = getRouteApi("/app/review/followed")

export function FollowedReviewsPage() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/review/followed" })
  const page = search.page ?? 1
  const { data, isLoading, error, refetch } = useFollowedReviews({
    page,
    page_size: 20,
  })

  function handlePageChange(page: number) {
    void navigate({
      search: (prev) => ({ ...prev, page }),
      resetScroll: false,
    })
  }

  return (
    <>
      <PageTitle>关注动态</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <PageHeader title="关注动态" description="查看你关注课程的最新点评" />

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
            emptyText="暂无关注动态"
            emptyDescription="关注课程后，这里会显示它们的新点评"
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
