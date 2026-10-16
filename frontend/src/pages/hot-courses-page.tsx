import { useState } from "react"
import { PageHeader } from "@/components/common/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { HotCourseList } from "@/components/course/hot-course-list"
import { useHotCourses } from "@/hooks/use-course"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

function formatHotPeriodDescription(
  period: "week" | "month",
  periodKey?: string
) {
  if (!periodKey) return ""
  const [year, value] = periodKey.split("-")
  const number = Number(value)
  if (!year || !Number.isFinite(number)) return ""
  if (period === "week") return `${year} 年第 ${number} 周`
  return `${year} 年 ${number} 月`
}

export function HotCoursesPage() {
  const [period, setPeriod] = useState<"week" | "month">("week")
  const { data, isLoading, error, refetch } = useHotCourses(period, 50)
  const periodDescription = formatHotPeriodDescription(period, data?.period_key)

  return (
    <>
      <PageTitle>热门课程</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <PageHeader title="热门课程" description="浏览近期热度最高的课程" />

          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as "week" | "month")}
          >
            <TabsList>
              <TabsTrigger value="week">本周</TabsTrigger>
              <TabsTrigger value="month">本月</TabsTrigger>
            </TabsList>
            {periodDescription ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {periodDescription}
              </p>
            ) : null}
            <TabsContent value={period}>
              <HotCourseList
                period={period}
                limit={50}
                skeletonCount={10}
                data={data}
                isLoading={isLoading}
                error={error}
                onRetry={() => void refetch()}
                fetchData={false}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageShell>
    </>
  )
}
