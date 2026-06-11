import { Link } from "@tanstack/react-router"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { ReviewList } from "@/components/review/review-list"
import { HotCourseList } from "@/components/course/hot-course-list"
import { FollowedCourseList } from "@/components/course/followed-course-list"
import { useReviews } from "@/hooks/use-review"

export function HomePage() {
  const { data: reviewsData, isLoading: reviewsLoading } = useReviews({
    page: 1,
    page_size: 10,
  })

  return (
    <>
      <PageTitle />
      <PageShell>
        <div className="space-y-4 lg:flex lg:gap-4 lg:space-y-0">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">最新点评</h2>
              <Link
                to="/review"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                查看更多
              </Link>
            </div>
            <ReviewList
              reviews={reviewsData?.items ?? []}
              isLoading={reviewsLoading}
              showCourse
            />
          </div>

          <div className="w-full shrink-0 space-y-4 lg:w-1/3 lg:border-l lg:pl-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">热门课程</h2>
              <Link
                to="/course/hot"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                查看更多
              </Link>
            </div>
            <HotCourseList period="week" limit={10} skeletonCount={10} />

            <div className="flex items-center justify-between pt-2">
              <h2 className="text-lg font-semibold">已关注课程</h2>
              <Link
                to="/course/mine"
                search={{ type: "followed" }}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                查看更多
              </Link>
            </div>
            <FollowedCourseList limit={10} skeletonCount={10} />
          </div>
        </div>
      </PageShell>
    </>
  )
}
