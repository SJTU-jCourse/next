import { useState, type SyntheticEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CourseDetailDTO } from "@/api/course"
import { useUpdateCourseModeratorRemark } from "@/hooks/use-course"

interface CourseModeratorRemarkDialogProps {
  course: CourseDetailDTO
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseModeratorRemarkDialog({
  course,
  open,
  onOpenChange,
}: CourseModeratorRemarkDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <CourseModeratorRemarkForm
          key={`${course.id}-${open ? (course.moderator_remark ?? "") : "closed"}`}
          course={course}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}

function CourseModeratorRemarkForm({
  course,
  onOpenChange,
}: Pick<CourseModeratorRemarkDialogProps, "course" | "onOpenChange">) {
  const [remark, setRemark] = useState(course.moderator_remark ?? "")
  const [error, setError] = useState<string | null>(null)
  const { mutateAsync, isPending } = useUpdateCourseModeratorRemark()

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    try {
      await mutateAsync({
        courseID: course.id,
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
        <DialogTitle>管理员备注</DialogTitle>
        <DialogDescription>
          {course.code} {course.name} 的备注会对所有用户可见。
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor={`course-moderator-remark-${course.id}`}>备注内容</Label>
        <Textarea
          id={`course-moderator-remark-${course.id}`}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={5}
          className="resize-y text-sm"
          placeholder="填写管理员备注，清空后保存可移除备注"
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
          {isPending ? "保存中..." : "保存备注"}
        </Button>
      </DialogFooter>
    </form>
  )
}
