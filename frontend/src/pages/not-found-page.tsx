import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"

export function NotFoundPage() {
  return (
    <>
      <PageTitle>页面不存在</PageTitle>
      <PageShell showAnnouncements={false}>
        <div className="mx-auto flex min-h-[calc(100svh-15rem)] max-w-2xl flex-col items-center justify-center py-16 text-center">
          <p className="text-sm font-medium text-primary">404</p>
          <h1 className="mt-3 text-2xl font-bold">页面不存在</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            当前链接可能已失效，或者页面地址输入有误。你可以返回首页，或继续浏览课程信息。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/">返回首页</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/course">浏览课程</Link>
            </Button>
          </div>
        </div>
      </PageShell>
    </>
  )
}
