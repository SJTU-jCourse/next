import { Link } from "@tanstack/react-router"

import { TitleBadge } from "@/components/ui/title-badge"
import type { TeacherDTO } from "@/api/types"
import { cn } from "@/lib/utils"

interface CourseHeaderMetaCourse {
  code: string
  name: string
  main_teacher: TeacherDTO
}

interface CourseHeaderMetaProps {
  course: CourseHeaderMetaCourse
  className?: string
}

export function CourseHeaderMeta({ course, className }: CourseHeaderMetaProps) {
  return (
    <header className={cn("space-y-1.5", className)}>
      <h1 className="text-3xl font-bold">
        <span>{course.name}</span>{" "}
        <span className="font-mono text-sm font-normal whitespace-nowrap text-muted-foreground">
          {course.code}
        </span>
      </h1>
      <div className="inline-flex items-baseline gap-1">
        <Link
          to="/teacher/$teacherID"
          params={{ teacherID: String(course.main_teacher.id) }}
          className="text-lg font-semibold text-primary hover:underline"
        >
          {course.main_teacher.name}
        </Link>
        {course.main_teacher.title && (
          <TitleBadge>{course.main_teacher.title}</TitleBadge>
        )}
      </div>
    </header>
  )
}
