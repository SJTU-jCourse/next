import { useCallback } from "react"
import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { DebouncedSearchInput } from "@/components/common/debounced-search-input"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { TeacherFilters } from "@/components/teacher/teacher-filters"
import { TeacherList } from "@/components/teacher/teacher-list"
import { PaginationComponent } from "@/components/common/pagination"
import { useTeacherFilters, useTeachers } from "@/hooks/use-teacher"
import { cn } from "@/lib/utils"

const TEACHER_SEARCH_DEBOUNCE_MS = 250
const routeApi = getRouteApi("/app/teacher")

export function TeachersPage() {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/teacher" })
  const page = search.page ?? 1
  const department = search.department ?? ""
  const title = search.title ?? ""
  const q = search.q ?? ""

  const filter = {
    department: department || undefined,
    title: title || undefined,
    q: q || undefined,
    page,
    page_size: 20,
  }
  const { data: filters, isLoading: filtersLoading } = useTeacherFilters()
  const { data, isLoading } = useTeachers(filter)

  const handleSearchChange = useCallback((value: string) => {
    const nextQ = value.trim()
    if (nextQ === q) return

    void navigate({
      search: (prev) => ({
        ...prev,
        q: nextQ || undefined,
        page: 1,
      }),
      replace: true,
      resetScroll: false,
    })
  }, [navigate, q])

  function handlePageChange(p: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: p }),
      resetScroll: true,
    })
  }

  return (
    <>
      <PageTitle>教师</PageTitle>
      <PageShell>
        <div className="space-y-4 lg:flex lg:flex-col lg:gap-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">教师</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              浏览和搜索所有教师
            </p>
          </div>

          <DebouncedSearchInput
            placeholder="搜索教师姓名、拼音或工号..."
            value={q}
            debounceMs={TEACHER_SEARCH_DEBOUNCE_MS}
            onDebouncedChange={handleSearchChange}
          />

          <div className="flex flex-col gap-4 lg:flex-row">
            {filters && (
              <div className="w-full shrink-0 lg:w-1/4">
                <TeacherFilters filters={filters} />
              </div>
            )}

            <div
              className={cn(
                "min-w-0 flex-1 space-y-3",
                filters && "lg:border-l lg:pl-4"
              )}
            >
              {data && (
                <p className="text-sm text-muted-foreground">
                  共 {data.total} 位教师
                </p>
              )}

              <TeacherList
                teachers={data?.items ?? []}
                isLoading={isLoading || filtersLoading}
              />

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
