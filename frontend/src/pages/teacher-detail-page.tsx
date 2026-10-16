import { getRouteApi, Link, useNavigate } from "@tanstack/react-router"
import { RiArrowLeftLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { TitleBadge } from "@/components/ui/title-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CourseList } from "@/components/course/course-list"
import { ErrorState, NotFoundState } from "@/components/common/error-state"
import { PaginationComponent } from "@/components/common/pagination"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { isNotFoundError } from "@/lib/error-message"
import { displayTeacherTitle } from "@/lib/utils"
import { useTeacher, useTeacherCourses } from "@/hooks/use-teacher"

type CourseSort = "rating_score" | "rating_count"
const routeApi = getRouteApi("/app/teacher/$teacherID")

export function TeacherDetailPage() {
  const { teacherID } = routeApi.useParams()
  const id = Number(teacherID)
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/teacher/$teacherID" })
  const page = search.page ?? 1
  const orderByParam = search.order_by
  const orderBy: CourseSort | undefined =
    orderByParam === "rating_score" || orderByParam === "rating_count"
      ? orderByParam
      : undefined
  const selectedOrderBy = orderBy ?? "rating_score"
  const {
    data: teacher,
    isLoading: isTeacherLoading,
    error: teacherError,
    refetch: refetchTeacher,
  } = useTeacher(id)
  const { data, isLoading, error, refetch } = useTeacherCourses(id, {
    order_by: orderBy,
    page,
    page_size: 20,
  })
  const teacherTitle = displayTeacherTitle(teacher?.title)

  function updateCourseSort(value: string) {
    const nextOrderBy: CourseSort | undefined =
      value === "rating_count" ? "rating_count" : undefined
    void navigate({
      search: (prev) => ({ ...prev, order_by: nextOrderBy, page: 1 }),
      resetScroll: false,
    })
  }

  function handlePageChange(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p }),
      resetScroll: false,
    })
  }

  return (
    <>
      <PageTitle>{teacher?.name ?? "教师"}</PageTitle>
      <PageShell>
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/teacher">
            <RiArrowLeftLine data-icon="inline-start" />
            返回教师列表
          </Link>
        </Button>

        <div className="space-y-6">
          <header className="space-y-3">
            {isTeacherLoading ? (
              <>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </>
            ) : teacher ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5 font-mono text-sm text-muted-foreground">
                  <span>{teacher.code}</span>
                  {teacherTitle && <TitleBadge>{teacherTitle}</TitleBadge>}
                </div>
                <h1 className="text-3xl font-bold">{teacher.name}</h1>
                {teacher.department && (
                  <div className="text-sm text-muted-foreground">
                    {teacher.department}
                  </div>
                )}
              </>
            ) : teacherError && !isNotFoundError(teacherError) ? (
              <ErrorState
                error={teacherError}
                onRetry={() => void refetchTeacher()}
              />
            ) : (
              <NotFoundState
                title="教师不存在"
                description="该教师信息可能已下线，或链接有误"
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/teacher">返回教师列表</Link>
                  </Button>
                }
              />
            )}
          </header>

          <section>
            <div className="mb-3 space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">开设课程</h2>
                {data && (
                  <span className="text-sm text-muted-foreground">
                    共 {data.total} 门课程
                  </span>
                )}
              </div>
              <div>
                <Tabs value={selectedOrderBy} onValueChange={updateCourseSort}>
                  <TabsList>
                    <TabsTrigger value="rating_score">综合评分</TabsTrigger>
                    <TabsTrigger value="rating_count">点评数量</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <CourseList
              courses={data?.items ?? []}
              isLoading={isLoading}
              error={data ? undefined : error}
              onRetry={() => void refetch()}
              emptyTitle="暂无开设课程"
            />
            {data && data.total > 0 && (
              <div className="flex justify-center pt-4">
                <PaginationComponent
                  page={data.page}
                  pageSize={data.page_size}
                  total={data.total}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </section>
        </div>
      </PageShell>
    </>
  )
}
