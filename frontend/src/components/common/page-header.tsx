import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

/** 页面主标题：所有列表页、个人页、管理页共用，保证 h1 字号/字重/间距一致 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}

type SectionHeaderProps = {
  title: ReactNode
  /** 紧跟标题的辅助信息，如“共 N 条点评” */
  meta?: ReactNode
  /** 右侧操作，如“查看更多”链接或按钮 */
  actions?: ReactNode
  as?: "h2" | "h3"
  className?: string
}

/** 区块标题：页面内的二级标题统一为 text-lg font-semibold，计数在左、操作在右 */
export function SectionHeader({
  title,
  meta,
  actions,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2",
        className
      )}
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
        <Heading className="text-lg font-semibold">{title}</Heading>
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
