import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { CourseBadges, CourseSemesterBadge } from "./course-badges"
import { RatingDisplay } from "./rating-display"
import { EmptyState } from "@/components/common/empty-state"
import { ErrorState } from "@/components/common/error-state"
import { useDeleteCourseEnrollment } from "@/hooks/use-course"
import { toUserMessage } from "@/lib/error-message"
import type { CourseEnrollmentDTO } from "@/api/course"

interface CourseEnrollmentListProps {
  enrollments: CourseEnrollmentDTO[]
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  emptyAction?: ReactNode
}

function CourseEnrollmentSkeleton() {
  return (
    <div className="space-y-2 border-b p-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-44" />
    </div>
  )
}

export function CourseEnrollmentList({
  enrollments,
  isLoading,
  error,
  onRetry,
  emptyAction,
}: CourseEnrollmentListProps) {
  const deleteMutation = useDeleteCourseEnrollment()

  if (isLoading) {
    return (
      <div className="border-t">
        {Array.from({ length: 6 }).map((_, i) => (
          <CourseEnrollmentSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />
  }

  if (enrollments.length === 0) {
    return (
      <EmptyState
        icon={<RiCalendarLine />}
        title="暂无选课记录"
        description="同步课表后，这里会显示你修读过的课程"
        action={emptyAction}
      />
    )
  }

  return (
    <div className="border-t">
      {enrollments.map((enrollment) => {
        const course = enrollment.course
        return (
          <div
            key={enrollment.id}
            className="flex items-center gap-3 border-b p-2 transition-colors hover:bg-muted/40"
          >
            <Link
              to="/course/$courseID"
              params={{ courseID: String(course.id) }}
              className="min-w-0 flex-1 space-y-2 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <span className="shrink-0 font-mono">{course.code}</span>
                <span className="min-w-0 wrap-break-word">
                  {course.main_teacher.name}
                </span>
              </div>
              <div className="leading-tight font-semibold wrap-break-word whitespace-normal">
                {course.name}
              </div>
              <div className="text-sm text-muted-foreground">
                {course.department}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <CourseSemesterBadge semester={enrollment.semester} />
                <CourseBadges
                  credit={course.credit}
                  language={course.language}
                  categories={course.categories}
                  categoryLimit={2}
                  className="gap-1"
                />
              </div>
            </Link>
            <div className="shrink-0 self-center">
              <RatingDisplay rating={course.rating} size="sm" />
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 self-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost-destructive"
                    size="icon-sm"
                    aria-label="删除选课记录"
                  >
                    <RiDeleteBinLine />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogTitle>删除选课记录</AlertDialogTitle>
                    <AlertDialogDescription>
                      将删除「{course.name}」{enrollment.semester}{" "}
                      学期的选课记录，之后可通过同步课表重新导入。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        deleteMutation.mutate(enrollment.id, {
                          onSuccess: () => toast.success("已删除选课记录"),
                          onError: (err) =>
                            toast.error(
                              toUserMessage(err, "删除失败，请稍后再试")
                            ),
                        })
                      }
                    >
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )
      })}
    </div>
  )
}
