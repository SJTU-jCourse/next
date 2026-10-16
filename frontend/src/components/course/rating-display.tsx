import { StarRow } from "@/components/review/rating-stars"
import type { RatingInfoDTO } from "@/api/course"

interface RatingDisplayProps {
  rating: RatingInfoDTO
  size?: "sm" | "md"
}

export function RatingDisplay({ rating, size = "md" }: RatingDisplayProps) {
  const sizeClass = size === "sm" ? "size-3" : "size-3.5"

  return (
    <div className="flex flex-col max-sm:items-center">
      <div className="flex items-center gap-1.5 max-sm:flex-col max-sm:gap-0.5">
        <StarRow value={rating.avg} starClassName={sizeClass} />
        {rating.avg > 0 ? (
          <span className="text-sm font-medium">{rating.avg.toFixed(1)}</span>
        ) : (
          <span className="text-sm text-muted-foreground">暂无评分</span>
        )}
      </div>
      <span className="text-center text-sm text-muted-foreground">
        {rating.count} 条点评
      </span>
    </div>
  )
}
