import { RiFireLine } from "@remixicon/react"
import { CourseCompactCard } from "./course-compact-card"
import type { HotCourseListDTO } from "@/api/course"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { useHotCourses } from "@/hooks/use-course"
import { cn } from "@/lib/utils"

interface HotCourseListProps {
  period: "week" | "month"
  limit: number
  skeletonCount?: number
  data?: HotCourseListDTO
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  fetchData?: boolean
}

function HotCourseHeader() {
  return (
    <div className="flex items-center gap-1 border-b px-0 py-2 text-sm font-medium text-muted-foreground">
      <span className="shrink-0 text-center whitespace-nowrap">排名</span>
      <span className="min-w-0 flex-1 pl-2">课程</span>
      <span className="w-10 shrink-0 text-right">热度</span>
    </div>
  )
}

function HotCourseSkeleton({ count }: { count: number }) {
  return (
    <div>
      <HotCourseHeader />
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-1 border-b p-3">
          <Skeleton className="h-6 w-7 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  )
}

export function HotCourseList({
  period,
  limit,
  skeletonCount = 5,
  data: providedData,
  isLoading: providedIsLoading,
  error: providedError,
  onRetry,
  fetchData = true,
}: HotCourseListProps) {
  const query = useHotCourses(period, limit, fetchData)
  const data = providedData ?? query.data
  const isLoading = providedIsLoading ?? query.isLoading
  const error = fetchData ? query.error : providedError

  if (isLoading) return <HotCourseSkeleton count={skeletonCount} />

  if (!data && error) {
    return (
      <ErrorState
        error={error}
        onRetry={
          onRetry ?? (fetchData ? () => void query.refetch() : undefined)
        }
      />
    )
  }

  const items = data?.items ?? []
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<RiFireLine />}
        title="暂无热门课程"
        description="这段时间还没有足够的点评数据"
      />
    )
  }

  return (
    <div>
      <HotCourseHeader />
      {items.map((item, i) => (
        <div key={item.course.id} className="flex items-center gap-1 border-b">
          <span
            className={cn(
              "w-7 shrink-0 text-center text-sm font-bold",
              i < 3 ? "text-rating" : "text-muted-foreground"
            )}
          >
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <CourseCompactCard course={item.course} bordered={false} />
          </div>
          <div className="w-10 shrink-0 text-right text-sm font-medium text-muted-foreground">
            {item.score}
          </div>
        </div>
      ))}
    </div>
  )
}
