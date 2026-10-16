import { getRouteApi, useNavigate, useRouter } from "@tanstack/react-router"
import { RiArrowLeftLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ReviewCard } from "@/components/review/review-card"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { ErrorState, NotFoundState } from "@/components/common/error-state"
import { useReview } from "@/hooks/use-review"
import { isNotFoundError } from "@/lib/error-message"

const routeApi = getRouteApi("/app/review/$reviewID")

export function ReviewDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const { reviewID } = routeApi.useParams()
  const id = Number(reviewID)
  const { data: review, isLoading, error, refetch } = useReview(id)

  function handleBack() {
    if (router.history.canGoBack()) {
      router.history.back()
      return
    }

    void navigate({ to: "/review" })
  }

  if (isLoading) {
    return (
      <>
        <PageTitle>点评</PageTitle>
        <PageShell>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2"
            onClick={handleBack}
          >
            <RiArrowLeftLine data-icon="inline-start" />
            返回上一页
          </Button>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </PageShell>
      </>
    )
  }

  if (!review) {
    return (
      <>
        <PageTitle>点评</PageTitle>
        <PageShell>
          {error && !isNotFoundError(error) ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <NotFoundState
              title="点评不存在"
              description="该点评可能已被删除，或链接有误"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBack}
                >
                  返回上一页
                </Button>
              }
            />
          )}
        </PageShell>
      </>
    )
  }

  return (
    <>
      <PageTitle>点评</PageTitle>
      <PageShell>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={handleBack}
        >
          <RiArrowLeftLine data-icon="inline-start" />
          返回上一页
        </Button>

        <div className="space-y-4">
          <ReviewCard review={review} showCourse showVoteButtons />
        </div>
      </PageShell>
    </>
  )
}
