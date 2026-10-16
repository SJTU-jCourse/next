import { RiUserLine } from "@remixicon/react"
import { TeacherCard } from "./teacher-card"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { TeacherDTO } from "@/api/teacher"

interface TeacherListProps {
  teachers: TeacherDTO[]
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
}

function TeacherCardSkeleton() {
  return (
    <div className="space-y-2 border-b p-2">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-40" />
    </div>
  )
}

export function TeacherList({
  teachers,
  isLoading,
  error,
  onRetry,
  emptyTitle = "暂无教师",
  emptyDescription,
}: TeacherListProps) {
  if (isLoading) {
    return (
      <div className="border-t">
        {Array.from({ length: 6 }).map((_, i) => (
          <TeacherCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={<RiUserLine />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="border-t">
      {teachers.map((teacher) => (
        <TeacherCard key={teacher.id} teacher={teacher} />
      ))}
    </div>
  )
}
