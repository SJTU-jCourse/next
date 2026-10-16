import {
  getRouteApi,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router"
import { RiArrowLeftLine } from "@remixicon/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { CourseHeaderMeta } from "@/components/course/course-header-meta"
import { ReviewForm } from "@/components/review/review-form"
import { ErrorState, NotFoundState } from "@/components/common/error-state"
import { useCourseDetail } from "@/hooks/use-course"
import { useReview, useUpdateReview } from "@/hooks/use-review"
import { useAuth } from "@/contexts/auth-context"
import { getCourseSemesters } from "@/lib/course-semesters"
import { isNotFoundError } from "@/lib/error-message"
import type { CreateReviewCommand, UpdateReviewCommand } from "@/api/review"

const routeApi = getRouteApi("/app/review/$reviewID/edit")

export function EditReviewPage() {
  const { reviewID } = routeApi.useParams()
  const id = Number(reviewID)
  const navigate = useNavigate()
  const router = useRouter()
  const { user } = useAuth()
  const { data: review, isLoading, error, refetch } = useReview(id)
  const { data: course } = useCourseDetail(review?.course_id ?? 0)
  const { mutateAsync, isPending } = useUpdateReview()
  const semesters = course ? getCourseSemesters(course) : undefined

  async function handleSubmit(cmd: CreateReviewCommand | UpdateReviewCommand) {
    await mutateAsync({ reviewID: id, cmd: cmd as UpdateReviewCommand })
    toast.success("已保存修改")
    await navigate({
      to: "/review/$reviewID",
      params: { reviewID: String(id) },
    })
  }

  if (!isLoading && !review) {
    return (
      <>
        <PageTitle>编辑点评</PageTitle>
        <PageShell>
          {error && !isNotFoundError(error) ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <NotFoundState
              title="点评不存在"
              description="这条点评可能已被删除"
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/review">返回点评列表</Link>
                </Button>
              }
            />
          )}
        </PageShell>
      </>
    )
  }

  if (isLoading || !review) {
    return (
      <>
        <PageTitle>编辑点评</PageTitle>
        <PageShell>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-64 w-full" />
          </div>
        </PageShell>
      </>
    )
  }

  const displayCourse = course ?? review.course

  return (
    <>
      <PageTitle>编辑点评</PageTitle>
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/review/$reviewID" params={{ reviewID: String(id) }}>
            <RiArrowLeftLine data-icon="inline-start" />
            返回点评
          </Link>
        </Button>

        <section className="max-w-3xl space-y-4">
          <div className="space-y-4">
            <h1 className="text-sm font-medium text-muted-foreground">
              编辑点评
            </h1>
            {displayCourse && (
              <CourseHeaderMeta course={displayCourse} headingAs="h2" />
            )}
          </div>

          <ReviewForm
            initialReview={review}
            semesters={semesters}
            onSubmit={handleSubmit}
            onCancel={() => router.history.back()}
            isSubmitting={isPending}
            draftUserID={user?.id}
          />
        </section>
      </PageShell>
    </>
  )
}
