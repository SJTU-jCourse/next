import type { ReactNode } from "react"
import { RiBookOpenLine } from "@remixicon/react"
import { CourseCard } from "./course-card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import type { CourseListItemDTO } from "@/api/course"

interface CourseListProps {
  courses: CourseListItemDTO[]
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  renderAction?: (course: CourseListItemDTO) => ReactNode
}

function CourseCardSkeleton() {
  return (
    <div className="space-y-2 border-b p-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function CourseList({
  courses,
  isLoading,
  error,
  onRetry,
  emptyTitle = "暂无课程",
  emptyDescription,
  renderAction,
}: CourseListProps) {
  if (isLoading) {
    return (
      <div className="border-t">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={<RiBookOpenLine />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="border-t">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          action={renderAction?.(course)}
        />
      ))}
    </div>
  )
}
