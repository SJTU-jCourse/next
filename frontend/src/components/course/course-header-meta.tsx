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
  /** 表单页中课程信息位于页面标题之下，使用 h2 保持标题层级 */
  headingAs?: "h1" | "h2"
  className?: string
}

export function CourseHeaderMeta({
  course,
  headingAs: Heading = "h1",
  className,
}: CourseHeaderMetaProps) {
  return (
    <header className={cn("space-y-2", className)}>
      <Heading className="text-2xl font-bold">
        <span>{course.name}</span>{" "}
        <span className="font-mono text-sm font-normal whitespace-nowrap text-muted-foreground">
          {course.code}
        </span>
      </Heading>
      <div className="inline-flex items-baseline gap-1.5">
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
