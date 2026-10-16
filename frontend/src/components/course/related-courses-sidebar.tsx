import { CourseCompactCard, SameCodeCourseCard } from "./course-compact-card"
import { byRatingDesc } from "./course-detail-utils"
import type { CourseDetailDTO } from "@/api/course"
import { SectionHeader } from "@/components/common/page-header"

export function RelatedCoursesSidebar({ course }: { course: CourseDetailDTO }) {
  return (
    <aside className="space-y-6 lg:border-l lg:pl-6">
      {course.same_code_courses.length > 0 && (
        <section>
          <SectionHeader
            className="mb-3"
            title={<>其他教师开设的{course.name}</>}
          />
          <div className="border-t">
            {[...course.same_code_courses].sort(byRatingDesc).map((c) => (
              <SameCodeCourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {course.same_teacher_courses.length > 0 && (
        <section>
          <SectionHeader
            className="mb-3"
            title={<>{course.main_teacher.name} 的其他课程</>}
          />
          <div className="border-t">
            {[...course.same_teacher_courses].sort(byRatingDesc).map((c) => (
              <CourseCompactCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </aside>
  )
}
