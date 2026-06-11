import { useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { RiEditLine, RiShareLine, RiWrenchLine } from "@remixicon/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import {
  useDeleteReview,
  useUpdateReviewModeratorRemark,
} from "@/hooks/use-review"
import {
  formatDateTime,
  formatReviewCardTime,
  isReviewCardTimeRelative,
} from "@/lib/date"
import { VoteButtons } from "./vote-buttons"
import { ReviewContent } from "./review-content"
import { ReviewRevisionsDialog } from "./review-revisions-dialog"
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

function isEdited(review: ReviewDTO) {
  if (!review.updated_at || !review.created_at) return false
  return (
    new Date(review.updated_at).getTime() -
      new Date(review.created_at).getTime() >
    1000
  )
}

function ReviewCardTime({ review }: { review: ReviewDTO }) {
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
        (已修改)
      </button>
    ) : (
      <span className="ml-1 text-muted-foreground/70" title={createdTimeTitle}>
        (已修改)
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

async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.top = "0"
  textarea.style.left = "0"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  try {
    const copied = document.execCommand("copy")
    if (!copied) throw new Error("Copy command failed")
  } finally {
    document.body.removeChild(textarea)
  }
}

interface ModeratorRemarkDialogProps {
  review: ReviewDTO
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ModeratorRemarkDialog({
  review,
  open,
  onOpenChange,
}: ModeratorRemarkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <ModeratorRemarkForm
          key={`${review.id}-${open ? review.moderator_remark : "closed"}`}
          review={review}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}

function ModeratorRemarkForm({
  review,
  onOpenChange,
}: Pick<ModeratorRemarkDialogProps, "review" | "onOpenChange">) {
  const [remark, setRemark] = useState(review.moderator_remark ?? "")
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useUpdateReviewModeratorRemark()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await mutateAsync({
        reviewID: review.id,
        cmd: { moderator_remark: remark },
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>管理员批注</DialogTitle>
        <DialogDescription>
          点评 #{review.id} 的批注会对所有用户可见。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor={`moderator-remark-${review.id}`}>批注内容</Label>
        <Textarea
          id={`moderator-remark-${review.id}`}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={5}
          className="resize-y text-sm"
          placeholder="填写管理员批注，清空后保存可移除批注"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
        >
          取消
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "保存中..." : "保存批注"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function ModeratorRemarkBanner({ remark }: { remark: string }) {
  const trimmed = remark.trim()
  if (!trimmed) return null

  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-sm">
      <div className="whitespace-pre-wrap text-foreground/90">{trimmed}</div>
    </div>
  )
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
    await copyText(getReviewUrl(review.id))
    setCopied(true)
    window.clearTimeout(resetCopiedTimer.current)
    resetCopiedTimer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  async function handleDelete() {
    await deleteReview(review.id)
  }

  function handleManageMenuOpenChange(open: boolean) {
    if (open && manageMenuTriggerRef.current) {
      const rect = manageMenuTriggerRef.current.getBoundingClientRect()
      setManageMenuSide(rect.top < window.innerHeight / 2 ? "bottom" : "top")
    }
    setManageMenuOpen(open)
  }

  return (
    <article className="border-b px-3 py-2.5 transition-colors hover:bg-muted/30">
      <div className="space-y-1.5">
        {showCourse && review.course && (
          <Link
            to="/course/$courseID"
            params={{ courseID: String(review.course.id) }}
            className="-m-1.5 mb-1 flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-muted/50"
          >
            <span className="font-mono text-sm text-muted-foreground">
              {review.course.code}
            </span>
            <span className="font-semibold">{review.course.name}</span>
            <span
              className={`text-sm text-muted-foreground ${
                review.course.main_teacher.name.length >= 3 ? "min-w-[3em]" : ""
              }`}
            >
              {review.course.main_teacher.name}
            </span>
          </Link>
        )}

        <div className="flex items-center gap-1.5">
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

        <div className="flex items-center justify-start gap-1 pt-0.5">
          {showVoteButtons && (
            <VoteButtons
              reviewID={review.id}
              likeCount={review.vote.like_count}
              dislikeCount={review.vote.dislike_count}
              myVote={review.vote.my_vote}
            />
          )}

          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="gap-1 hover:text-inherit"
              aria-label="复制点评链接"
              title="复制点评链接"
            >
              <RiShareLine data-icon="inline-start" />
              {copied && <span className="text-sm">已复制</span>}
            </Button>
            {canEdit && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="size-8 hover:text-inherit"
                aria-label="修改点评"
                title="修改点评"
              >
                <Link
                  to="/review/$reviewID/edit"
                  params={{ reviewID: String(review.id) }}
                >
                  <RiEditLine className="size-4" />
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
                    size="sm"
                    className="size-8 hover:text-inherit"
                  >
                    <RiWrenchLine className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side={manageMenuSide}>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => setRemarkDialogOpen(true)}>
                      {review.moderator_remark ? "修改批注" : "添加批注"}
                    </DropdownMenuItem>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onSelect={(e) => e.preventDefault()}
                      >
                        删除点评
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后无法恢复，确定要删除这条点评吗？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                          onClick={handleDelete}
                        >
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
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
