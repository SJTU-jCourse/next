import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminUsers, useRevokeAdminUser } from "@/hooks/use-admin-user"
import { AdminUserRow } from "./admin-users/admin-user-row"
import { SectionHeader } from "@/components/common/page-header"

interface AdminUsersTabProps {
  currentUserID: number
  currentUserIsSuperAdmin: boolean
}

export function AdminUsersTab({
  currentUserID,
  currentUserIsSuperAdmin,
}: AdminUsersTabProps) {
  const adminsQuery = useAdminUsers()
  const revokeAdminMutation = useRevokeAdminUser()

  async function revokeAdmin(userID: number) {
    await revokeAdminMutation.mutateAsync(userID)
    toast.success("已撤销管理员权限")
  }

  return (
    <section className="space-y-3">
      <SectionHeader
        title="当前管理员"
        meta={adminsQuery.data && `共 ${adminsQuery.data.length} 人`}
      />
      {adminsQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : adminsQuery.data && adminsQuery.data.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>活跃时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminsQuery.data.map((admin) => (
              <AdminUserRow
                key={admin.id}
                admin={admin}
                currentUserID={currentUserID}
                currentUserIsSuperAdmin={currentUserIsSuperAdmin}
                isRevoking={revokeAdminMutation.isPending}
                onRevoke={(userID) => {
                  void revokeAdmin(userID)
                }}
              />
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">暂无管理员</p>
      )}
    </section>
  )
}
