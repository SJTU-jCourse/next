import type { ReactNode } from "react"
import {
  RiErrorWarningLine,
  RiFileUnknowLine,
  RiRefreshLine,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { toUserMessage } from "@/lib/error-message"
import { cn } from "@/lib/utils"

type ErrorStateProps = {
  error?: unknown
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  error,
  title = "加载失败",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <Empty className={cn("py-10", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiErrorWarningLine />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {toUserMessage(error, "请检查网络后重试")}
        </EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RiRefreshLine data-icon="inline-start" />
            重试
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

type NotFoundStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function NotFoundState({
  title,
  description,
  action,
  className,
}: NotFoundStateProps) {
  return (
    <Empty className={cn("py-16", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RiFileUnknowLine />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
