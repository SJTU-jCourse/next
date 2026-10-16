import { getRouteApi, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { RiLockUnlockLine } from "@remixicon/react"
import { PaginationComponent } from "@/components/common/pagination"
import { PointRecordList } from "@/components/point/point-record-list"
import { ReviewList } from "@/components/review/review-list"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AdminUserSearchForm,
  type AdminUserLookupFormValue,
} from "./user-query/admin-user-search-form"
import { AdminUserStatus } from "./user-query/admin-user-status"
import {
  GrantAdminDialog,
  RevokeAdminDialog,
} from "./user-query/admin-permission-dialogs"
import { ResetPasswordDialog } from "./user-query/admin-reset-password-dialog"
import { SuspendUserDialog } from "./user-query/admin-suspend-user-dialog"
import {
  useAdminUser,
  useClearAdminUserSuspension,
  useGrantAdminUser,
  useResetAdminUserPassword,
  useRevokeAdminUser,
  useSuspendAdminUser,
} from "@/hooks/use-admin-user"
import { useUserPoints } from "@/hooks/use-point"
import { useUserReviews } from "@/hooks/use-review"
import { useAuthEmailDomain } from "@/hooks/use-system-settings"
import { getErrorMessage } from "./admin-utils"
import { SectionHeader } from "@/components/common/page-header"

const reviewPageSize = 20
const pointPageSize = 20
const routeApi = getRouteApi("/app/admin/user")

function defaultPasswordFromEmail(email: string, username: string) {
  const source = email.split("@")[0] || username
  return source.trim().toLowerCase()
}

interface AdminUserQueryTabProps {
  currentUserID: number
  currentUserIsSuperAdmin: boolean
}

