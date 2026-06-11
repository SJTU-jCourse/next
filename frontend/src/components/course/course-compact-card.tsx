import { Link } from "@tanstack/react-router"
import { RatingDisplay } from "./rating-display"
import { TitleBadge } from "@/components/ui/title-badge"
import type { CourseListItemDTO } from "@/api/course"
import { cn, displayTeacherTitle } from "@/lib/utils"

interface CourseCompactCardProps {
  course: CourseListItemDTO
  dense?: boolean
  bordered?: boolean
}

export function CourseCompactCard({
  course,
  dense = false,
  bordered = true,
}: CourseCompactCardProps) {
  return (
    <Link
      to="/course/$courseID"
      params={{ courseID: String(course.id) }}
      className={cn(
        "flex items-center transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        dense ? "gap-2 px-2 py-2" : "gap-2.5 px-3 py-2.5",
        bordered && "border-b"
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <span className="shrink-0 font-mono">{course.code}</span>
          <span className="min-w-0 text-sm break-words">
            {course.main_teacher.name}
          </span>
        </div>
        <div className="leading-tight font-semibold break-words whitespace-normal">
          {course.name}
        </div>
        <div className="text-sm text-muted-foreground">{course.department}</div>
      </div>
      <div className="shrink-0">
        <RatingDisplay rating={course.rating} size="sm" />
      </div>
    </Link>
  )
}

interface SameCodeCourseCardProps {
  course: CourseListItemDTO
}

export function SameCodeCourseCard({ course }: SameCodeCourseCardProps) {
  const teacherTitle = displayTeacherTitle(course.main_teacher.title)

  return (
    <Link
      to="/course/$courseID"
      params={{ courseID: String(course.id) }}
      className="block border-b px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1">
            <span className="shrink-0 font-mono text-sm text-muted-foreground">
              {course.main_teacher.code}
            </span>
            {teacherTitle && <TitleBadge>{teacherTitle}</TitleBadge>}
          </div>
          <div className="leading-tight font-semibold">
            {course.main_teacher.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {course.department}
          </div>
        </div>
        <div className="shrink-0">
          <RatingDisplay rating={course.rating} size="sm" />
        </div>
      </div>
    </Link>
  )
}
