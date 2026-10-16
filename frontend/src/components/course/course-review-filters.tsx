import { RiThumbUpLine, RiTimeLine } from "@remixicon/react"
import type { FilterItem } from "@/api/types"
import type { ReviewListFilter } from "@/api/review"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ALL = "all"

type ReviewSort = NonNullable<ReviewListFilter["order_by"]>

interface CourseReviewFilterValue {
  semester?: string
  rating?: number
  orderBy: ReviewSort
}

interface CourseReviewFiltersProps {
  semesters?: FilterItem[]
  ratings?: FilterItem[]
  value: CourseReviewFilterValue
  onChange: (next: Partial<CourseReviewFilterValue>) => void
}

function OptionLabel({ label, count }: { label: string; count: number }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate">{label}</span>
      <span className="shrink-0 text-sm text-muted-foreground">
        （{count} 条点评）
      </span>
    </span>
  )
}

export function CourseReviewFilters({
  semesters,
  ratings,
  value,
  onChange,
}: CourseReviewFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {semesters && (
        <Select
          value={value.semester ?? ALL}
          onValueChange={(semester) =>
            onChange({ semester: semester === ALL ? undefined : semester })
          }
        >
          <SelectTrigger size="sm" className="w-55">
            <SelectValue placeholder="学期" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部学期</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.name} value={semester.name}>
                <OptionLabel label={semester.name} count={semester.count} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {ratings && (
        <Select
          value={value.rating ? String(value.rating) : ALL}
          onValueChange={(rating) =>
            onChange({ rating: rating === ALL ? undefined : Number(rating) })
          }
        >
          <SelectTrigger size="sm" className="w-42.5">
            <SelectValue placeholder="评分" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>全部评分</SelectItem>
            {ratings.map((rating) => (
              <SelectItem key={rating.name} value={rating.name}>
                <OptionLabel label={`${rating.name} 星`} count={rating.count} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-1">
        <span className="px-1 text-sm text-muted-foreground">排序</span>
        <Tabs
          value={value.orderBy}
          onValueChange={(orderBy) =>
            onChange({ orderBy: orderBy as ReviewSort })
          }
          className="gap-0"
        >
          <TabsList>
            <TabsTrigger value="updated_at" className="gap-1">
              <RiTimeLine className="size-3" data-icon="inline-start" />
              最新
            </TabsTrigger>
            <TabsTrigger value="like_count" className="gap-1">
              <RiThumbUpLine className="size-3" data-icon="inline-start" />
              获赞最多
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
