import { useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  RiCheckLine,
  RiEditLine,
  RiShareLine,
  RiWrenchLine,
} from "@remixicon/react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { useDeleteReview } from "@/hooks/use-review"
import { toUserMessage } from "@/lib/error-message"
import { cn } from "@/lib/utils"
import { VoteButtons } from "./vote-buttons"
import { ReviewContent } from "./review-content"
import { ReviewCardTime } from "./review-card-time"
import {
  ModeratorRemarkBanner,
  ModeratorRemarkDialog,
} from "./moderator-remark-dialog"
import type { ReviewDTO } from "@/api/review"

interface ReviewCardProps {
  review: ReviewDTO
  showCourse?: boolean
  showVoteButtons?: boolean
}

function getReviewUrl(reviewID: number) {
  const path = `/review/${reviewID}`
  if (typeof window === "undefined") return path
  return new URL(path, window.location.origin).toString()
}

async function copyText(text: string) {
  if (!navigator.clipboard?.writeText || !window.isSecureContext) {
    throw new Error("Clipboard API is unavailable")
  }

  await navigator.clipboard.writeText(text)
}

export function ReviewCard({
  review,
  showCourse = false,
  showVoteButtons = true,
}: ReviewCardProps) {
  const { user } = useAuth()
  const { mutateAsync: deleteReview } = useDeleteReview()
  const [copied, setCopied] = useState(false)
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false)
  const [manageMenuOpen, setManageMenuOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [manageMenuSide, setManageMenuSide] = useState<"top" | "bottom">(
    "bottom"
  )
  const manageMenuTriggerRef = useRef<HTMLButtonElement | null>(null)
  const resetCopiedTimer = useRef<number | undefined>(undefined)
  const isAdmin = user?.is_admin() ?? false
  const canEdit =
    review.user_id != null &&
    user != null &&
    (user.id === review.user_id || isAdmin)
  const canManage = isAdmin

  useEffect(() => {
    return () => window.clearTimeout(resetCopiedTimer.current)
  }, [])

  async function handleShare() {
    try {
      await copyText(getReviewUrl(review.id))
      setCopied(true)
      window.clearTimeout(resetCopiedTimer.current)
      resetCopiedTimer.current = window.setTimeout(() => setCopied(false), 1600)
      toast.success("已复制点评链接")
    } catch {
      setCopied(false)
      toast.error("复制失败，请手动复制地址栏中的链接")
    }
  }

  async function handleDelete() {
    try {
      await deleteReview(review.id)
      toast.success("已删除点评")
    } catch (err) {
      toast.error(toUserMessage(err, "删除失败，请稍后再试"))
    }
  }

  function handleManageMenuOpenChange(open: boolean) {
    if (open && manageMenuTriggerRef.current) {
      const rect = manageMenuTriggerRef.current.getBoundingClientRect()
      setManageMenuSide(rect.top < window.innerHeight / 2 ? "bottom" : "top")
    }
    setManageMenuOpen(open)
  }

  return (
    <article className="border-b p-2 transition-colors hover:bg-muted/30">
      <div className="space-y-2">
        {showCourse && review.course && (
          <Link
            to="/course/$courseID"
            params={{ courseID: String(review.course.id) }}
            className="flex items-center gap-2 rounded-md transition-colors hover:bg-muted/50"
          >
            <span className="font-mono text-sm text-muted-foreground">
              {review.course.code}
            </span>
            <span className="font-semibold">{review.course.name}</span>
            <span
              className={cn(
                "text-sm text-muted-foreground",
                review.course.main_teacher.name.length >= 3 && "min-w-[3em]"
              )}
            >
              {review.course.main_teacher.name}
            </span>
          </Link>
        )}

        <div className="flex items-center gap-2">
          <Link
            to="/review/$reviewID"
            params={{ reviewID: String(review.id) }}
            className="font-mono text-sm text-muted-foreground hover:text-foreground"
          >
            #{review.id}
          </Link>
          <ReviewCardTime review={review} />
        </div>

        <ModeratorRemarkBanner remark={review.moderator_remark} />

        <ReviewContent
          rating={review.rating}
          semester={review.semester}
          score={review.score}
          content={review.content}
        />

        <div className="flex items-center justify-start gap-1">
          {showVoteButtons && (
            <VoteButtons
              reviewID={review.id}
              likeCount={review.vote.like_count}
              dislikeCount={review.vote.dislike_count}
              myVote={review.vote.my_vote}
            />
          )}

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleShare}
              className="hover:text-inherit"
              aria-label={copied ? "已复制点评链接" : "复制点评链接"}
              title="复制点评链接"
            >
              {copied ? (
                <RiCheckLine className="text-success" />
              ) : (
                <RiShareLine />
              )}
            </Button>
            {canEdit && (
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className="hover:text-inherit"
                aria-label="编辑点评"
                title="编辑点评"
              >
                <Link
                  to="/review/$reviewID/edit"
                  params={{ reviewID: String(review.id) }}
                >
                  <RiEditLine />
                </Link>
              </Button>
            )}
            {canManage && (
              <DropdownMenu
                open={manageMenuOpen}
                onOpenChange={handleManageMenuOpenChange}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={manageMenuTriggerRef}
                    variant="ghost"
                    size="icon-sm"
                    className="hover:text-inherit"
                    aria-label="管理点评"
                    title="管理点评"
                  >
                    <RiWrenchLine />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side={manageMenuSide}>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => setRemarkDialogOpen(true)}>
                      {review.moderator_remark
                        ? "编辑管理员备注"
                        : "添加管理员备注"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteDialogOpen(true)}
                  >
                    删除点评
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {canManage && (
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>删除点评？</AlertDialogTitle>
                    <AlertDialogDescription>
                      删除后无法恢复，点评 #{review.id} 将不再对任何人显示。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDelete}
                    >
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {isAdmin && (
              <ModeratorRemarkDialog
                review={review}
                open={remarkDialogOpen}
                onOpenChange={setRemarkDialogOpen}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
