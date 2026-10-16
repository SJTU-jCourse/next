import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  formatDateTime,
  formatReviewCardTime,
  isReviewCardTimeRelative,
} from "@/lib/date"
import { ReviewRevisionsDialog } from "./review-revisions-dialog"
import type { ReviewDTO } from "@/api/review"

function isEdited(review: ReviewDTO) {
  if (!review.updated_at || !review.created_at) return false
  return (
    new Date(review.updated_at).getTime() -
      new Date(review.created_at).getTime() >
    1000
  )
}

export function ReviewCardTime({ review }: { review: ReviewDTO }) {
  const { user } = useAuth()
  const [revisionsOpen, setRevisionsOpen] = useState(false)
  const [showAbsoluteTime, setShowAbsoluteTime] = useState(false)
  const edited = isEdited(review)
  const displayTime = edited ? review.updated_at : review.created_at
  const hasRelativeTime = isReviewCardTimeRelative(displayTime)
  const displayTimeText =
    hasRelativeTime && !showAbsoluteTime
      ? formatReviewCardTime(displayTime)
      : formatDateTime(displayTime)
  const displayTimeTitle = formatDateTime(displayTime)
  const createdTimeTitle = `创建于 ${formatDateTime(review.created_at)}`
  const canViewRevisions = edited && (user?.is_admin() ?? false)

  const timeNode = hasRelativeTime ? (
    <button
      type="button"
      className="rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      title={displayTimeTitle}
      onClick={() => setShowAbsoluteTime((value) => !value)}
    >
      {displayTimeText}
    </button>
  ) : (
    <span className="text-muted-foreground" title={displayTimeTitle}>
      {displayTimeText}
    </span>
  )

  const editedNode = edited ? (
    canViewRevisions ? (
      <button
        type="button"
        className="ml-1 rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        title={createdTimeTitle}
        onClick={() => setRevisionsOpen(true)}
      >
        （已编辑）
      </button>
    ) : (
      <span className="ml-1 text-muted-foreground/70" title={createdTimeTitle}>
        （已编辑）
      </span>
    )
  ) : null

  return (
    <div className="ml-auto flex items-center text-sm tabular-nums">
      {timeNode}
      {editedNode}
      {canViewRevisions && (
        <ReviewRevisionsDialog
          review={review}
          open={revisionsOpen}
          onOpenChange={setRevisionsOpen}
        />
      )}
    </div>
  )
}
