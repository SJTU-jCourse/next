import { useState } from "react"
import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { RiFilterLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { FilterItem } from "@/api/teacher"
import type { TeacherFilters as TeacherFiltersDTO } from "@/api/teacher"

const ALL = "__all__"
const routeApi = getRouteApi("/app/teacher")
type TeacherSearch = ReturnType<typeof routeApi.useSearch>
type FilterKey = keyof Pick<TeacherSearch, "department" | "title">

interface TeacherFiltersProps {
  filters: TeacherFiltersDTO
}

export function TeacherFilters({ filters }: TeacherFiltersProps) {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/teacher" })
  const [mobileOpen, setMobileOpen] = useState(false)

  function updateFilter(key: FilterKey, value: string | null) {
    void navigate({
      search: (prev) => ({
        ...prev,
        [key]: !value || value === ALL ? undefined : value,
        page: 1,
      }),
      resetScroll: false,
    })
  }

  const content = (
    <div className="space-y-4">
      {filters.departments && (
        <FilterSelectGroup
          label="学院"
          items={filters.departments}
          paramKey="department"
          selected={search.department ?? null}
          onChange={updateFilter}
        />
      )}

      {filters.titles && (
        <FilterSelectGroup
          label="职称"
          items={filters.titles}
          paramKey="title"
          selected={search.title ?? null}
          onChange={updateFilter}
        />
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          void navigate({
            search: {
              q: search.q,
              department: undefined,
              title: undefined,
              page: 1,
            },
            resetScroll: false,
          })
        }}
      >
        清除筛选
      </Button>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:block">{content}</aside>
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <RiFilterLine data-icon="inline-start" />
              筛选
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>筛选教师</SheetTitle>
            </SheetHeader>
            <ScrollArea className="mt-3 h-[calc(100vh-6rem)] pr-3 pl-3">
              {content}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}

interface FilterSelectGroupProps {
  label: string
  paramKey: FilterKey
  items?: FilterItem[]
  selected: string | null
  onChange: (key: FilterKey, value: string | null) => void
}

function FilterSelectGroup({
  label,
  paramKey,
  items,
  selected,
  onChange,
}: FilterSelectGroupProps) {
  if (!items) return null
  const selectedItem = selected
    ? items.find((item) => item.name === selected)
    : undefined
  const itemClassName =
    "px-2 [&>span:first-child]:hidden [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1"

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={selected ?? ALL}
        onValueChange={(value) => onChange(paramKey, value)}
      >
        <SelectTrigger className="w-full [&>[data-slot=select-value]]:min-w-0 [&>[data-slot=select-value]]:flex-1 [&>[data-slot=select-value]]:gap-0 [&>[data-slot=select-value]>span]:w-full">
          <SelectValue>
            {selectedItem ? (
              <FilterOptionLabel item={selectedItem} />
            ) : (
              (selected ?? `全部${label}`)
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-w-80">
          <SelectItem value={ALL} className={itemClassName}>
            全部{label}
          </SelectItem>
          {items.map((item) => (
            <SelectItem
              key={item.name}
              value={item.name}
              className={itemClassName}
            >
              <FilterOptionLabel item={item} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FilterOptionLabel({ item }: { item: FilterItem }) {
  return (
    <span className="flex w-full min-w-0 items-center justify-between gap-2">
      <span className="min-w-0 truncate">{item.name}</span>
      <span className="shrink-0 text-muted-foreground">{item.count}</span>
    </span>
  )
}
