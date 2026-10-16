import { RiChat3Line } from "@remixicon/react"
import { ReviewCard } from "./review-card"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import type { ReviewDTO } from "@/api/review"

interface ReviewListProps {
  reviews: ReviewDTO[]
  isLoading?: boolean
  showCourse?: boolean
  emptyText?: string
  emptyDescription?: string
  error?: unknown
  onRetry?: () => void
}

function ReviewCardSkeleton() {
  return (
    <div className="space-y-3 border-b p-2">
      <div className="flex gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

export function ReviewList({
  reviews,
  isLoading,
  showCourse,
  emptyText = "暂无点评",
  emptyDescription,
  error,
  onRetry,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="border-t">
        {Array.from({ length: 4 }).map((_, i) => (
          <ReviewCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<RiChat3Line />}
        title={emptyText}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className="border-t">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} showCourse={showCourse} />
      ))}
    </div>
  )
}
