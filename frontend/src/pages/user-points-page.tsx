import { useState } from "react"
import { PageHeader, SectionHeader } from "@/components/common/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageShell } from "@/components/layout/page-shell"
import { PageTitle } from "@/components/common/page-title"
import { PointRecordList } from "@/components/point/point-record-list"
import { ErrorState } from "@/components/common/error-state"
import { useUserPoints } from "@/hooks/use-point"
import { useAuth } from "@/contexts/auth-context"

export function UserPointsPage() {
  const { user } = useAuth()
  const [page] = useState(1)
  const [pageSize] = useState(20)
  const { data, isLoading, error, refetch } = useUserPoints(user?.id ?? 0, {
    page,
    page_size: pageSize,
  })

  if (!user) {
    return (
      <>
        <PageTitle>我的积分</PageTitle>
        <PageShell>
          <p className="py-12 text-center text-muted-foreground">
            登录后可查看我的积分
          </p>
        </PageShell>
      </>
    )
  }

  return (
    <>
      <PageTitle>我的积分</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <PageHeader
            title="我的积分"
            description={
              <>
                积分可在合作网站兑换，目前支持
                <a
                  href="https://share.dyweb.sjtu.cn"
                  target="_blank"
                  rel="noreferrer"
                  className="mx-1 font-medium text-foreground underline underline-offset-4"
                >
                  传承·交大
                </a>
              </>
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>当前积分</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : !data && error ? (
                <span className="text-sm text-muted-foreground">加载失败</span>
              ) : (
                <span className="text-3xl font-bold">{data?.total ?? 0}</span>
              )}
            </CardContent>
          </Card>

          <section className="space-y-3">
            <SectionHeader
              title="积分记录"
              meta={data && `共 ${data.records.total} 条`}
            />
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : !data && error ? (
              <ErrorState error={error} onRetry={() => void refetch()} />
            ) : (
              <PointRecordList records={data?.records.items ?? []} />
            )}
          </section>
        </div>
      </PageShell>
    </>
  )
}
