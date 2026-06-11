import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type CourseBadgeKind = "credit" | "language" | "category" | "targetYear"

const courseBadgeClasses: Record<CourseBadgeKind, string> = {
  credit:
    "border-emerald-200/50 bg-emerald-50/40 text-emerald-700/80 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-300/80",
  language:
    "border-sky-200/50 bg-sky-50/40 text-sky-700/80 dark:border-sky-900/40 dark:bg-sky-950/25 dark:text-sky-300/80",
  category:
    "border-amber-200/50 bg-amber-50/40 text-amber-800/75 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-300/80",
  targetYear:
    "border-violet-200/50 bg-violet-50/40 text-violet-800/75 dark:border-violet-900/40 dark:bg-violet-950/25 dark:text-violet-300/80",
}

interface CourseBadgeProps {
  kind: CourseBadgeKind
  children: ReactNode
  className?: string
}

interface CourseBadgesProps {
  credit: number
  language?: string
  categories?: string[]
  targetYears?: string[]
  categoryLimit?: number
  className?: string
}

export function CourseBadge({ kind, children, className }: CourseBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("px-1.5", courseBadgeClasses[kind], className)}
    >
      {children}
    </Badge>
  )
}

interface CourseSemesterBadgeProps {
  semester: string
  className?: string
}

export function CourseSemesterBadge({
  semester,
  className,
}: CourseSemesterBadgeProps) {
  return (
    <CourseBadge
      kind="targetYear"
      className={cn("font-mono font-medium", className)}
    >
      {semester}
    </CourseBadge>
  )
}

export function CourseBadges({
  credit,
  language,
  categories,
  targetYears,
  categoryLimit,
  className,
}: CourseBadgesProps) {
  const visibleCategories =
    categoryLimit === undefined
      ? categories
      : categories?.slice(0, categoryLimit)

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <CourseBadge kind="credit">{credit} 学分</CourseBadge>
      {language && language.trim() && (
        <CourseBadge kind="language">{language}</CourseBadge>
      )}
      {visibleCategories?.map((category) => (
        <CourseBadge key={category} kind="category">
          {category}
        </CourseBadge>
      ))}
      {targetYears?.map((targetYear) => (
        <CourseBadge key={targetYear} kind="targetYear">
          {targetYear}
        </CourseBadge>
      ))}
    </div>
  )
}
