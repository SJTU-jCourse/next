import { ReviewCard } from "./review-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { ReviewDTO } from "@/api/review"

interface ReviewListProps {
  reviews: ReviewDTO[]
  isLoading?: boolean
  showCourse?: boolean
  emptyText?: string
}

function ReviewCardSkeleton() {
  return (
    <div className="space-y-2 border-b px-3 py-2.5">
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

  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
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
