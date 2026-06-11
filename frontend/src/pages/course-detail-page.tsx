import { useState } from "react"
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import {
  RiAddLine,
  RiArrowLeftLine,
  RiEditLine,
  RiMailLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CourseCompactCard,
  SameCodeCourseCard,
} from "@/components/course/course-compact-card"
import {
  CourseBadge,
  CourseBadges,
  CourseSemesterBadge,
} from "@/components/course/course-badges"
import { CourseHeaderMeta } from "@/components/course/course-header-meta"
import { CourseNotificationControl } from "@/components/course/course-notification-control"
import { CourseModeratorRemarkDialog } from "@/components/course/course-moderator-remark-dialog"
import { CourseReviewTrendDialog } from "@/components/course/course-review-trend-dialog"
import { RatingDistribution } from "@/components/course/rating-distribution"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import type { CourseDetailDTO } from "@/api/course"
import {
  useCourseDetail,
  useCourseReviewFilters,
  useCourseReviews,
} from "@/hooks/use-course"
import { useAuth } from "@/contexts/auth-context"
import { ReviewList } from "@/components/review/review-list"
import { ReviewCard } from "@/components/review/review-card"
import { CourseReviewFilters } from "@/components/course/course-review-filters"
import { PaginationComponent } from "@/components/common/pagination"
import { brand } from "@/config/brand"
import { getCourseSemesters } from "@/lib/course-semesters"
import { cn } from "@/lib/utils"

const REVIEW_PAGE_SIZE = 10
const routeApi = getRouteApi("/app/course/$courseID")

function byRatingDesc(
  a: { rating: { score: number } },
  b: { rating: { score: number } }
) {
  return b.rating.score - a.rating.score
}

function buildFeedbackMailto(course: CourseDetailDTO) {
  const subject = `[JCourse课程信息反馈] ${course.code} ${course.name}`
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
    "",
    "课程基本信息",
    `课程ID：${course.id}`,
    `课程代码：${course.code}`,
    `课程名称：${course.name}`,
    `院系：${course.department}`,
    `学分：${course.credit}`,
    `授课语言：${course.language}`,
    `面向对象：${targetYears}`,
    `课程分类：${categories}`,
    `最近学期：${course.last_semester}`,
    `主讲教师：${course.main_teacher.name}`,
    `合上教师：${teacherNames}`,
    courseURL ? `课程链接：${courseURL}` : undefined,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n")

  return `mailto:${brand.feedbackEmail}?${new URLSearchParams({
    subject,
    body,
  }).toString()}`
}

function CourseModeratorRemark({ course }: { course: CourseDetailDTO }) {
  const trimmed = (course.moderator_remark ?? "").trim()
  if (!trimmed) return null

  return (
    <section className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
      <div className="whitespace-pre-wrap text-foreground/90">{trimmed}</div>
    </section>
  )
}

