import { Link } from "@tanstack/react-router"
import { RiArrowRightLine, RiErrorWarningLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import type { CourseDetailDTO, CourseListItemDTO } from "@/api/course"

interface WrongCourseWarningProps {
  course?: CourseDetailDTO | null
  currentSemester?: string | null
}

function findUpdatedSameTeacherCourses(
  course: CourseDetailDTO,
  currentSemester: string
) {
  if (!course.last_semester || course.last_semester >= currentSemester) {
    return []
  }

  return course.same_teacher_courses
    .filter(
      (candidate) =>
        candidate.name === course.name &&
        candidate.code !== course.code &&
        candidate.last_semester > course.last_semester
    )
    .sort(byLastSemesterDesc)
}

function findUpdatedSameCodeCourses(
  course: CourseDetailDTO,
  currentSemester: string
) {
  if (!course.last_semester || course.last_semester >= currentSemester) {
    return []
  }

  return course.same_code_courses
    .filter(
      (candidate) =>
        candidate.main_teacher.id !== course.main_teacher.id &&
        candidate.last_semester > course.last_semester
    )
    .sort(byLastSemesterDesc)
}

function findUpdatedCourseCandidates(
  course: CourseDetailDTO,
  currentSemester: string
) {
  return [
    ...findUpdatedSameTeacherCourses(course, currentSemester),
    ...findUpdatedSameCodeCourses(course, currentSemester),
  ].sort(byLastSemesterDesc)
}

function byLastSemesterDesc(a: CourseListItemDTO, b: CourseListItemDTO) {
  if (a.last_semester < b.last_semester) return 1
  if (a.last_semester > b.last_semester) return -1
  return a.code.localeCompare(b.code)
}

export function WrongCourseWarning({
  course,
  currentSemester,
}: WrongCourseWarningProps) {
  if (!course || !currentSemester) return null

  const candidates = findUpdatedCourseCandidates(course, currentSemester)
  if (candidates.length === 0) return null

  return (
    <div
      role="note"
      className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground"
    >
      <div className="space-y-3">
        <div className="flex min-w-0 gap-3">
          <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-warning-foreground">
              可能选错了课程
            </p>
            <p className="leading-6">
              当前课程最近开课学期为 {course.last_semester}
              ，以下课程开课时间更近，可能才是你想点评的课程。
            </p>
          </div>
        </div>
        <div className="divide-y divide-warning/20 border-t border-warning/20 pl-7">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    {candidate.code}
                  </span>
                  <span className="font-medium wrap-break-word">
                    {candidate.name}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  主讲教师：{candidate.main_teacher.name}，最近开课学期：
                  {candidate.last_semester}
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="self-start whitespace-nowrap"
              >
                <Link
                  to="/course/$courseID/review/new"
                  params={{ courseID: String(candidate.id) }}
                >
                  去写点评
                  <RiArrowRightLine data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
