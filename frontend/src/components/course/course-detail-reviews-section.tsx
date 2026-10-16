import { Link } from "@tanstack/react-router"
import { RiAddLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { ReviewCard } from "@/components/review/review-card"
import { ReviewList } from "@/components/review/review-list"
import { PaginationComponent } from "@/components/common/pagination"
import { CourseReviewFilters } from "./course-review-filters"
import { CourseReviewTrendDialog } from "./course-review-trend-dialog"
import type {
  CourseDetailDTO,
  CourseReviewFilters as CourseReviewFiltersDTO,
} from "@/api/course"
import type { ReviewDTO } from "@/api/review"

type ReviewsPageData = {
  items: ReviewDTO[]
  total: number
  page: number
  page_size: number
}

interface CourseDetailReviewsSectionProps {
  course: CourseDetailDTO
  reviews?: ReviewsPageData
  listedReviews: ReviewDTO[]
  reviewsLoading: boolean
  reviewsError?: unknown
  onRetryReviews?: () => void
  reviewFilters?: CourseReviewFiltersDTO
  semester?: string
  rating?: number
  orderBy: "created_at" | "updated_at" | "like_count"
  onFilterChange: (next: Record<string, string | undefined>) => void
  onPageChange: (page: number) => void
}

export function CourseDetailReviewsSection({
  course,
  reviews,
  listedReviews,
  reviewsLoading,
  reviewsError,
  onRetryReviews,
  reviewFilters,
  semester,
  rating,
  orderBy,
  onFilterChange,
  onPageChange,
}: CourseDetailReviewsSectionProps) {
  return (
    <section>
      {course.my_review && (
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">我的点评</h2>
          <div className="border-t">
            <ReviewCard review={course.my_review} />
          </div>
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">课程点评</h2>
          {reviews && (
            <p className="text-sm text-muted-foreground">
              共 {reviews.total} 条点评
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <CourseReviewTrendDialog
            courseID={course.id}
            courseName={course.name}
          />
          {!course.my_review && (
            <Button asChild size="sm">
              <Link
                to="/course/$courseID/review/new"
                params={{ courseID: String(course.id) }}
              >
                <RiAddLine data-icon="inline-start" />
                写点评
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <CourseReviewFilters
          semesters={reviewFilters?.semesters}
          ratings={reviewFilters?.ratings}
          value={{ semester, rating, orderBy }}
          onChange={(next) => {
            const params: Record<string, string | undefined> = {}
            if ("semester" in next) params.semester = next.semester
            if ("rating" in next) {
              params.rating =
                next.rating === undefined ? undefined : String(next.rating)
            }
            if ("orderBy" in next) params.order_by = next.orderBy
            onFilterChange(params)
          }}
        />
      </div>
      <ReviewList
        reviews={listedReviews}
        isLoading={reviewsLoading}
        error={reviews ? undefined : reviewsError}
        onRetry={onRetryReviews}
        emptyText={
          semester || rating
            ? "没有符合筛选条件的点评"
            : course.my_review
              ? "还没有其他点评"
              : "还没有点评，来写第一条吧"
        }
      />

      {reviews && reviews.total > 0 && (
        <div className="flex justify-center pt-4">
          <PaginationComponent
            page={reviews.page}
            pageSize={reviews.page_size}
            total={reviews.total}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </section>
  )
}
