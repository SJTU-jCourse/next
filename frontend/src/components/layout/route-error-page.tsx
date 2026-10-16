import type { ErrorComponentProps } from "@tanstack/react-router"
import { RiHome4Line, RiRefreshLine } from "@remixicon/react"

import { PageTitle } from "@/components/common/page-title"
import { Button } from "@/components/ui/button"
import { HttpError } from "@/api/client"
import { toUserMessage } from "@/lib/error-message"

export function RouteErrorPage({ error }: ErrorComponentProps) {
  // 只有后端明确返回了中文提示（如账号被封禁）时才展示具体原因
  const detail =
    error instanceof HttpError && error.status < 500
      ? toUserMessage(error, "")
      : ""

  return (
    <>
      <PageTitle>页面加载失败</PageTitle>
      <main className="flex min-h-svh items-center justify-center bg-background px-4 py-12 text-foreground">
        <section className="max-w-xl text-center">
          <div className="inline-flex items-center rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
            页面加载失败
          </div>
          <h1 className="mt-5 text-2xl font-bold">页面暂时无法打开</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            {detail || "可能是网络不稳定或服务暂时不可用，请稍后刷新重试。"}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => window.location.reload()}>
              <RiRefreshLine data-icon="inline-start" />
              刷新页面
            </Button>
            <Button variant="outline" asChild>
              <a href="/">
                <RiHome4Line data-icon="inline-start" />
                返回首页
              </a>
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
