import { CourseCompactCard, SameCodeCourseCard } from "./course-compact-card"
import { byRatingDesc } from "./course-detail-utils"
import type { CourseDetailDTO } from "@/api/course"

export function RelatedCoursesSidebar({ course }: { course: CourseDetailDTO }) {
  return (
    <aside className="space-y-6 lg:border-l lg:pl-6">
      {course.same_code_courses.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            其他教师开设的{course.name}
          </h2>
          <div className="border-t">
            {[...course.same_code_courses].sort(byRatingDesc).map((c) => (
              <SameCodeCourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {course.same_teacher_courses.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            {course.main_teacher.name} 的其他课程
          </h2>
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