function CourseModeratorRemarkButton({ course }: { course: CourseDetailDTO }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="修改管理员备注"
        title="修改管理员备注"
      >
        <RiEditLine data-icon="inline-start" />
      </Button>
      <CourseModeratorRemarkDialog
        course={course}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

export function CourseDetailPage() {
  const { courseID } = routeApi.useParams()
  const id = Number(courseID)
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/course/$courseID" })

  const reviewPage = Math.max(1, search.page ?? 1)
  const semester = search.semester
  const parsedRating = search.rating
  const rating =
    parsedRating && parsedRating >= 1 && parsedRating <= 5
      ? parsedRating
      : undefined
  const orderBy = search.order_by === "like_count" ? "like_count" : "updated_at"

  const { user } = useAuth()
  const { data: course, isLoading } = useCourseDetail(id)
  const { data: reviewFilters } = useCourseReviewFilters(id)
  const { data: reviews, isLoading: reviewsLoading } = useCourseReviews(id, {
    semester,
    rating,
    order_by: orderBy,
    page: reviewPage,
    page_size: REVIEW_PAGE_SIZE,
  })

  function updateReviewParams(next: Record<string, string | undefined>) {
    void navigate({
      search: (prev) => ({
        ...prev,
        semester: "semester" in next ? next.semester : prev.semester,
        rating:
          "rating" in next
            ? next.rating === undefined
              ? undefined
              : Number(next.rating)
            : prev.rating,
        order_by:
          "order_by" in next
            ? next.order_by === "like_count" ||
              next.order_by === "created_at" ||
              next.order_by === "updated_at"
              ? next.order_by
              : undefined
            : prev.order_by,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  function handlePageChange(page: number) {
    void navigate({
      search: (prev) => ({ ...prev, page }),
      resetScroll: true,
    })
  }

  if (isLoading) {
    return (
      <>
        <PageTitle>课程</PageTitle>
        <PageShell>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </PageShell>
      </>
    )
  }

  if (!course) {
    return (
      <>
        <PageTitle>课程</PageTitle>
        <PageShell>
          <div className="py-16 text-center">
            <p className="text-muted-foreground">课程不存在</p>
            <Button asChild variant="link" className="mt-4">
              <Link to="/course">返回课程列表</Link>
            </Button>
          </div>
        </PageShell>
      </>
    )
  }

  const listedReviews =
    reviews?.items.filter((review) => review.id !== course.my_review?.id) ?? []
  const courseSemesters = getCourseSemesters(course)
  const selectedSemesters = [
    ...new Set((course.my_enrollments ?? []).map((item) => item.semester)),
  ].sort((a, b) => b.localeCompare(a))
  const teacherGroup = course.teacher_group ?? []
  const feedbackMailto = buildFeedbackMailto(course)
  const isAdmin = user?.is_admin() ?? false
  const hasRelatedCourses =
    course.same_code_courses.length > 0 ||
    course.same_teacher_courses.length > 0

  return (
    <>
      <PageTitle>{course.name}</PageTitle>
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to="/course">
            <RiArrowLeftLine data-icon="inline-start" />
            返回课程列表
          </Link>
        </Button>

        <div
          className={cn(
            "space-y-4",
            hasRelatedCourses && "lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0"
          )}
        >
          <div
            className={cn("space-y-4", hasRelatedCourses && "lg:col-span-2")}
          >
            <div className="space-y-4">
              <CourseHeaderMeta course={course} />

              <div className="space-y-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(17rem,min(22rem,46%))] md:items-start md:gap-4 md:space-y-0">
                <div className="space-y-4 sm:ml-1 md:ml-2">
                  <CourseBadges
                    credit={course.credit}
                    language={course.language}
                    categories={course.categories}
                  />

                  <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                    <span>开课单位</span>
                    <span className="font-medium">{course.department}</span>
                  </div>

                  {course.target_years && course.target_years.length > 0 && (
                    <section className="flex flex-wrap items-center gap-1.5 text-sm">
                      <h2 className="text-sm text-muted-foreground">
                        面向年级
                      </h2>
                      {course.target_years.map((targetYear) => (
                        <CourseBadge key={targetYear} kind="targetYear">
                          {targetYear}
                        </CourseBadge>
                      ))}
                    </section>
                  )}

                  {teacherGroup.length > 1 && (
                    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                      <span>合上教师</span>
                      {teacherGroup.map((teacher, index) => (
                        <span
                          key={teacher.id}
                          className="inline-flex items-baseline"
                        >
                          {index > 0 && <span className="mr-2">/</span>}
                          <Link
                            to="/teacher/$teacherID"
                            params={{ teacherID: String(teacher.id) }}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {teacher.name}
                          </Link>
                        </span>
                      ))}
                    </div>
                  )}

                  {courseSemesters.length > 0 && (
                    <section className="flex flex-wrap items-center gap-1.5 text-sm">
                      <h2 className="text-sm text-muted-foreground">
                        开课学期
                      </h2>
                      {courseSemesters.map((semester) => (
                        <CourseSemesterBadge
                          key={semester}
                          semester={semester}
                        />
                      ))}
                    </section>
                  )}

                  <CourseModeratorRemark course={course} />

                  {selectedSemesters.length > 0 && (
                    <section className="flex flex-wrap items-center gap-1.5 text-sm">
                      <h2 className="text-sm text-muted-foreground">
                        已选学期
                      </h2>
                      {selectedSemesters.map((semester) => (
                        <CourseSemesterBadge
                          key={semester}
                          semester={semester}
                        />
                      ))}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                      >
                        <Link to="/course/mine" search={{ type: "enrolled" }}>
                          查看全部
                        </Link>
                      </Button>
                    </section>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5">
                    <CourseNotificationControl
                      courseID={course.id}
                      level={course.notification_level}
                    />
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 text-muted-foreground hover:text-foreground"
                    >
                      <a href={feedbackMailto}>
                        <RiMailLine data-icon="inline-start" />
                        反馈
                      </a>
                    </Button>
                    {isAdmin && <CourseModeratorRemarkButton course={course} />}
                  </div>
                </div>

                <div className="md:self-start md:border-l md:pl-4">
                  <Card className="shadow-none ring-0">
                    <CardContent className="py-0">
                      <RatingDistribution rating={course.rating} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <section>
              {course.my_review && (
                <div className="mb-4">
                  <h2 className="mb-2 text-lg font-semibold">我的点评</h2>
                  <div className="border-t">
                    <ReviewCard review={course.my_review} />
                  </div>
                </div>
              )}

              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-semibold">课程点评</h2>
                  {reviews && (
                    <p className="text-sm text-muted-foreground">
                      共 {reviews.total} 条点评
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <CourseReviewTrendDialog
                    courseID={course.id}
                    courseName={course.name}
                  />
                  {!course.my_review && (
                    <Button asChild size="sm">
                      <Link
                        to="/course/$courseID/review/new"
                        params={{ courseID: String(course.id) }}
                      >
                        <RiAddLine data-icon="inline-start" />
                        写点评
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <CourseReviewFilters
                  semesters={reviewFilters?.semesters}
                  ratings={reviewFilters?.ratings}
                  value={{
                    semester,
                    rating,
                    orderBy,
                  }}
                  onChange={(next) => {
                    const params: Record<string, string | undefined> = {}
                    if ("semester" in next) params.semester = next.semester
                    if ("rating" in next) {
                      params.rating =
                        next.rating === undefined
                          ? undefined
                          : String(next.rating)
                    }
                    if ("orderBy" in next) params.order_by = next.orderBy
                    updateReviewParams(params)
                  }}
                />
              </div>
              <ReviewList
                reviews={listedReviews}
                isLoading={reviewsLoading}
                emptyText={
                  course.my_review ? "还没有其他点评" : "还没有点评，来抢沙发？"
                }
              />

              {reviews && reviews.total > 0 && (
                <div className="flex justify-center pt-3">
                  <PaginationComponent
                    page={reviews.page}
                    pageSize={reviews.page_size}
                    total={reviews.total}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </section>
          </div>

          {hasRelatedCourses && (
            <aside className="space-y-4 lg:border-l lg:pl-4">
              {course.same_code_courses.length > 0 && (
                <section>
                  <h2 className="mb-2 text-lg font-semibold">
                    其他老师的{course.name}
                  </h2>
                  <div className="border-t">
                    {[...course.same_code_courses]
                      .sort(byRatingDesc)
                      .map((c) => (
                        <SameCodeCourseCard key={c.id} course={c} />
                      ))}
                  </div>
                </section>
              )}

              {course.same_teacher_courses.length > 0 && (
                <section>
                  <h2 className="mb-2 text-lg font-semibold">
                    {course.main_teacher.name}的其他课
                  </h2>
                  <div className="border-t">
                    {[...course.same_teacher_courses]
                      .sort(byRatingDesc)
                      .map((c) => (
                        <CourseCompactCard key={c.id} course={c} />
                      ))}
                  </div>
                </section>
              )}
            </aside>
          )}
        </div>
      </PageShell>
    </>
  )
}
