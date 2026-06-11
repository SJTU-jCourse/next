import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { CourseSearchBar } from "@/components/course/course-search-bar"
import { CourseList } from "@/components/course/course-list"
import { CourseFilters } from "@/components/course/course-filters"
import { PaginationComponent } from "@/components/common/pagination"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { useCourseFilters, useCourses } from "@/hooks/use-course"
import { cn } from "@/lib/utils"
import type { CourseListFilter } from "@/api/course"

const routeApi = getRouteApi("/app/course")

export function CoursesPage() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/course" })

  function toFilter() {
    return {
      q: search.q,
      department: search.department,
      language: search.language,
      categories: search.categories,
      target_years: search.target_years,
      credit: search.credit,
      order_by: search.order_by as CourseListFilter["order_by"] | undefined,
      page: search.page,
      page_size: 20,
    }
  }

  const filter = toFilter()
  const { data: filters } = useCourseFilters()
  const { data, isLoading } = useCourses(filter)

  function handlePageChange(page: number) {
    void navigate({
      search: (prev) => ({ ...prev, page }),
      resetScroll: true,
    })
  }

  return (
    <>
      <PageTitle>课程</PageTitle>
      <PageShell>
        <div className="space-y-4 lg:flex lg:flex-col lg:gap-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">课程</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              浏览和搜索所有课程
            </p>
          </div>

          <CourseSearchBar />

          <div className="flex flex-col gap-4 lg:flex-row">
            {filters && (
              <div className="w-full shrink-0 lg:w-1/4">
                <CourseFilters filters={filters} />
              </div>
            )}

            <div
              className={cn(
                "min-w-0 flex-1 space-y-3",
                filters && "lg:border-l lg:pl-4"
              )}
            >
              {data && (
                <div className="text-sm text-muted-foreground">
                  共 {data.total} 门课程
                </div>
              )}

              <CourseList courses={data?.items ?? []} isLoading={isLoading} />

              {data && data.total > 0 && (
                <div className="flex justify-center pt-3">
                  <PaginationComponent
                    page={data.page}
                    pageSize={data.page_size}
                    total={data.total}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  )
}
