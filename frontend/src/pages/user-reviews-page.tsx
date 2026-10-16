import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { PageHeader } from "@/components/common/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { ReviewList } from "@/components/review/review-list"
import { PaginationComponent } from "@/components/common/pagination"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useUserReviews } from "@/hooks/use-review"

const PAGE_SIZE = 20
const routeApi = getRouteApi("/app/review/mine")

export function UserReviewsPage() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/review/mine" })
  const page = Math.max(1, search.page ?? 1)
  const { user, isLoading: authLoading } = useAuth()
  const { data, isLoading, error, refetch } = useUserReviews(user?.id ?? 0, {
    page,
    page_size: PAGE_SIZE,
  })

  function handlePageChange(page: number) {
    void navigate({
      search: (prev) => ({ ...prev, page }),
      resetScroll: false,
    })
  }

  return (
    <>
      <PageTitle>我的点评</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <PageHeader title="我的点评" description="查看和管理你发布的点评" />

          {!authLoading && !user && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">登录后可查看我的点评</p>
              <Button asChild variant="link" className="mt-2">
                <Link to="/login">登录</Link>
              </Button>
            </div>
          )}

          {user && data && (
            <p className="text-sm text-muted-foreground">
              共 {data.total} 条点评
            </p>
          )}

          {user && (
            <ReviewList
              reviews={data?.items ?? []}
              isLoading={authLoading || isLoading}
              showCourse
              error={data ? undefined : error}
              onRetry={() => void refetch()}
              emptyText="暂无点评"
              emptyDescription="在课程页点击「写点评」，分享你的上课体验"
            />
          )}

          {user && data && data.total > 0 && (
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
