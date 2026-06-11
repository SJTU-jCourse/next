import { CourseSemesterBadge } from "@/components/course/course-badges"
import { Badge } from "@/components/ui/badge"
import { RatingStars } from "./rating-stars"
import { ReviewMarkdown } from "./review-markdown"

interface ReviewContentProps {
  rating: number
  semester?: string
  score?: string
  content: string
}

export function ReviewContent({
  rating,
  semester,
  score,
  content,
}: ReviewContentProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <RatingStars value={rating} readOnly size="sm" />
        {semester && <CourseSemesterBadge semester={semester} />}
        {score && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>成绩</span>
            <Badge variant="secondary">{score}</Badge>
          </div>
        )}
      </div>

      <ReviewMarkdown content={content} />
    </div>
  )
}
