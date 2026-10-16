import type { CourseDetailDTO } from "@/api/course"
import { brand } from "@/config/brand"

export const REVIEW_PAGE_SIZE = 10

export function byRatingDesc(
  a: { rating: { score: number } },
  b: { rating: { score: number } }
) {
  return b.rating.score - a.rating.score
}

export function buildFeedbackMailto(course: CourseDetailDTO) {
  const subject = `[课程信息反馈] ${course.code} ${course.name}`
  const courseURL =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/course/${course.id}`
  const teacherNames =
    course.teacher_group && course.teacher_group.length > 0
      ? course.teacher_group.map((teacher) => teacher.name).join(" / ")
      : course.main_teacher.name
  const targetYears = course.target_years?.join("、") || "未提供"
  const categories = course.categories?.join("、") || "未提供"
  const body = [
    "请在这里描述需要反馈的问题：",
    "\n",
    "课程基本信息",
    `课程 ID：${course.id}`,
    `课程号：${course.code}`,
    `课程名称：${course.name}`,
    `开课单位：${course.department}`,
    `学分：${course.credit}`,
    `授课语言：${course.language}`,
    `面向年级：${targetYears}`,
    `课程类别：${categories}`,
    `最近开课学期：${course.last_semester}`,
    `主讲教师：${course.main_teacher.name}`,
    `合上教师：${teacherNames}`,
    courseURL ? `课程链接：${courseURL}` : undefined,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n")

  // URLSearchParams 会把空格编码成 “+”，部分邮件客户端会原样显示，因此逐项编码
  return `mailto:${brand.feedbackEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`
}
