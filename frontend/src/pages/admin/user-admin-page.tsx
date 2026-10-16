import { getRouteApi, useNavigate, Link } from "@tanstack/react-router"
import { AuditLogsTab } from "@/components/admin/audit-logs-tab"
import { AdminUserQueryTab } from "@/components/admin/admin-user-query-tab"
import { AdminUsersTab } from "@/components/admin/admin-users-tab"
import { AnnouncementsTab } from "@/components/admin/announcements-tab"
import { SystemApiKeysTab } from "@/components/admin/system-api-keys-tab"
import { SystemSettingsTab } from "@/components/admin/system-settings-tab"
import { PageTitle } from "@/components/common/page-title"
import { PageShell } from "@/components/layout/page-shell"
import { RiLockLine } from "@remixicon/react"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"

const adminTabs = [
  "user",
  "admin",
  "system-api-key",
  "system-settings",
  "announcement",
  "audit-log",
] as const
type AdminTab = (typeof adminTabs)[number]
const routeApi = getRouteApi("/app/admin/user")

function getAdminTab(value: string | null): AdminTab {
  return adminTabs.includes(value as AdminTab) ? (value as AdminTab) : "user"
}

export function UserAdminPage() {
  const { user } = useAuth()
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/admin/user" })
  const activeTab = getAdminTab(search.tab ?? null)

  function setActiveTab(tab: string) {
    const nextTab = getAdminTab(tab)
    void navigate({
      search: (prev) => ({ ...prev, tab: nextTab }),
      replace: true,
      resetScroll: false,
    })
  }

  if (!user) return null
  if (!user.is_admin()) {
    return (
      <>
        <PageTitle>管理</PageTitle>
        <PageShell>
          <EmptyState
            icon={<RiLockLine />}
            title="需要管理员权限"
            description="此页面仅对管理员开放"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/">返回首页</Link>
              </Button>
            }
          />
        </PageShell>
      </>
    )
  }

  return (
    <>
      <PageTitle>管理</PageTitle>
      <PageShell>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">管理</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
              <TabsTrigger value="user">用户查询</TabsTrigger>
              <TabsTrigger value="admin">管理员查询</TabsTrigger>
              <TabsTrigger value="system-api-key">系统 API Key</TabsTrigger>
              <TabsTrigger value="system-settings">系统设置</TabsTrigger>
              <TabsTrigger value="announcement">公告</TabsTrigger>
              <TabsTrigger value="audit-log">审计日志</TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-6">
              <AdminUserQueryTab
                currentUserID={user.id}
                currentUserIsSuperAdmin={user.is_super_admin()}
              />
            </TabsContent>

            <TabsContent value="admin" className="space-y-3">
              <AdminUsersTab
                currentUserID={user.id}
                currentUserIsSuperAdmin={user.is_super_admin()}
              />
            </TabsContent>

            <TabsContent value="system-api-key" className="space-y-4">
              <SystemApiKeysTab />
            </TabsContent>

            <TabsContent value="system-settings" className="space-y-4">
              <SystemSettingsTab />
            </TabsContent>

            <TabsContent value="announcement" className="space-y-4">
              <AnnouncementsTab />
            </TabsContent>

            <TabsContent value="audit-log" className="space-y-4">
              <AuditLogsTab />
            </TabsContent>
          </Tabs>
        </div>
      </PageShell>
    </>
  )
}