export function AdminUserQueryTab({
  currentUserID,
  currentUserIsSuperAdmin,
}: AdminUserQueryTabProps) {
  const search = routeApi.useSearch()
  const navigate = useNavigate({ from: "/admin/user" })
  const email = search.email ?? ""
  const username = search.username ?? ""
  const reviewID = search.review_id
  const emailDomain = useAuthEmailDomain()
  const page = Math.max(1, search.page ?? 1)

  const hasLookup = Boolean(email || username || reviewID)
  const userQuery = useAdminUser({ email, username, review_id: reviewID })
  const selectedUser = userQuery.data
  const reviewsQuery = useUserReviews(selectedUser?.id ?? 0, {
    page,
    page_size: reviewPageSize,
    order_by: "created_at",
  })
  const pointsQuery = useUserPoints(selectedUser?.id ?? 0, {
    page: 1,
    page_size: pointPageSize,
  })
  const suspendMutation = useSuspendAdminUser()
  const clearSuspensionMutation = useClearAdminUserSuspension()
  const grantAdminMutation = useGrantAdminUser()
  const revokeAdminMutation = useRevokeAdminUser()
  const resetPasswordMutation = useResetAdminUserPassword()

  function handleSearch(value: AdminUserLookupFormValue) {
    const nextHasLookup = Boolean(
      value.email || value.username || value.review_id
    )
    void navigate({
      search: (prev) => ({
        ...prev,
        email: value.email,
        username: value.username,
        review_id: value.review_id,
        page: nextHasLookup ? 1 : undefined,
        tab: "user",
      }),
      replace: true,
      resetScroll: false,
    })
  }

  function setPage(nextPage: number) {
    void navigate({
      search: (prev) => ({ ...prev, page: nextPage, tab: "user" }),
      replace: true,
      resetScroll: false,
    })
  }

  async function clearSuspension() {
    if (!selectedUser) return
    await clearSuspensionMutation.mutateAsync(selectedUser.id)
    toast.success("已解封该用户")
  }

  async function confirmSuspension(days: number) {
    if (!selectedUser) return

    await suspendMutation.mutateAsync({
      userID: selectedUser.id,
      cmd: { days },
    })
    toast.success(`已封禁该用户 ${days} 天`)
  }

  async function grantAdmin() {
    if (!selectedUser) return
    await grantAdminMutation.mutateAsync(selectedUser.id)
    toast.success("已授予管理员权限")
  }

  async function revokeAdmin(userID: number) {
    await revokeAdminMutation.mutateAsync(userID)
    toast.success("已撤销管理员权限")
  }

  async function confirmResetPassword(password: string) {
    if (!selectedUser) return

    await resetPasswordMutation.mutateAsync({
      userID: selectedUser.id,
      cmd: { password },
    })
    toast.success("已重置该用户的密码")
  }

  const isMutating =
    suspendMutation.isPending ||
    clearSuspensionMutation.isPending ||
    grantAdminMutation.isPending ||
    revokeAdminMutation.isPending ||
    resetPasswordMutation.isPending
  const selectedUserIsAdmin = selectedUser?.is_admin() ?? false
  const selectedUserIsSuperAdmin = selectedUser?.is_super_admin() ?? false
  const selectedUserIsSelf = selectedUser?.id === currentUserID

  return (
    <section className="space-y-6">
      <SectionHeader title="查询条件" />

      <AdminUserSearchForm
        key={`${email}:${username}:${reviewID ?? ""}:${emailDomain}`}
        email={email}
        username={username}
        reviewID={reviewID}
        emailDomain={emailDomain}
        onSearch={handleSearch}
      />

      {userQuery.isLoading && hasLookup ? (
        <Skeleton className="h-36 w-full" />
      ) : null}

      {userQuery.isError && hasLookup ? (
        <p className="text-sm text-destructive">
          {getErrorMessage(userQuery.error)}
        </p>
      ) : null}

      {selectedUser ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-y py-4">
            <AdminUserStatus user={selectedUser} />

            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedUserIsSelf ? (
                <p className="text-sm text-muted-foreground">
                  不能操作自己的账号
                </p>
              ) : selectedUserIsSuperAdmin ? (
                <p className="text-sm text-muted-foreground">
                  不能修改超级管理员权限
                </p>
              ) : !currentUserIsSuperAdmin ? (
                <p className="text-sm text-muted-foreground">
                  需要超级管理员权限
                </p>
              ) : selectedUserIsAdmin ? (
                <RevokeAdminDialog
                  username={selectedUser.username}
                  disabled={isMutating}
                  onConfirm={() => {
                    void revokeAdmin(selectedUser.id)
                  }}
                />
              ) : (
                <GrantAdminDialog
                  username={selectedUser.username}
                  disabled={isMutating}
                  onConfirm={() => {
                    void grantAdmin()
                  }}
                />
              )}

              {currentUserIsSuperAdmin && !selectedUserIsSelf ? (
                <ResetPasswordDialog
                  key={selectedUser.id}
                  userID={selectedUser.id}
                  defaultPassword={defaultPasswordFromEmail(
                    selectedUser.email,
                    selectedUser.username
                  )}
                  disabled={isMutating}
                  isPending={resetPasswordMutation.isPending}
                  isError={resetPasswordMutation.isError}
                  errorMessage={getErrorMessage(resetPasswordMutation.error)}
                  onSubmit={confirmResetPassword}
                />
              ) : null}

              {!selectedUserIsSelf &&
                (selectedUserIsAdmin ? (
                  <p className="text-sm text-muted-foreground">
                    管理员不能被封禁
                  </p>
                ) : selectedUser.suspended ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearSuspension}
                    disabled={isMutating}
                  >
                    <RiLockUnlockLine />
                    解封用户
                  </Button>
                ) : (
                  <SuspendUserDialog
                    userID={selectedUser.id}
                    disabled={isMutating}
                    isPending={suspendMutation.isPending}
                    isError={suspendMutation.isError}
                    errorMessage={getErrorMessage(suspendMutation.error)}
                    onSubmit={confirmSuspension}
                  />
                ))}
            </div>
          </div>

          <div className="space-y-3">
            <SectionHeader
              title="积分记录"
              meta={
                pointsQuery.data &&
                `当前 ${pointsQuery.data.total} 积分，共 ${pointsQuery.data.records.total} 条`
              }
            />

            {pointsQuery.isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : pointsQuery.isError ? (
              <p className="text-sm text-destructive">
                {getErrorMessage(pointsQuery.error)}
              </p>
            ) : (
              <PointRecordList
                records={pointsQuery.data?.records.items ?? []}
              />
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <SectionHeader
              title="点评记录"
              meta={reviewsQuery.data && `共 ${reviewsQuery.data.total} 条`}
            />

            <ReviewList
              reviews={reviewsQuery.data?.items ?? []}
              isLoading={reviewsQuery.isLoading}
              showCourse
              emptyText="该用户暂无点评"
            />

            {reviewsQuery.data && reviewsQuery.data.total > reviewPageSize ? (
              <PaginationComponent
                page={reviewsQuery.data.page}
                pageSize={reviewsQuery.data.page_size}
                total={reviewsQuery.data.total}
                onPageChange={setPage}
              />
            ) : null}
          </div>
        </section>
      ) : null}
    </section>
  )
}
