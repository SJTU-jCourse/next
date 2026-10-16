import { useState, type SyntheticEvent } from "react"
import { RiShieldUserLine } from "@remixicon/react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateReviewModeratorRemark } from "@/hooks/use-review"
import type { ReviewDTO } from "@/api/review"
import { toUserMessage } from "@/lib/error-message"

interface ModeratorRemarkDialogProps {
  review: ReviewDTO
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModeratorRemarkDialog({
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

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      await mutateAsync({
        reviewID: review.id,
        cmd: { moderator_remark: remark },
      })
      onOpenChange(false)
      toast.success(remark.trim() ? "已保存管理员备注" : "已移除管理员备注")
    } catch (err) {
      setError(toUserMessage(err, "保存失败，请稍后再试"))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>管理员备注</DialogTitle>
        <DialogDescription>
          点评 #{review.id} 的备注对所有用户可见。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor={`moderator-remark-${review.id}`}>备注内容</Label>
        <Textarea
          id={`moderator-remark-${review.id}`}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={5}
          className="resize-y text-sm"
          placeholder="填写管理员备注，清空后保存即可移除"
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
          {isPending ? "保存中…" : "保存备注"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ModeratorRemarkBanner({ remark }: { remark: string }) {
  const trimmed = remark.trim()
  if (!trimmed) return null

  return (
    <Alert variant="info" role="note">
      <RiShieldUserLine />
      <AlertTitle>管理员备注</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap text-foreground/90">
        {trimmed}
      </AlertDescription>
    </Alert>
  )
}
