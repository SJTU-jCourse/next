import { Link } from "@tanstack/react-router"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { ReviewList } from "@/components/review/review-list"
import { HotCourseList } from "@/components/course/hot-course-list"
import { FollowedCourseList } from "@/components/course/followed-course-list"
import { brand } from "@/config/brand"
import { useReviews } from "@/hooks/use-review"
import { SectionHeader } from "@/components/common/page-header"
import { sectionLinkClassName } from "@/lib/styles"

export function HomePage() {
  const {
    data: reviewsData,
    isLoading: reviewsLoading,
    error: reviewsError,
    refetch: refetchReviews,
  } = useReviews({
    page: 1,
    page_size: 20,
  })

  return (
    <>
      <PageTitle />
      <PageShell>
        <h1 className="sr-only">{brand.name}</h1>
        <div className="space-y-6 lg:flex lg:gap-8 lg:space-y-0">
          <div className="min-w-0 flex-1 space-y-4">
            <SectionHeader
              title="最新点评"
              actions={
                <Link to="/review" className={sectionLinkClassName}>
                  查看更多
                </Link>
              }
            />
            <ReviewList
              reviews={reviewsData?.items ?? []}
              isLoading={reviewsLoading}
              showCourse
              error={reviewsData ? undefined : reviewsError}
              onRetry={() => void refetchReviews()}
            />
          </div>

          <div className="w-full shrink-0 space-y-4 lg:w-2/5 lg:border-l lg:pl-8 xl:w-1/3">
            <SectionHeader
              title="热门课程"
              actions={
                <Link to="/course/hot" className={sectionLinkClassName}>
                  查看更多
                </Link>
              }
            />
            <HotCourseList period="week" limit={10} skeletonCount={10} />

            <SectionHeader
              className="pt-2"
              title="已关注课程"
              actions={
                <Link
                  to="/course/mine"
                  search={{ type: "followed" }}
                  className={sectionLinkClassName}
                >
                  查看更多
                </Link>
              }
            />
            <FollowedCourseList limit={10} skeletonCount={10} />
          </div>
        </div>
      </PageShell>
    </>
  )
}
