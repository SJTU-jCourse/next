import { RiCloseLine } from "@remixicon/react"
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
import type { CourseListItemDTO } from "@/api/course"

export function CourseNotificationDeleteAction({
  course,
  actionName,
  onDelete,
}: {
  course: CourseListItemDTO
  /** 例如“取消关注”“取消屏蔽” */
  actionName: string
  onDelete: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost-destructive"
          size="icon-sm"
          aria-label={`${actionName}「${course.name}」`}
        >
          <RiCloseLine />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{actionName}？</AlertDialogTitle>
          <AlertDialogDescription>
            将{actionName}「{course.name}」，之后可在课程页重新设置关注状态。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            {actionName}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
