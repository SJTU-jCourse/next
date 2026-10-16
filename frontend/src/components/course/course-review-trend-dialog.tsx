import { useMemo, useState } from "react"
import { RiLineChartLine } from "@remixicon/react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useCourseReviewTrend } from "@/hooks/use-course"

interface CourseReviewTrendDialogProps {
  courseID: number
  courseName: string
}

export function CourseReviewTrendDialog({
  courseID,
  courseName,
}: CourseReviewTrendDialogProps) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useCourseReviewTrend(courseID, open)
  const chartData = useMemo(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        avg: Math.round(item.avg * 100) / 100,
      })),
    [data]
  )
  const maxCount = Math.max(1, ...chartData.map((item) => item.count))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">
          <RiLineChartLine data-icon="inline-start" />
          趋势
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>点评趋势</DialogTitle>
          <DialogDescription>{courseName}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="var(--color-border)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="semester"
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  minTickGap={10}
                />
                <YAxis
                  yAxisId="avg"
                  domain={[0, 5]}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(value) => Number(value).toFixed(1)}
                  width={36}
                />
                <YAxis
                  yAxisId="count"
                  orientation="right"
                  domain={[0, maxCount]}
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-card)",
                    color: "var(--color-card-foreground)",
                  }}
                  formatter={(value, name) => {
                    if (name === "avg") {
                      return [Number(value).toFixed(1), "平均评分"]
                    }
                    return [`${Number(value)} 条`, "点评数量"]
                  }}
                />
                <Legend
                  formatter={(value) =>
                    value === "avg" ? "平均评分" : "点评数量"
                  }
                />
                <Line
                  yAxisId="avg"
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Bar
                  yAxisId="count"
                  dataKey="count"
                  fill="var(--color-chart-3)"
                  radius={[4, 4, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            暂无趋势数据
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
