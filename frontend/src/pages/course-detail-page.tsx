import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { RiArrowLeftLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { ErrorState, NotFoundState } from "@/components/common/error-state"
import { CourseDetailOverview } from "@/components/course/course-detail-overview"
import { CourseDetailReviewsSection } from "@/components/course/course-detail-reviews-section"
import { RelatedCoursesSidebar } from "@/components/course/related-courses-sidebar"
import {
  buildFeedbackMailto,
  REVIEW_PAGE_SIZE,
} from "@/components/course/course-detail-utils"
import {
  useCourseDetail,
  useCourseReviewFilters,
  useCourseReviews,
} from "@/hooks/use-course"
import { useAuth } from "@/contexts/auth-context"
import { getCourseSemesters } from "@/lib/course-semesters"
import { isNotFoundError } from "@/lib/error-message"
import { cn } from "@/lib/utils"

const routeApi = getRouteApi("/app/course/$courseID")

export function CourseDetailPage() {
  const { courseID } = routeApi.useParams()
  const id = Number(courseID)
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/course/$courseID" })

  const reviewPage = Math.max(1, search.page ?? 1)
  const semester = search.semester
  const parsedRating = search.rating
  const rating =
    parsedRating && parsedRating >= 1 && parsedRating <= 5
      ? parsedRating
      : undefined
  const orderBy = search.order_by === "like_count" ? "like_count" : "updated_at"

  const { user } = useAuth()
  const { data: course, isLoading, error, refetch } = useCourseDetail(id)
  const { data: reviewFilters } = useCourseReviewFilters(id)
  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useCourseReviews(id, {
    semester,
    rating,
    order_by: orderBy,
    page: reviewPage,
    page_size: REVIEW_PAGE_SIZE,
  })

  function updateReviewParams(next: Record<string, string | undefined>) {
    void navigate({
      search: (prev) => ({
        ...prev,
        semester: "semester" in next ? next.semester : prev.semester,
        rating:
          "rating" in next
            ? next.rating === undefined
              ? undefined
              : Number(next.rating)
            : prev.rating,
        order_by:
          "order_by" in next
            ? next.order_by === "like_count" ||
              next.order_by === "created_at" ||
              next.order_by === "updated_at"
              ? next.order_by
              : undefined
            : prev.order_by,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  function handlePageChange(page: number) {
    void navigate({
      search: (prev) => ({ ...prev, page }),
      resetScroll: true,
    })
  }

  if (isLoading) {
    return (
      <>
        <PageTitle>课程</PageTitle>
        <PageShell>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </PageShell>
      </>
    )
  }

  if (!course) {
    return (
      <>
        <PageTitle>课程</PageTitle>
        <PageShell>
          {error && !isNotFoundError(error) ? (
            <ErrorState error={error} onRetry={() => void refetch()} />
          ) : (
            <NotFoundState
              title="课程不存在"
              description="该课程可能已下线，或链接有误"
              action={
                <Button asChild variant="outline" size="sm">
                  <Link to="/course">返回课程列表</Link>
                </Button>
              }
            />
          )}
        </PageShell>
      </>
    )
  }

  const listedReviews =
    reviews?.items.filter((review) => review.id !== course.my_review?.id) ?? []
  const courseSemesters = getCourseSemesters(course)
  const selectedSemesters = [
    ...new Set((course.my_enrollments ?? []).map((item) => item.semester)),
  ].sort((a, b) => b.localeCompare(a))
  const feedbackMailto = buildFeedbackMailto(course)
  const isAdmin = user?.is_admin() ?? false
  const hasRelatedCourses =
    course.same_code_courses.length > 0 ||
    course.same_teacher_courses.length > 0

  return (
    <>
      <PageTitle>{course.name}</PageTitle>
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/course">
            <RiArrowLeftLine data-icon="inline-start" />
            返回课程列表
          </Link>
        </Button>

        <div
          className={cn(
            "space-y-6",
            hasRelatedCourses && "lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0"
          )}
        >
          <div
            className={cn("space-y-6", hasRelatedCourses && "lg:col-span-2")}
          >
            <CourseDetailOverview
              course={course}
              courseSemesters={courseSemesters}
              selectedSemesters={selectedSemesters}
              feedbackMailto={feedbackMailto}
              isAdmin={isAdmin}
            />

            <CourseDetailReviewsSection
              course={course}
              reviews={reviews}
              listedReviews={listedReviews}
              reviewsLoading={reviewsLoading}
              reviewsError={reviewsError}
              onRetryReviews={() => void refetchReviews()}
              reviewFilters={reviewFilters}
              semester={semester}
              rating={rating}
              orderBy={orderBy}
              onFilterChange={updateReviewParams}
              onPageChange={handlePageChange}
            />
          </div>

          {hasRelatedCourses && <RelatedCoursesSidebar course={course} />}
        </div>
      </PageShell>
    </>
  )
}
