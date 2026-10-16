import { useState } from "react"
import {
  RiThumbUpFill,
  RiThumbUpLine,
  RiThumbDownFill,
  RiThumbDownLine,
} from "@remixicon/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useVoteReview } from "@/hooks/use-review"
import { VoteLike, VoteDislike, VoteNeutral, type VoteType } from "@/api/review"
import { toUserMessage } from "@/lib/error-message"
import { cn } from "@/lib/utils"

interface VoteButtonsProps {
  reviewID: number
  likeCount: number
  dislikeCount: number
  myVote?: number
}

export function VoteButtons({
  reviewID,
  likeCount,
  dislikeCount,
  myVote,
}: VoteButtonsProps) {
  const [optimisticVote, setOptimisticVote] = useState<number | undefined>(
    myVote
  )
  const { mutate, isPending } = useVoteReview()

  const cast = (next: VoteType) => {
    const final = optimisticVote === next ? VoteNeutral : next
    const previous = optimisticVote
    setOptimisticVote(final)
    mutate(
      { reviewID, voteType: final },
      {
        onError: (err) => {
          setOptimisticVote(previous)
          toast.error(toUserMessage(err, "投票失败，请稍后再试"))
        },
      }
    )
  }

  const liked = optimisticVote === VoteLike
  const disliked = optimisticVote === VoteDislike

  const adjustedLike =
    likeCount +
    (liked && myVote !== VoteLike ? 1 : 0) -
    (myVote === VoteLike && !liked ? 1 : 0)
  const adjustedDislike =
    dislikeCount +
    (disliked && myVote !== VoteDislike ? 1 : 0) -
    (myVote === VoteDislike && !disliked ? 1 : 0)

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => cast(VoteLike)}
        aria-pressed={liked}
        aria-label={`有用，${adjustedLike} 人`}
        title="有用"
        className={cn(
          "gap-1 hover:text-inherit",
          liked && "text-primary hover:text-primary"
        )}
      >
        {liked ? (
          <RiThumbUpFill data-icon="inline-start" />
        ) : (
          <RiThumbUpLine data-icon="inline-start" />
        )}
        <span className="text-sm tabular-nums">{adjustedLike}</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => cast(VoteDislike)}
        aria-pressed={disliked}
        aria-label={`没用，${adjustedDislike} 人`}
        title="没用"
        className={cn(
          "gap-1 hover:text-inherit",
          disliked && "text-destructive hover:text-destructive"
        )}
      >
        {disliked ? (
          <RiThumbDownFill data-icon="inline-start" />
        ) : (
          <RiThumbDownLine data-icon="inline-start" />
        )}
        <span className="text-sm tabular-nums">{adjustedDislike}</span>
      </Button>
    </div>
  )
}
